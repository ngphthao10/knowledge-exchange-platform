'use client'

import { useState, useMemo } from 'react'
import { Search, Loader2, GraduationCap, BookOpen, Clock, Check, UserPlus, Star, ArrowUpDown, Zap, Hourglass } from 'lucide-react'
import Link from 'next/link'
import { Profile, Match, Skill, SkillLevel, SkillFuture } from '@/lib/types'
import { ReputationMap } from './page'

type MatchInfo = Pick<Match, 'id' | 'user_a_id' | 'user_b_id' | 'status'>

const AVAILABILITY_OPTIONS = [
  { value: 'weekday_morning',   label: 'Weekday AM' },
  { value: 'weekday_afternoon', label: 'Weekday PM' },
  { value: 'weekday_evening',   label: 'Weekday Eve' },
  { value: 'weekend_morning',   label: 'Weekend AM' },
  { value: 'weekend_afternoon', label: 'Weekend PM' },
  { value: 'weekend_evening',   label: 'Weekend Eve' },
]

const LEVEL_LABEL: Record<SkillLevel, string> = {
  beginner: 'Beg', intermediate: 'Int', advanced: 'Adv',
}

interface Props {
  profiles: Profile[]
  existingMatches: MatchInfo[]
  currentUserId: string
  mySkillsLearn: string[]
  mySkillsTeach: string[]
  reputation: ReputationMap
  skillFuturesMap: Record<string, SkillFuture[]>
  pledgedSet: Set<string>
}

function StarRating({ avg, count }: { avg: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star size={11} className="text-amber-400 fill-amber-400" />
      <span className="text-[11px] font-semibold" style={{ color: 'var(--text-2)' }}>{avg.toFixed(1)}</span>
      <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>({count})</span>
    </div>
  )
}

