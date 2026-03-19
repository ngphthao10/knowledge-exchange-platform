'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, MicOff, BrainCircuit, GraduationCap, BookOpen, Loader2, CheckCircle, X, Sparkles } from 'lucide-react'

interface LiveSessionRoomProps {
  sessionId: string
  skillTopic: string
  isTeacher: boolean
  meetLink: string
}

interface Hint {
  id: number
  text: string
  type: 'teacher' | 'learner'
}

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance
  }
}

export default function LiveSessionRoom({ sessionId, skillTopic, isTeacher, meetLink }: LiveSessionRoomProps) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [hints, setHints] = useState<Hint[]>([])
  const [hintCounter, setHintCounter] = useState(0)
  const [loadingHint, setLoadingHint] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const chunkRef = useRef('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fullTranscriptRef = useRef('')

  const supported = typeof window !== 'undefined' &&
    (!!window.SpeechRecognition || !!window.webkitSpeechRecognition)

  const fetchHint = useCallback(async (chunk: string) => {
    if (!chunk.trim() || loadingHint) return
    setLoadingHint(true)
    try {
      const res = await fetch('/api/ai/session-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, transcript: chunk, skillTopic, isFinal: false }),
      })
      const data = await res.json()
      const newHints: Hint[] = []
      if (data.teacherHint) {
        setHintCounter(c => { newHints.push({ id: c + 1, text: data.teacherHint, type: 'teacher' }); return c + 1 })
      }
      if (data.learnerHint) {
        setHintCounter(c => { newHints.push({ id: c + 2, text: data.learnerHint, type: 'learner' }); return c + 2 })
      }
      if (newHints.length > 0) {
        setHints(prev => [...newHints, ...prev].slice(0, 6))
      }
    } catch { /* silent */ }
    setLoadingHint(false)
  }, [sessionId, skillTopic, loadingHint])

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SR) return

    const rec = new SR()
    rec.continuous = true
    rec.interimResults = false
    rec.lang = 'en-US'

    rec.onresult = (e: SpeechRecognitionEvent) => {
      const text = Array.from(e.results)
        .map(r => r[0].transcript)
        .join(' ')
      chunkRef.current += ' ' + text
      fullTranscriptRef.current += ' ' + text
      setTranscript(fullTranscriptRef.current.trim())
    }

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error !== 'no-speech') setError(`Mic error: ${e.error}`)
    }

    rec.onend = () => {
      // auto-restart if still supposed to be listening
      if (recognitionRef.current) {
        try { recognitionRef.current.start() } catch { /* ignore */ }
      }
    }

    recognitionRef.current = rec
    rec.start()
    setListening(true)
    setError('')

    // Every 15s, send chunk to AI
    intervalRef.current = setInterval(() => {
      const chunk = chunkRef.current.trim()
      if (chunk) {
        fetchHint(chunk)
        chunkRef.current = ''
      }
    }, 15000)
  }, [fetchHint])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setListening(false)
  }, [])

  const endSession = useCallback(async () => {
    stopListening()
    setLoadingSummary(true)
    try {
      const res = await fetch('/api/ai/session-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          transcript: fullTranscriptRef.current,
          skillTopic,
          isFinal: true,
        }),
      })
      const data = await res.json()
      setSummary(data.summary || null)
    } catch { setSummary(null) }
    setLoadingSummary(false)
    setDone(true)
  }, [stopListening, sessionId, skillTopic])

  useEffect(() => {
    return () => {
      stopListening()
    }
  }, [stopListening])

  const dismissHint = (id: number) => setHints(prev => prev.filter(h => h.id !== id))

  if (done) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="rounded-2xl border p-6 text-center"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <CheckCircle size={32} className="mx-auto mb-3 text-emerald-500" />
          <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text)' }}>Session complete!</h2>
          <p className="text-xs mb-5" style={{ color: 'var(--text-3)' }}>AI-generated summary saved to your session notes.</p>

          {loadingSummary ? (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-3)' }} />
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>Generating summary…</span>
            </div>
          ) : summary ? (
            <div className="text-left rounded-xl border p-4 mb-4"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border-2)' }}>
              <p className="text-[11px] font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-2)' }}>
                <Sparkles size={11} className="text-violet-500" /> Session Summary
              </p>
              <p className="text-xs whitespace-pre-line leading-relaxed" style={{ color: 'var(--text-2)' }}>
                {summary}
              </p>
            </div>
          ) : null}

          <a href="/sessions"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-all">
            Back to sessions
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header card */}
      <div className="rounded-2xl border p-5"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <BrainCircuit size={16} className="text-violet-500" />
              <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>AI Session Coach</span>
              {loadingHint && <Loader2 size={11} className="animate-spin text-violet-400" />}
            </div>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>{skillTopic}</p>
          </div>
          <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
            listening ? 'bg-red-50 text-red-600' : 'bg-zinc-100 text-zinc-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${listening ? 'bg-red-500 animate-pulse' : 'bg-zinc-400'}`} />
            {listening ? 'Listening' : 'Paused'}
          </span>
        </div>

        <div className="flex gap-2">
          <a href={meetLink} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition-all hover:border-violet-300"
            style={{ borderColor: 'var(--border-2)', color: 'var(--text-2)', background: 'var(--surface-2)' }}>
            Open Meet
          </a>

          {!supported ? (
            <div className="flex-1 text-center py-2 text-xs" style={{ color: 'var(--text-3)' }}>
              Speech API not supported in this browser
            </div>
          ) : listening ? (
            <button onClick={stopListening}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium text-red-600 hover:border-red-300 transition-all"
              style={{ borderColor: 'var(--border-2)', background: 'var(--surface-2)' }}>
              <MicOff size={12} /> Pause mic
            </button>
          ) : (
            <button onClick={startListening}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-all">
              <Mic size={12} /> Start mic
            </button>
          )}

          <button onClick={endSession}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-medium text-emerald-600 hover:border-emerald-400 transition-all"
            style={{ borderColor: 'var(--border-2)', background: 'var(--surface-2)' }}>
            End & summarize
          </button>
        </div>

        {error && (
          <p className="mt-3 text-xs text-red-500">{error}</p>
        )}
      </div>

      {/* Hint panels */}
      {hints.length > 0 && (
        <div className="space-y-2">
          {hints.map(hint => {
            const isTeacherHint = hint.type === 'teacher'
            return (
              <div key={hint.id}
                className="flex items-start gap-2.5 rounded-xl border px-4 py-3 transition-all"
                style={{
                  background: isTeacherHint ? '#ede9fe' : '#f0fdf4',
                  borderColor: isTeacherHint ? '#c4b5fd' : '#a7f3d0',
                }}>
                <div className="flex-shrink-0 mt-0.5">
                  {isTeacherHint
                    ? <GraduationCap size={13} style={{ color: '#7c3aed' }} />
                    : <BookOpen size={13} style={{ color: '#047857' }} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold mb-0.5"
                    style={{ color: isTeacherHint ? '#5b21b6' : '#065f46' }}>
                    {isTeacherHint ? 'For Teacher' : 'For Learner'}
                  </p>
                  <p className="text-xs leading-relaxed"
                    style={{ color: isTeacherHint ? '#4c1d95' : '#064e3b' }}>
                    {hint.text}
                  </p>
                </div>
                <button onClick={() => dismissHint(hint.id)} className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity">
                  <X size={12} style={{ color: isTeacherHint ? '#7c3aed' : '#047857' }} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty hints state */}
      {hints.length === 0 && listening && (
        <div className="rounded-xl border p-6 text-center"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <BrainCircuit size={20} className="mx-auto mb-2 text-violet-300" />
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>
            AI is listening… coaching hints will appear here every ~15 seconds
          </p>
        </div>
      )}

      {/* Live transcript preview */}
      {transcript && (
        <div className="rounded-xl border p-4"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <p className="text-[10px] font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
            Live transcript
          </p>
          <p className="text-xs leading-relaxed line-clamp-3" style={{ color: 'var(--text-2)' }}>
            {transcript}
          </p>
        </div>
      )}
    </div>
  )
}
