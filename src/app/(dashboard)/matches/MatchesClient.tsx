'use client'

import { useState } from 'react'
import { Search, Loader2, AlertCircle, Users, Zap, BookOpen, GraduationCap, Info, Hourglass, ArrowRight, Clock } from 'lucide-react'
import { Match, Profile, FuturePledge } from '@/lib/types'
import MatchCard from '@/components/matching/MatchCard'

type MatchWithProfiles = Match & { profile_a?: Profile; profile_b?: Profile }
type Tab = 'all' | 'pending' | 'accepted' | 'declined' | 'futures'
type Skill = { name: string; level?: string }

interface MatchesClientProps {
  initialMatches: MatchWithProfiles[]
  currentUserId: string
  mySkillsTeach: Skill[]
  mySkillsLearn: Skill[]
  outgoingPledges: FuturePledge[]
  incomingPledges: FuturePledge[]
}

export default function MatchesClient({ initialMatches, currentUserId, mySkillsTeach, mySkillsLearn, outgoingPledges, incomingPledges }: MatchesClientProps) {
  const [matches, setMatches] = useState<MatchWithProfiles[]>(initialMatches)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('all')

  const findMatches = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/ai/match', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) setError(data.error || 'An error occurred')
      else if (data.matches?.length === 0) setError('No new matches found. Add more skills to your profile for better results.')
      else setMatches(prev => [...data.matches, ...prev])
    } catch { setError('An error occurred. Please try again.') }
    setLoading(false)
  }

  const handleStatusChange = (matchId: string, status: 'accepted' | 'declined' | 'pending') => {
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status } : m))
  }

  const pending  = matches.filter(m => m.status === 'pending')
  const accepted = matches.filter(m => m.status === 'accepted')
  const declined = matches.filter(m => m.status === 'declined')

  const totalPledges = outgoingPledges.length + incomingPledges.length
  const tabs: { key: Tab; label: string; count: number; color?: string }[] = [
    { key: 'all',      label: 'All',       count: matches.length },
    { key: 'pending',  label: 'Pending',   count: pending.length,  color: 'text-violet-600' },
    { key: 'accepted', label: 'Connected', count: accepted.length, color: 'text-emerald-600' },
    { key: 'declined', label: 'Declined',  count: declined.length },
    { key: 'futures',  label: 'Futures',   count: totalPledges,    color: 'text-amber-600' },
  ]

  const filtered = matches.filter(m => {
    if (activeTab === 'all')      return true
    if (activeTab === 'pending')  return m.status === 'pending'
    if (activeTab === 'accepted') return m.status === 'accepted'
    return m.status === 'declined'
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Matches</h1>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>
              <span className="font-semibold" style={{ color: 'var(--text-2)' }}>{matches.length}</span> total
            </span>
            {accepted.length > 0 && (
              <span className="flex items-center gap-1 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="font-semibold text-emerald-600">{accepted.length}</span>
                <span style={{ color: 'var(--text-3)' }}>connected</span>
              </span>
            )}
            {pending.length > 0 && (
              <span className="flex items-center gap-1 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                <span className="font-semibold text-violet-600">{pending.length}</span>
                <span style={{ color: 'var(--text-3)' }}>pending</span>
              </span>
            )}
          </div>
        </div>

        <button onClick={findMatches} disabled={loading}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50">
          {loading
            ? <><Loader2 size={13} className="animate-spin" /> Searching...</>
            : <><Search size={13} /> Find matches</>
          }
        </button>
      </div>

      {/* My skills context */}
      {(mySkillsTeach.length > 0 || mySkillsLearn.length > 0) && (
        <div className="rounded-xl border p-4 mb-5 flex flex-col sm:flex-row gap-4"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {mySkillsTeach.length > 0 && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-2">
                <GraduationCap size={13} style={{ color: '#7c3aed' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>You teach</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {mySkillsTeach.map((s, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: '#ede9fe', color: '#7c3aed' }}>
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {mySkillsTeach.length > 0 && mySkillsLearn.length > 0 && (
            <div className="w-px self-stretch hidden sm:block" style={{ background: 'var(--border)' }} />
          )}
          {mySkillsLearn.length > 0 && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-2">
                <BookOpen size={13} style={{ color: 'var(--text-3)' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>You want to learn</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {mySkillsLearn.map((s, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* How it works hint */}
      <div className="flex items-start gap-2 rounded-xl border px-4 py-3 mb-5 text-xs"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-3)' }}>
        <Info size={13} className="flex-shrink-0 mt-0.5" />
        <span>
          AI finds people whose skills complement yours — they teach what you want to learn, and you teach what they need.
          Hit <span className="font-semibold" style={{ color: 'var(--text-2)' }}>Find matches</span> to discover new connections.
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 border rounded-xl px-4 py-3 mb-4 text-sm"
          style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}>
          <AlertCircle size={14} className="flex-shrink-0" /> {error}
        </div>
      )}

      {/* Empty state */}
      {matches.length === 0 && !loading && (
        <div className="rounded-xl border p-16 text-center"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border-2)' }}>
            <Users size={24} style={{ color: 'var(--text-3)' }} />
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-2)' }}>No matches yet</p>
          <p className="text-xs mb-5" style={{ color: 'var(--text-3)' }}>
            Click &quot;Find matches&quot; to let AI pair you with compatible people
          </p>
          <button onClick={findMatches} disabled={loading}
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all">
            <Zap size={13} /> Find now
          </button>
        </div>
      )}

      {/* Tabs + grid */}
      {matches.length > 0 && (
        <>
          <div className="flex gap-1 mb-5">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  activeTab === tab.key
                    ? 'bg-violet-600 border-violet-600 text-white'
                    : 'hover:border-[var(--border-2)]'
                }`}
                style={activeTab !== tab.key ? { borderColor: 'var(--border)', color: 'var(--text-3)', background: 'var(--surface)' } : {}}>
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-[10px] px-1 rounded ${activeTab === tab.key ? 'bg-white/20' : 'bg-[var(--surface-2)]'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {activeTab === 'futures' ? (
            <div className="space-y-5">
              {/* Outgoing pledges */}
              {outgoingPledges.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: 'var(--text-2)' }}>
                    <ArrowRight size={12} className="text-amber-500" /> Bạn đã pledge
                  </p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {outgoingPledges.map(p => (
                      <div key={p.id} className="rounded-xl border p-4 flex flex-col gap-2"
                        style={{ background: 'var(--surface)', borderColor: '#fde68a' }}>
                        <div className="flex items-center gap-2">
                          <Hourglass size={13} className="text-amber-500 flex-shrink-0" />
                          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                            {(p.future_owner_profile as { full_name?: string } | undefined)?.full_name ?? 'Unknown'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs flex-wrap">
                          <span className="px-2 py-0.5 rounded-md font-medium" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                            Bạn dạy: {p.pledger_skill}
                          </span>
                          <ArrowRight size={10} style={{ color: 'var(--text-3)' }} />
                          <span className="px-2 py-0.5 rounded-md font-medium" style={{ background: '#fffbeb', color: '#92400e' }}>
                            Nhận lại: {p.future_skill}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-3)' }}>
                          <Clock size={10} />
                          {p.sessions_delivered}/{p.sessions_pledged} sessions · {p.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Incoming pledges */}
              {incomingPledges.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: 'var(--text-2)' }}>
                    <Hourglass size={12} className="text-amber-500" /> Người khác pledge kỹ năng của bạn
                  </p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {incomingPledges.map(p => (
                      <div key={p.id} className="rounded-xl border p-4 flex flex-col gap-2"
                        style={{ background: 'var(--surface)', borderColor: '#a7f3d0' }}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                            {(p.pledger_profile as { full_name?: string } | undefined)?.full_name ?? 'Unknown'}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">đã pledge</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs flex-wrap">
                          <span className="px-2 py-0.5 rounded-md font-medium" style={{ background: '#f0fdf4', color: '#047857' }}>
                            Họ dạy: {p.pledger_skill}
                          </span>
                          <ArrowRight size={10} style={{ color: 'var(--text-3)' }} />
                          <span className="px-2 py-0.5 rounded-md font-medium" style={{ background: '#fffbeb', color: '#92400e' }}>
                            Chờ: {p.future_skill}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-3)' }}>
                          <Clock size={10} />
                          {p.sessions_delivered}/{p.sessions_pledged} sessions · {p.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {totalPledges === 0 && (
                <div className="rounded-xl border p-16 text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <Hourglass size={28} className="mx-auto mb-3 text-amber-400" />
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-2)' }}>Chưa có Skill Futures</p>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                    Thêm kỹ năng đang học trong Profile, hoặc Pledge kỹ năng của người khác trong Discover
                  </p>
                </div>
              )}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border p-10 text-center"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Nothing here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {filtered.map(m => (
                <MatchCard key={m.id} match={m} currentUserId={currentUserId} onStatusChange={handleStatusChange} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
