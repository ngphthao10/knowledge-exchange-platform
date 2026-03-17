'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { AssessmentMessage } from '@/lib/types'

interface AssessmentChatProps {
  skillName: string
  assessmentSessionId?: string
  onComplete?: (level: string, score: number) => void
}

export default function AssessmentChat({ skillName, assessmentSessionId, onComplete }: AssessmentChatProps) {
  const [messages, setMessages] = useState<AssessmentMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [questionNumber, setQuestionNumber] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [result, setResult] = useState<{ score: number; level: string; summary: string } | null>(null)
  const [started, setStarted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (userInput: string) => {
    const newMessages: AssessmentMessage[] = userInput
      ? [...messages, { role: 'user', content: userInput }]
      : messages

    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/ai/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillName, messages: newMessages, assessmentSessionId }),
      })
      const data = await res.json()

      if (data.type === 'assessment_complete') {
        setIsComplete(true)
        setResult({ score: data.score, level: data.level, summary: data.summary })
        onComplete?.(data.level, data.score)
      } else {
        setMessages(prev => [...prev, { role: 'model', content: data.next_question }])
        setQuestionNumber(data.question_number)
      }
    } catch {
      setMessages(prev => [...prev, { role: 'model', content: 'An error occurred. Please try again.' }])
    }

    setIsLoading(false)
  }

  const handleStart = async () => {
    setStarted(true)
    await sendMessage('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage(input.trim())
  }

  const levelMeta: Record<string, { label: string; color: string }> = {
    beginner: { label: 'Beginner', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    intermediate: { label: 'Intermediate', color: 'text-amber-600 bg-amber-50 border-amber-200' },
    advanced: { label: 'Advanced', color: 'text-violet-600 bg-violet-50 border-violet-200' },
  }

  if (!started) {
    return (
      <div className="text-center py-14">
        <div className="w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto mb-5"
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
          <span className="text-2xl">🧠</span>
        </div>
        <h2 className="text-base font-semibold mb-1.5" style={{ color: 'var(--text)' }}>
          AI Assessment: {skillName}
        </h2>
        <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: 'var(--text-3)' }}>
          Answer 5–7 questions so AI can evaluate your real level. Takes about 5–10 minutes.
        </p>
        <button onClick={handleStart}
          className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          Start Assessment
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col rounded-xl border overflow-hidden" style={{ height: 560, borderColor: 'var(--border)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div>
          <h3 className="text-sm font-medium" style={{ color: 'var(--text)' }}>Assessment: {skillName}</h3>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>
            {isComplete ? 'Completed' : `Question ${questionNumber}/7`}
          </p>
        </div>
        {!isComplete && (
          <div className="w-28 rounded-full h-1" style={{ background: 'var(--border-2)' }}>
            <div className="bg-violet-500 h-1 rounded-full transition-all" style={{ width: `${(questionNumber / 7) * 100}%` }} />
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: 'var(--bg)' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-violet-600 text-white rounded-tr-sm'
                : 'border rounded-tl-sm'
            }`}
              style={msg.role !== 'user' ? {
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text-2)',
              } : {}}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="border rounded-2xl rounded-tl-sm px-4 py-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="flex gap-1 items-center">
                {[0, 150, 300].map(delay => (
                  <span key={delay} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--text-3)', animationDelay: `${delay}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {isComplete && result && (
          <div className="border rounded-2xl p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border-2)' }}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Assessment Result</h4>
              <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${levelMeta[result.level]?.color ?? 'text-zinc-400'}`}>
                {levelMeta[result.level]?.label ?? result.level}
              </span>
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-3)' }}>
                <span>Score</span>
                <span className="font-semibold text-violet-600">{result.score}/100</span>
              </div>
              <div className="w-full rounded-full h-1.5" style={{ background: 'var(--surface-2)' }}>
                <div className="bg-violet-500 h-1.5 rounded-full transition-all" style={{ width: `${result.score}%` }} />
              </div>
            </div>
            <p className="text-xs italic" style={{ color: 'var(--text-3)' }}>{result.summary}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!isComplete && (
        <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t flex-shrink-0"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors disabled:opacity-40"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-2)',
              color: 'var(--text)',
            }}
            placeholder="Type your answer..."
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-9 h-9 flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors disabled:opacity-40 flex-shrink-0"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={13} />}
          </button>
        </form>
      )}
    </div>
  )
}
