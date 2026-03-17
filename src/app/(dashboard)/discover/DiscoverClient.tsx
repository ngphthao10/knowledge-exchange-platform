'use client'

import { useState, useMemo } from 'react'
import { Search, Loader2, GraduationCap, BookOpen, Clock, Check, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { Profile, Match, Skill, SkillLevel } from '@/lib/types'

type MatchInfo = Pick<Match, 'id' | 'user_a_id' | 'user_b_id' | 'status'>

const LEVEL_LABEL: Record<SkillLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

const AVAILABILITY_LABEL: Record<string, string> = {
  weekday_morning: 'Weekday Morning',
  weekday_afternoon: 'Weekday Afternoon',
  weekday_evening: 'Weekday Evening',
  weekend_morning: 'Weekend Morning',
  weekend_afternoon: 'Weekend Afternoon',
  weekend_evening: 'Weekend Evening',
}

interface Props {
  profiles: Profile[]
  existingMatches: MatchInfo[]
  currentUserId: string
}

export default function DiscoverClient({ profiles, existingMatches, currentUserId }: Props) {
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState<SkillLevel | 'all'>('all')
  const [matchStates, setMatchStates] = useState<Record<string, { status: string; matchId?: string }>>(() => {
    const init: Record<string, { status: string; matchId?: string }> = {}
    for (const m of existingMatches) {
      const otherId = m.user_a_id === currentUserId ? m.user_b_id : m.user_a_id
      init[otherId] = { status: m.status, matchId: m.id }
    }
    return init
  })
  const [connecting, setConnecting] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return profiles.filter(p => {
      const skills = (p.skills_teach ?? []) as Skill[]
      const matchesSearch = !q ||
        p.full_name.toLowerCase().includes(q) ||
        skills.some(s => s.name.toLowerCase().includes(q))
      const matchesLevel = levelFilter === 'all' ||
        skills.some(s => s.level === levelFilter)
      return matchesSearch && matchesLevel
    })
  }, [profiles, search, levelFilter])

  const connect = async (targetUserId: string) => {
    setConnecting(targetUserId)
    try {
      const res = await fetch('/api/ai/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      })
      const data = await res.json()
      if (data.matches?.[0]) {
        setMatchStates(prev => ({
          ...prev,
          [targetUserId]: { status: 'pending', matchId: data.matches[0].id },
        }))
      } else if (data.error) {
        alert(data.error)
      }
    } catch {
      alert('An error occurred. Please try again.')
    }
    setConnecting(null)
  }

  const levels: { key: SkillLevel | 'all'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'beginner', label: 'Beginner' },
    { key: 'intermediate', label: 'Intermediate' },
    { key: 'advanced', label: 'Advanced' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Discover</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
          Find people with skills you want to learn · {profiles.length} members
        </p>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or skill..."
            className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none transition-colors"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        </div>
        <div className="flex gap-1 border rounded-xl p-1" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {levels.map(l => (
            <button key={l.key} onClick={() => setLevelFilter(l.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${levelFilter === l.key ? 'bg-violet-600 text-white' : 'hover:text-[var(--text)]'}`}
              style={levelFilter !== l.key ? { color: 'var(--text-3)' } : {}}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20" style={{ color: 'var(--text-3)' }}>
          <p className="text-sm">No results found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(profile => {
            const matchState = matchStates[profile.user_id]
            const initials = profile.full_name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
            const teachSkills = (profile.skills_teach ?? []) as Skill[]
            const learnSkills = (profile.skills_learn ?? []) as Skill[]
            const isConnecting = connecting === profile.user_id

            return (
              <div key={profile.user_id} className="rounded-xl border p-5 flex flex-col gap-4 transition-colors hover:border-[var(--border-2)]"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-700 font-bold text-sm flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{profile.full_name}</p>
                    {profile.bio && (
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-3)' }}>{profile.bio}</p>
                    )}
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-2.5 flex-1">
                  {teachSkills.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <GraduationCap size={10} className="text-emerald-600" />
                        <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Can Teach</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {teachSkills.slice(0, 3).map((s, i) => (
                          <span key={i} className="text-[11px] px-2 py-0.5 rounded-full border"
                            style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d' }}>
                            {s.name}
                            {s.verified && <span className="ml-1">✓</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {learnSkills.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <BookOpen size={10} className="text-blue-600" />
                        <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Wants to Learn</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {learnSkills.slice(0, 3).map((s, i) => (
                          <span key={i} className="text-[11px] px-2 py-0.5 rounded-full border"
                            style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8' }}>
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.availability?.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-3)' }}>
                      <Clock size={10} />
                      {profile.availability.slice(0, 2).map(a => AVAILABILITY_LABEL[a] ?? a).join(' · ')}
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div>
                  {!matchState && (
                    <button onClick={() => connect(profile.user_id)} disabled={isConnecting}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all disabled:opacity-40">
                      {isConnecting ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
                      {isConnecting ? 'Connecting...' : 'Connect'}
                    </button>
                  )}
                  {matchState?.status === 'pending' && (
                    <div className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium border"
                      style={{ borderColor: '#d97706', color: '#92400e', background: '#451a0310' }}>
                      <Clock size={12} /> Pending
                    </div>
                  )}
                  {matchState?.status === 'accepted' && (
                    <Link href="/matches"
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium border transition-all hover:border-emerald-500/30"
                      style={{ borderColor: '#16a34a40', color: '#15803d', background: '#052e1615' }}>
                      <Check size={12} /> Connected
                    </Link>
                  )}
                  {matchState?.status === 'declined' && (
                    <div className="w-full flex items-center justify-center py-2 text-xs"
                      style={{ color: 'var(--text-3)' }}>
                      Declined
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
