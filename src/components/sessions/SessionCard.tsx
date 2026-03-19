'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Video, Clock, GraduationCap, BookOpen, CheckCircle, Star, BrainCircuit } from 'lucide-react'
import Link from 'next/link'
import { Session } from '@/lib/types'

interface SessionCardProps {
  session: Session
  currentUserId: string
  onUpdate: (updated: Session) => void
}

const STATUS_CONFIG = {
  scheduled: { label: 'Upcoming', dot: 'bg-blue-500', color: '#2563eb' },
  completed: { label: 'Completed', dot: 'bg-emerald-500', color: '#059669' },
  cancelled: { label: 'Cancelled', dot: 'bg-zinc-600', color: '#6b7280' },
}

export default function SessionCard({ session, currentUserId, onUpdate }: SessionCardProps) {
  const [notes, setNotes] = useState(session.notes ?? '')
  const [showComplete, setShowComplete] = useState(false)
  const [tempRating, setTempRating] = useState(0)
  const [loading, setLoading] = useState(false)

  const isTeacher = session.teacher_id === currentUserId
  const isPast = new Date(session.scheduled_at) < new Date()
  const status = STATUS_CONFIG[session.status]

  const updateSession = async (data: Partial<Session>) => {
    setLoading(true)
    const res = await fetch('/api/sessions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.id, ...data }),
    })
    const result = await res.json()
    if (result.session) onUpdate(result.session)
    setLoading(false)
    setShowComplete(false)
  }

  return (
    <div className="rounded-xl border transition-all hover:border-[var(--border-2)]"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>
              {session.skill_topic}
            </h3>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-3)' }}>
                <Clock size={10} />
                {format(new Date(session.scheduled_at), "MM/dd 'at' HH:mm")}
                <span className="ml-1">{session.duration_minutes}p</span>
              </span>
              <span className={`flex items-center gap-1 text-[11px] ${isTeacher ? 'text-violet-600' : 'text-pink-600'}`}>
                {isTeacher ? <GraduationCap size={10} /> : <BookOpen size={10} />}
                {isTeacher ? 'Teacher' : 'Learner'}
              </span>
              {session.rating && (
                <span className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(r => (
                    <span key={r} className={`text-[10px] ${r <= session.rating! ? 'text-amber-500' : 'text-zinc-400'}`}>★</span>
                  ))}
                </span>
              )}
            </div>
          </div>
          {/* Status */}
          <div className="flex items-center gap-1.5 flex-shrink-0 px-2.5 py-1 rounded-lg border"
            style={{ borderColor: `${status.color}25`, background: `${status.color}10` }}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status.dot}`} />
            <span className="text-[11px] font-medium" style={{ color: status.color }}>{status.label}</span>
          </div>
        </div>

        {session.notes && (
          <p className="text-[11px] italic mb-3 line-clamp-1" style={{ color: 'var(--text-3)' }}>
            "{session.notes}"
          </p>
        )}

        {/* Actions row */}
        <div className="flex gap-2 flex-wrap">
          <a href={session.meet_link} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium text-violet-600 hover:text-violet-700 hover:border-violet-300 transition-all"
            style={{ borderColor: 'var(--border-2)', background: 'var(--surface-2)' }}>
            <Video size={11} /> Meet
          </a>

          {session.status === 'scheduled' && (
            <Link href={`/sessions/${session.id}/live`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all"
              style={{ borderColor: '#c4b5fd', background: '#ede9fe', color: '#7c3aed' }}>
              <BrainCircuit size={11} /> AI Coach
            </Link>
          )}

          {session.status === 'scheduled' && isPast && !showComplete && (
            <button onClick={() => setShowComplete(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium text-emerald-600 hover:border-emerald-500/30 transition-all"
              style={{ borderColor: 'var(--border-2)', background: 'var(--surface-2)' }}>
              <CheckCircle size={11} /> Complete
            </button>
          )}

          {session.status === 'completed' && !session.rating && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border"
              style={{ borderColor: 'var(--border-2)', background: 'var(--surface-2)' }}>
              <Star size={11} className="text-amber-500" />
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(r => (
                  <button key={r}
                    onClick={() => { setTempRating(r); updateSession({ rating: r }) }}
                    className={`text-sm transition-colors ${r <= tempRating ? 'text-amber-500' : 'text-zinc-400 hover:text-amber-500'}`}
                  >★</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Inline complete form */}
        {showComplete && (
          <div className="mt-3 space-y-2">
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Session notes (optional)..."
              rows={2}
              className="w-full rounded-lg px-3 py-2 text-xs resize-none focus:outline-none transition-colors"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text-2)' }}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowComplete(false)}
                className="flex-1 py-1.5 rounded-lg text-xs border transition-colors"
                style={{ borderColor: 'var(--border-2)', color: 'var(--text-3)' }}>
                Cancel
              </button>
              <button onClick={() => updateSession({ status: 'completed', notes })} disabled={loading}
                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-40">
                Confirm
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