export default function DiscoverClient({ profiles, existingMatches, currentUserId, mySkillsLearn, mySkillsTeach, reputation, skillFuturesMap, pledgedSet }: Props) {
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState<SkillLevel | 'all'>('all')
  const [availFilter, setAvailFilter] = useState<string[]>([])
  const [compatibleOnly, setCompatibleOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'top_rated'>('newest')
  const [matchStates, setMatchStates] = useState<Record<string, { status: string; matchId?: string }>>(() => {
    const init: Record<string, { status: string; matchId?: string }> = {}
    for (const m of existingMatches) {
      const otherId = m.user_a_id === currentUserId ? m.user_b_id : m.user_a_id
      init[otherId] = { status: m.status, matchId: m.id }
    }
    return init
  })
  const [connecting, setConnecting] = useState<string | null>(null)
  const [pledging, setPledging] = useState<string | null>(null)
  const [pledgedKeys, setPledgedKeys] = useState<Set<string>>(pledgedSet)

  const toggleAvail = (v: string) =>
    setAvailFilter(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    let result = profiles.filter(p => {
      const teachSkills = (p.skills_teach ?? []) as Skill[]

      const matchesSearch = !q ||
        p.full_name.toLowerCase().includes(q) ||
        teachSkills.some(s => s.name.toLowerCase().includes(q)) ||
        (p.bio ?? '').toLowerCase().includes(q)

      const matchesLevel = levelFilter === 'all' ||
        teachSkills.some(s => s.level === levelFilter)

      const matchesAvail = availFilter.length === 0 ||
        availFilter.some(a => (p.availability ?? []).includes(a))

      const matchesCompat = !compatibleOnly ||
        teachSkills.some(s => {
          const sName = s.name.toLowerCase()
          return mySkillsLearn.some(l =>
            sName === l ||
            (l.length >= 3 && sName.includes(l)) ||
            (sName.length >= 3 && l.includes(sName))
          )
        })

      return matchesSearch && matchesLevel && matchesAvail && matchesCompat
    })

    if (sortBy === 'top_rated') {
      result = [...result].sort((a, b) => {
        const ra = reputation[a.user_id]?.rating_avg ?? 0
        const rb = reputation[b.user_id]?.rating_avg ?? 0
        return rb - ra
      })
    }

    return result
  }, [profiles, search, levelFilter, availFilter, compatibleOnly, sortBy, reputation, mySkillsLearn])

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
        setMatchStates(prev => ({ ...prev, [targetUserId]: { status: 'pending', matchId: data.matches[0].id } }))
      } else if (data.error) {
        alert(data.error)
      }
    } catch {
      alert('An error occurred. Please try again.')
    }
    setConnecting(null)
  }

  const pledge = async (futureOwnerId: string, pledgerSkill: string, futureSkill: string) => {
    const key = `${futureOwnerId}:${futureSkill}`
    setPledging(key)
    try {
      const res = await fetch('/api/futures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pledge', future_owner_id: futureOwnerId, pledger_skill: pledgerSkill, future_skill: futureSkill }),
      })
      if (res.ok) setPledgedKeys(prev => new Set([...prev, key]))
      else { const d = await res.json(); alert(d.error || 'Failed to pledge') }
    } catch { alert('An error occurred') }
    setPledging(null)
  }

  const activeFilters = (levelFilter !== 'all' ? 1 : 0) + availFilter.length + (compatibleOnly ? 1 : 0)

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Discover</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
            {filtered.length} of {profiles.length} members
            {activeFilters > 0 && <span className="ml-1 text-violet-600">· {activeFilters} filter{activeFilters > 1 ? 's' : ''} active</span>}
          </p>
        </div>
        {/* Sort */}
        <div className="flex items-center gap-1 border rounded-lg p-0.5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {([['newest', 'Newest'], ['top_rated', 'Top Rated']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setSortBy(key)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${sortBy === key ? 'bg-violet-600 text-white' : 'hover:text-[var(--text)]'}`}
              style={sortBy !== key ? { color: 'var(--text-3)' } : {}}>
              {key === 'top_rated' && <Star size={10} />}
              {key === 'newest' && <ArrowUpDown size={10} />}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, skill, or bio..."
          className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none transition-colors"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-2 mb-5">
        {/* Level */}
        {(['all', 'beginner', 'intermediate', 'advanced'] as const).map(l => (
          <button key={l} onClick={() => setLevelFilter(l)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${levelFilter === l ? 'bg-violet-600 text-white border-violet-600' : 'hover:border-[var(--border-2)]'}`}
            style={levelFilter !== l ? { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-3)' } : {}}>
            {l === 'all' ? 'All Levels' : l.charAt(0).toUpperCase() + l.slice(1)}
          </button>
        ))}

        <div className="w-px self-stretch" style={{ background: 'var(--border)' }} />

        {/* Availability */}
        {AVAILABILITY_OPTIONS.map(opt => (
          <button key={opt.value} onClick={() => toggleAvail(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${availFilter.includes(opt.value) ? 'bg-violet-100 border-violet-400 text-violet-700' : 'hover:border-[var(--border-2)]'}`}
            style={!availFilter.includes(opt.value) ? { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-3)' } : {}}>
            {opt.label}
          </button>
        ))}

        <div className="w-px self-stretch" style={{ background: 'var(--border)' }} />

        {/* Compatible toggle */}
        {mySkillsLearn.length > 0 && (
          <button onClick={() => setCompatibleOnly(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${compatibleOnly ? 'bg-emerald-100 border-emerald-400 text-emerald-700' : 'hover:border-[var(--border-2)]'}`}
            style={!compatibleOnly ? { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-3)' } : {}}>
            <Zap size={11} />
            Compatible only
          </button>
        )}

        {/* Clear */}
        {activeFilters > 0 && (
          <button onClick={() => { setLevelFilter('all'); setAvailFilter([]); setCompatibleOnly(false) }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-3)' }}>
            Clear filters
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 rounded-xl border" style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}>
          <p className="text-sm mb-1">No results found</p>
          <p className="text-xs">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(profile => {
            const matchState = matchStates[profile.user_id]
            const initials = profile.full_name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
            const teachSkills = (profile.skills_teach ?? []) as Skill[]
            const learnSkills = (profile.skills_learn ?? []) as Skill[]
            const isConnecting = connecting === profile.user_id
            const rep = reputation[profile.user_id]
            const userFutures = skillFuturesMap[profile.user_id] ?? []
            const isCompatible = teachSkills.some(s => {
              const sName = s.name.toLowerCase()
              return mySkillsLearn.some(l =>
                sName === l ||
                (l.length >= 3 && sName.includes(l)) ||
                (sName.length >= 3 && l.includes(sName))
              )
            })

            return (
              <div key={profile.user_id}
                className="rounded-xl border p-5 flex flex-col gap-3.5 transition-all hover:border-[var(--border-2)] hover:shadow-sm"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-700 font-bold text-sm flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{profile.full_name}</p>
                      {isCompatible && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex-shrink-0">
                          MATCH
                        </span>
                      )}
                    </div>
                    {profile.bio && (
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-3)' }}>{profile.bio}</p>
                    )}
                  </div>
                </div>

                {/* Reputation */}
                {rep && (
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: 'var(--surface-2)' }}>
                    <StarRating avg={rep.rating_avg} count={rep.sessions_taught} />
                    <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                      {rep.sessions_taught} session{rep.sessions_taught !== 1 ? 's' : ''} taught
                    </span>
                  </div>
                )}

                {/* Skills */}
                <div className="space-y-2 flex-1">
                  {teachSkills.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <GraduationCap size={10} className="text-emerald-600" />
                        <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Teaches</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {teachSkills.slice(0, 4).map((s, i) => {
                          const sName = s.name.toLowerCase()
                          const highlight = mySkillsLearn.some(l =>
                            sName === l ||
                            (l.length >= 3 && sName.includes(l)) ||
                            (sName.length >= 3 && l.includes(sName))
                          )
                          return (
                            <span key={i} className="text-[11px] px-2 py-0.5 rounded-full border"
                              style={highlight
                                ? { background: '#f0fdf4', borderColor: '#86efac', color: '#15803d', fontWeight: 600 }
                                : { background: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d' }}>
                              {s.name}
                              {s.verified && <span className="ml-0.5 text-[9px]">✓</span>}
                              <span className="ml-1 opacity-60">{LEVEL_LABEL[s.level]}</span>
                            </span>
                          )
                        })}
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
                  {(profile.availability ?? []).length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-3)' }}>
                      <Clock size={10} />
                      {(profile.availability ?? []).slice(0, 2)
                        .map(a => AVAILABILITY_OPTIONS.find(o => o.value === a)?.label ?? a)
                        .join(' · ')}
                      {(profile.availability ?? []).length > 2 && ` +${(profile.availability ?? []).length - 2}`}
                    </div>
                  )}
                </div>

                {/* Future Skills */}
                {userFutures.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Hourglass size={10} className="text-amber-500" />
                      <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Future Skills</span>
                    </div>
                    <div className="space-y-1">
                      {userFutures.map(f => {
                        const key = `${profile.user_id}:${f.skill_name}`
                        const alreadyPledged = pledgedKeys.has(key)
                        const isPledging = pledging === key
                        // Can I teach something they want to learn in the future?
                        const canTeach = mySkillsTeach.some(t => {
                          const tn = t.toLowerCase()
                          const fn = f.skill_name.toLowerCase()
                          return tn === fn || (tn.length >= 3 && fn.includes(tn)) || (fn.length >= 3 && tn.includes(fn))
                        })
                        return (
                          <div key={f.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg border"
                            style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-[11px] font-medium text-amber-800 truncate">{f.skill_name}</span>
                              <span className="text-[9px] text-amber-600 flex-shrink-0">~{f.estimated_weeks}w</span>
                              {f.ai_verified && <span className="text-[9px] text-emerald-600 flex-shrink-0">✓</span>}
                            </div>
                            {canTeach && !alreadyPledged && (
                              <button
                                onClick={() => pledge(profile.user_id, mySkillsTeach.find(t => { const tn = t.toLowerCase(); const fn = f.skill_name.toLowerCase(); return tn === fn || (tn.length >= 3 && fn.includes(tn)) || (fn.length >= 3 && tn.includes(fn)) }) ?? '', f.skill_name)}
                                disabled={isPledging}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500 hover:bg-amber-400 text-white flex-shrink-0 disabled:opacity-40 transition-all">
                                {isPledging ? '...' : 'Pledge'}
                              </button>
                            )}
                            {alreadyPledged && (
                              <span className="text-[10px] text-amber-700 flex-shrink-0">Pledged ✓</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* CTA */}
                <div className="flex gap-2">
                  <Link href={`/users/${profile.user_id}`}
                    className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all hover:border-violet-300 hover:text-violet-600 flex-shrink-0"
                    style={{ borderColor: 'var(--border-2)', color: 'var(--text-3)' }}>
                    Profile
                  </Link>
                  {!matchState && (
                    <button onClick={() => connect(profile.user_id)} disabled={isConnecting}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all disabled:opacity-40">
                      {isConnecting ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
                      {isConnecting ? 'Connecting...' : 'Connect'}
                    </button>
                  )}
                  {matchState?.status === 'pending' && (
                    <div className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium border"
                      style={{ borderColor: '#d97706', color: '#92400e', background: '#fef3c730' }}>
                      <Clock size={12} /> Pending
                    </div>
                  )}
                  {matchState?.status === 'accepted' && (
                    <Link href="/matches"
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium border transition-all hover:border-emerald-400"
                      style={{ borderColor: '#16a34a40', color: '#15803d', background: '#f0fdf4' }}>
                      <Check size={12} /> Connected · View Match
                    </Link>
                  )}
                  {matchState?.status === 'declined' && (
                    <div className="w-full flex items-center justify-center py-2 text-xs" style={{ color: 'var(--text-3)' }}>
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
