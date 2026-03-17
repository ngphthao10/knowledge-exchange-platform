'use client'

import { useState } from 'react'
import { Search, Loader2, AlertCircle, Users, Zap } from 'lucide-react'
import { Match, Profile } from '@/lib/types'
import MatchCard from '@/components/matching/MatchCard'

type MatchWithProfiles = Match & { profile_a?: Profile; profile_b?: Profile }
type Tab = 'all' | 'pending' | 'accepted' | 'declined'

interface MatchesClientProps {
  initialMatches: MatchWithProfiles[]
  currentUserId: string
}

export default function MatchesClient({ initialMatches, currentUserId }: MatchesClientProps) {
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

  const handleStatusChange = (matchId: string, status: 'accepted' | 'declined') => {
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status } : m))
  }

  const pending  = matches.filter(m => m.status === 'pending')
  const accepted = matches.filter(m => m.status === 'accepted')
  const declined = matches.filter(m => m.status === 'declined')

  const tabs: { key: Tab; label: string; count: number; color?: string }[] = [
    { key: 'all',      label: 'All',       count: matches.length },
    { key: 'pending',  label: 'Pending',   count: pending.length,  color: 'text-violet-600' },
    { key: 'accepted', label: 'Connected', count: accepted.length, color: 'text-emerald-600' },
    { key: 'declined', label: 'Declined',  count: declined.length },
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

          {filtered.length === 0 ? (
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
