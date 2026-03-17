'use client'

import { useState } from 'react'
import { Sparkles, Check, X, CalendarPlus, MessageSquare, ArrowLeftRight } from 'lucide-react'
import { Match, Profile, Skill } from '@/lib/types'
import BookSessionDialog from '@/components/sessions/BookSessionDialog'
import Link from 'next/link'

interface MatchCardProps {
  match: Match & { profile_a?: Profile; profile_b?: Profile }
  currentUserId: string
  onStatusChange: (matchId: string, status: 'accepted' | 'declined') => void
}

function avatarColor(name: string) {
  const colors = ['#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#14b8a6']
  return colors[(name?.charCodeAt(0) ?? 0) % colors.length]
}

export default function MatchCard({ match, currentUserId, onStatusChange }: MatchCardProps) {
  const [updating, setUpdating] = useState(false)
  const [showBook, setShowBook] = useState(false)

  const otherProfile = match.user_a_id === currentUserId ? match.profile_b : match.profile_a
  const scorePercent = Math.round(match.match_score * 100)
  const initials = otherProfile?.full_name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() ?? '?'
  const color = avatarColor(otherProfile?.full_name ?? '')

  const updateStatus = async (status: 'accepted' | 'declined') => {
    setUpdating(true)
    await fetch('/api/ai/match', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId: match.id, status }),
    })
    onStatusChange(match.id, status)
    setUpdating(false)
  }

  const mySkillsTeach    = (match.user_a_id === currentUserId ? match.profile_a?.skills_teach  : match.profile_b?.skills_teach)  as Skill[] | undefined
  const mySkillsLearn    = (match.user_a_id === currentUserId ? match.profile_a?.skills_learn  : match.profile_b?.skills_learn)  as Skill[] | undefined
  const theirSkillsTeach = otherProfile?.skills_teach as Skill[] | undefined
  const theirSkillsLearn = otherProfile?.skills_learn as Skill[] | undefined

  const theyTeachWhatILearn = theirSkillsTeach?.filter(s =>
    mySkillsLearn?.some(l => l.name.toLowerCase() === s.name.toLowerCase())
  ).slice(0, 3) ?? []

  const iTeachWhatTheyLearn = mySkillsTeach?.filter(s =>
    theirSkillsLearn?.some(l => l.name.toLowerCase() === s.name.toLowerCase())
  ).slice(0, 3) ?? []

  const hasExchange = theyTeachWhatILearn.length > 0 || iTeachWhatTheyLearn.length > 0

  const scoreColor = scorePercent >= 70 ? '#059669' : scorePercent >= 50 ? '#d97706' : '#6b7280'

  return (
    <>
      <div className="rounded-xl border p-4 transition-colors hover:border-[var(--border-2)] flex flex-col gap-3"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

        {/* Header: avatar + info + score */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: color }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
              {otherProfile?.full_name ?? 'Unknown'}
            </p>
            <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-3)' }}>
              {otherProfile?.bio || 'No bio yet'}
            </p>
          </div>
          {scorePercent > 0 && (
            <span className="text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0"
              style={{ color: scoreColor, background: `${scoreColor}15`, border: `1px solid ${scoreColor}30` }}>
              {scorePercent}%
            </span>
          )}
        </div>

        {/* Skill exchange — single compact row */}
        {hasExchange && (
          <div className="flex items-center gap-2 flex-wrap">
            {iTeachWhatTheyLearn.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>You teach</span>
                {iTeachWhatTheyLearn.map((s, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                    style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                    {s.name}
                  </span>
                ))}
              </div>
            )}
            {hasExchange && <ArrowLeftRight size={11} style={{ color: 'var(--text-3)', flexShrink: 0 }} />}
            {theyTeachWhatILearn.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>Learn</span>
                {theyTeachWhatILearn.map((s, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                    style={{ background: '#f0fdf4', color: '#047857', border: '1px solid #bbf7d0' }}>
                    {s.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI reason — 2 lines max */}
        {match.match_reason && (
          <div className="flex items-start gap-1.5">
            <Sparkles size={10} className="text-violet-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-3)' }}>
              {match.match_reason}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
          {match.status === 'pending' && (
            <>
              <button onClick={() => updateStatus('declined')} disabled={updating}
                className="flex items-center gap-1 px-3 py-1.5 border rounded-lg text-xs font-medium transition-all disabled:opacity-40 hover:border-red-500/30 hover:text-red-600"
                style={{ borderColor: 'var(--border-2)', color: 'var(--text-3)' }}>
                <X size={11} /> Decline
              </button>
              <button onClick={() => updateStatus('accepted')} disabled={updating}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-40">
                <Check size={11} /> Accept
              </button>
            </>
          )}
          {match.status === 'accepted' && (
            <>
              <Link href={`/messages/${match.id}`}
                className="flex items-center gap-1 px-3 py-1.5 border rounded-lg text-xs font-medium transition-all hover:border-violet-500/30 hover:text-violet-600"
                style={{ borderColor: 'var(--border-2)', color: 'var(--text-3)' }}>
                <MessageSquare size={11} /> Message
              </Link>
              <button onClick={() => setShowBook(true)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all">
                <CalendarPlus size={11} /> Book session
              </button>
            </>
          )}
          {match.status === 'declined' && (
            <span className="text-[11px] py-1.5" style={{ color: 'var(--text-3)' }}>Declined</span>
          )}
        </div>
      </div>

      {showBook && otherProfile && (
        <BookSessionDialog
          match={match} currentUserId={currentUserId} otherProfile={otherProfile}
          mySkillsTeach={mySkillsTeach ?? []} theirSkillsTeach={theirSkillsTeach ?? []}
          onClose={() => setShowBook(false)}
        />
      )}
    </>
  )
}
