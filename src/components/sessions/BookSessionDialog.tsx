'use client'

import { useState } from 'react'
import { X, Video, Loader2, CalendarPlus } from 'lucide-react'
import { Match, Profile, Skill } from '@/lib/types'

interface BookSessionDialogProps {
  match: Match
  currentUserId: string
  otherProfile: Profile
  mySkillsTeach: Skill[]
  theirSkillsTeach: Skill[]
  onClose: () => void
}

export default function BookSessionDialog({
  match, currentUserId, otherProfile, mySkillsTeach, theirSkillsTeach, onClose
}: BookSessionDialogProps) {
  const [skillTopic, setSkillTopic] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [teacherId, setTeacherId] = useState(currentUserId)
  const [duration, setDuration] = useState(90)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<{ meetLink: string } | null>(null)

  const allSkills = [
    ...mySkillsTeach.map(s => ({ ...s, teacher: currentUserId, label: `I teach: ${s.name}` })),
    ...theirSkillsTeach.map(s => ({ ...s, teacher: otherProfile.user_id, label: `${otherProfile.full_name} teaches: ${s.name}` })),
  ]

  const handleSkillChange = (value: string) => {
    const selected = allSkills.find(s => `${s.teacher}:${s.name}` === value)
    if (selected) { setSkillTopic(selected.name); setTeacherId(selected.teacher) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const learnerId = teacherId === currentUserId ? otherProfile.user_id : currentUserId
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchId: match.id, teacherId, learnerId, skillTopic,
        scheduledAt: new Date(scheduledAt).toISOString(), durationMinutes: duration
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.session) setSuccess({ meetLink: data.session.meet_link })
  }

  const inputCls = "w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500/60 transition-colors"
  const inputStyle = { background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text)' }
  const labelCls = "block text-xs font-medium mb-1.5"
  const labelStyle = { color: 'var(--text-3)' }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border shadow-2xl" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <CalendarPlus size={15} className="text-violet-600" />
            Book session
          </h2>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg border transition-colors hover:border-[var(--border-2)]"
            style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}
          >
            <X size={14} />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 bg-emerald-100 border border-emerald-200">
              <Video size={20} className="text-emerald-600" />
            </div>
            <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>Session booked successfully!</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>Your Google Meet link:</p>
            <a href={success.meetLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 border rounded-lg px-4 py-2.5 text-xs font-medium text-violet-600 hover:border-violet-300 transition-all break-all mb-4"
              style={{ borderColor: 'var(--border-2)', background: 'var(--surface-2)' }}
            >
              <Video size={12} /> {success.meetLink}
            </a>
            <button onClick={onClose}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className={labelCls} style={labelStyle}>Skill</label>
              <select onChange={e => handleSkillChange(e.target.value)} className={inputCls} style={inputStyle} required>
                <option value="">Select a skill...</option>
                {allSkills.map((s, i) => (
                  <option key={i} value={`${s.teacher}:${s.name}`}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Date & Time</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className={inputCls}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Duration</label>
              <select value={duration} onChange={e => setDuration(Number(e.target.value))} className={inputCls} style={inputStyle}>
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>120 minutes</option>
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 border rounded-xl text-sm transition-all"
                style={{ borderColor: 'var(--border-2)', color: 'var(--text-3)' }}
              >Cancel</button>
              <button
                type="submit"
                disabled={loading || !skillTopic || !scheduledAt}
                className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 size={13} className="animate-spin" /> Creating...</> : 'Confirm'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
