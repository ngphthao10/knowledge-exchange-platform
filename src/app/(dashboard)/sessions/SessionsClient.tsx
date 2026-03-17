'use client'

import { useState, useMemo, Fragment } from 'react'
import {
  CalendarDays, List, Table2, LayoutGrid,
  Video, GraduationCap, BookOpen,
  ChevronLeft, ChevronRight, Star, Zap
} from 'lucide-react'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import { Session } from '@/lib/types'
import SessionCard from '@/components/sessions/SessionCard'
import Link from 'next/link'

type Tab = 'all' | 'upcoming' | 'completed' | 'cancelled'
type ViewMode = 'list' | 'table' | 'calendar'

/* ─────────────────────────────── TABLE VIEW ─────────────────────────────── */
function TableView({ sessions, currentUserId, onUpdate }: {
  sessions: Session[]
  currentUserId: string
  onUpdate: (s: Session) => void
}) {
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [rating, setRating] = useState(0)
  const [loading, setLoading] = useState(false)

  const updateSession = async (sessionId: string, data: Partial<Session>) => {
    setLoading(true)
    const res = await fetch('/api/sessions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, ...data }),
    })
    const result = await res.json()
    if (result.session) onUpdate(result.session)
    setLoading(false)
    setCompletingId(null)
    setNotes('')
    setRating(0)
  }

  if (sessions.length === 0) return <EmptyState />

  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border)' }}>
      <table className="w-full text-sm" style={{ background: 'var(--surface)' }}>
        <thead>
          <tr className="border-b text-left" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
            {['Skill', 'Date & Time', 'Duration', 'Role', 'Status', ''].map((h, i) => (
              <th key={i} className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider ${i === 5 ? 'text-right' : ''} ${i === 2 ? 'hidden sm:table-cell' : ''} ${i === 3 ? 'hidden md:table-cell' : ''}`}
                style={{ color: 'var(--text-3)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sessions.map(session => {
            const isTeacher = session.teacher_id === currentUserId
            const isPast = new Date(session.scheduled_at) < new Date()
            const statusCfg = {
              scheduled: { label: 'Upcoming', dot: 'bg-blue-500', text: '#2563eb' },
              completed: { label: 'Completed', dot: 'bg-emerald-500', text: '#059669' },
              cancelled: { label: 'Cancelled', dot: 'bg-zinc-600', text: '#6b7280' },
            }[session.status]

            return (
              <Fragment key={session.id}>
                <tr className="border-b transition-colors hover:bg-white/[0.015]"
                  style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>{session.skill_topic}</p>
                    {session.rating && (
                      <div className="flex gap-0.5 mt-0.5">
                        {[1,2,3,4,5].map(r => (
                          <span key={r} className={`text-xs ${r <= session.rating! ? 'text-amber-400' : 'text-zinc-400'}`}>★</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-2)' }}>
                    {format(new Date(session.scheduled_at), 'MMM d, yyyy · HH:mm')}
                  </td>
                  <td className="px-4 py-3 text-xs hidden sm:table-cell" style={{ color: 'var(--text-3)' }}>
                    {session.duration_minutes} min
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`flex items-center gap-1 text-xs ${isTeacher ? 'text-violet-600' : 'text-pink-600'}`}>
                      {isTeacher ? <GraduationCap size={11} /> : <BookOpen size={11} />}
                      {isTeacher ? 'Teach' : 'Learn'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusCfg.dot}`} />
                      <span className="text-xs font-medium" style={{ color: statusCfg.text }}>{statusCfg.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <a href={session.meet_link} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-violet-600 hover:text-violet-700 transition-colors flex items-center gap-1">
                        <Video size={11} /> Meet
                      </a>
                      {session.status === 'scheduled' && isPast && (
                        <button onClick={() => setCompletingId(completingId === session.id ? null : session.id)}
                          className="text-xs text-emerald-600 hover:text-emerald-700 transition-colors">
                          Complete
                        </button>
                      )}
                      {session.status === 'completed' && !session.rating && (
                        <button onClick={() => setCompletingId(completingId === session.id ? null : session.id)}
                          className="text-xs text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1">
                          <Star size={11} /> Rate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

                {completingId === session.id && (
                  <tr style={{ background: 'var(--surface-2)' }}>
                    <td colSpan={6} className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                      {session.status === 'scheduled' ? (
                        <div className="flex items-start gap-3 flex-wrap">
                          <textarea value={notes} onChange={e => setNotes(e.target.value)}
                            placeholder="Session notes..." rows={1}
                            className="flex-1 min-w-[200px] rounded-lg px-3 py-2 text-xs resize-none focus:outline-none transition-colors"
                            style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', color: 'var(--text-2)' }} />
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => setCompletingId(null)}
                              className="px-3 py-1.5 rounded-lg text-xs border" style={{ borderColor: 'var(--border-2)', color: 'var(--text-3)' }}>
                              Cancel
                            </button>
                            <button onClick={() => updateSession(session.id, { status: 'completed', notes })} disabled={loading}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium disabled:opacity-40">
                              Confirm
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <span className="text-xs" style={{ color: 'var(--text-3)' }}>Rating:</span>
                          <div className="flex gap-1">
                            {[1,2,3,4,5].map(r => (
                              <button key={r} onClick={() => setRating(r)}
                                className={`text-xl transition-colors ${r <= rating ? 'text-amber-400' : 'text-zinc-400 hover:text-amber-500'}`}>★</button>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setCompletingId(null)}
                              className="px-3 py-1.5 rounded-lg text-xs border" style={{ borderColor: 'var(--border-2)', color: 'var(--text-3)' }}>
                              Cancel
                            </button>
                            <button onClick={() => updateSession(session.id, { rating })} disabled={loading || rating === 0}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-medium disabled:opacity-40">
                              Submit
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ──────────────────────────── CALENDAR VIEW ─────────────────────────────── */
const STATUS_COLOR: Record<string, { bg: string; border: string; text: string }> = {
  scheduled: { bg: '#3b82f610', border: '#3b82f6', text: '#1d4ed8' },
  completed: { bg: '#10b98110', border: '#10b981', text: '#047857' },
  cancelled: { bg: '#52525b10', border: '#52525b', text: '#6b7280' },
}

const START_HOUR = 7   // 7am
const END_HOUR   = 22  // 10pm
const ROW_H      = 64  // px per hour

function TimeGrid({ sessions, days, currentUserId }: {
  sessions: Session[]
  days: Date[]
  currentUserId: string
}) {
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)
  const now = new Date()
  const todayIdx = days.findIndex(d => isSameDay(d, now))
  const nowTop = todayIdx >= 0
    ? ((now.getHours() - START_HOUR) + now.getMinutes() / 60) * ROW_H
    : -1

  function getPos(session: Session) {
    const d = new Date(session.scheduled_at)
    const top = ((d.getHours() - START_HOUR) + d.getMinutes() / 60) * ROW_H
    const height = Math.max((session.duration_minutes / 60) * ROW_H, 28)
    return { top, height }
  }

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: 600 }}>
        {/* Day headers */}
        <div className="flex border-b" style={{ borderColor: 'var(--border)', marginLeft: 52 }}>
          {days.map(day => {
            const isToday = isSameDay(day, now)
            return (
              <div key={day.toISOString()} className="flex-1 flex flex-col items-center py-3 gap-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--text-3)' }}>{format(day, 'EEE')}</span>
                <span className={`text-base font-bold leading-none w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                  isToday ? 'bg-violet-600 text-white' : ''
                }`} style={!isToday ? { color: 'var(--text-2)' } : {}}>
                  {format(day, 'd')}
                </span>
              </div>
            )
          })}
        </div>

        {/* Scrollable time grid */}
        <div className="overflow-y-auto" style={{ maxHeight: 480 }}>
          <div className="relative flex" style={{ height: (END_HOUR - START_HOUR) * ROW_H }}>
            {/* Time gutter */}
            <div className="flex-shrink-0 relative" style={{ width: 52 }}>
              {hours.map(h => (
                <div key={h} className="absolute right-3 text-[10px] font-medium select-none"
                  style={{ top: (h - START_HOUR) * ROW_H - 7, color: 'var(--text-3)' }}>
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day, dayIdx) => {
              const daySessions = sessions.filter(s => isSameDay(new Date(s.scheduled_at), day))
              const isToday = isSameDay(day, now)
              return (
                <div key={day.toISOString()} className="flex-1 relative border-l"
                  style={{ borderColor: 'var(--border)', background: isToday ? '#7c3aed06' : 'transparent' }}>
                  {/* Hour lines */}
                  {hours.map(h => (
                    <div key={h} className="absolute left-0 right-0 border-t"
                      style={{
                        top: (h - START_HOUR) * ROW_H,
                        borderColor: h % 2 === 0 ? 'var(--border)' : 'transparent',
                        borderStyle: h % 2 === 0 ? 'solid' : 'none',
                      }} />
                  ))}
                  {/* Half-hour lines */}
                  {hours.map(h => (
                    <div key={`h-${h}`} className="absolute left-0 right-0"
                      style={{
                        top: (h - START_HOUR) * ROW_H + ROW_H / 2,
                        borderTop: '1px dashed',
                        borderColor: 'var(--border)',
                        opacity: 0.4,
                      }} />
                  ))}

                  {/* Now indicator */}
                  {isToday && nowTop > 0 && nowTop < (END_HOUR - START_HOUR) * ROW_H && (
                    <div className="absolute left-0 right-0 z-10 flex items-center pointer-events-none"
                      style={{ top: nowTop }}>
                      <div className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0 -ml-1" />
                      <div className="flex-1 h-px bg-violet-500" />
                    </div>
                  )}

                  {/* Sessions */}
                  {daySessions.map(session => {
                    const { top, height } = getPos(session)
                    const c = STATUS_COLOR[session.status]
                    const isTeacher = session.teacher_id === currentUserId
                    const endTime = new Date(new Date(session.scheduled_at).getTime() + session.duration_minutes * 60000)
                    return (
                      <div key={session.id}
                        className="absolute left-1 right-1 rounded-lg overflow-hidden group cursor-default"
                        style={{ top, height, background: c.bg, borderLeft: `3px solid ${c.border}` }}>
                        <div className="px-2 py-1.5 h-full flex flex-col justify-between">
                          <div>
                            <p className="text-[11px] font-semibold leading-tight truncate" style={{ color: 'var(--text)' }}>
                              {session.skill_topic}
                            </p>
                            {height >= 44 && (
                              <p className="text-[9px] mt-0.5 leading-none" style={{ color: c.text }}>
                                {format(new Date(session.scheduled_at), 'HH:mm')} – {format(endTime, 'HH:mm')}
                              </p>
                            )}
                          </div>
                          {height >= 56 && (
                            <div className="flex items-center justify-between">
                              <span className={`text-[9px] font-medium ${isTeacher ? 'text-violet-600' : 'text-pink-600'}`}>
                                {isTeacher ? '↑ Teaching' : '↓ Learning'}
                              </span>
                              <a href={session.meet_link} target="_blank" rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-violet-600 hover:text-violet-700">
                                <Video size={9} />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function CalendarView({ sessions, currentUserId }: { sessions: Session[]; currentUserId: string }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const weekStart = useMemo(() => {
    const base = new Date()
    base.setDate(base.getDate() + weekOffset * 7)
    return startOfWeek(base, { weekStartsOn: 1 })
  }, [weekOffset])
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const weekSessions = sessions.filter(s =>
    days.some(d => isSameDay(new Date(s.scheduled_at), d))
  )

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <button onClick={() => setWeekOffset(w => w - 1)}
          className="w-7 h-7 flex items-center justify-center rounded-lg border transition-all hover:border-violet-500/40"
          style={{ borderColor: 'var(--border-2)', color: 'var(--text-3)' }}>
          <ChevronLeft size={13} />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            {format(weekStart, 'MMM d')} – {format(days[6], 'MMM d, yyyy')}
          </span>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)}
              className="px-2 py-0.5 text-[10px] rounded-md border font-medium text-violet-600 border-violet-300 hover:bg-violet-50 transition-colors">
              Today
            </button>
          )}
        </div>

        <button onClick={() => setWeekOffset(w => w + 1)}
          className="w-7 h-7 flex items-center justify-center rounded-lg border transition-all hover:border-violet-500/40"
          style={{ borderColor: 'var(--border-2)', color: 'var(--text-3)' }}>
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Time grid */}
      <TimeGrid sessions={sessions} days={days} currentUserId={currentUserId} />

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-4">
          {[
            { color: '#3b82f6', label: 'Upcoming' },
            { color: '#10b981', label: 'Completed' },
            { color: '#52525b', label: 'Cancelled' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>{label}</span>
            </div>
          ))}
        </div>
        <span className="text-[11px] font-medium" style={{ color: 'var(--text-3)' }}>
          {weekSessions.length} session{weekSessions.length !== 1 ? 's' : ''} this week
        </span>
      </div>
    </div>
  )
}

/* ──────────────────────────────── EMPTY STATE ───────────────────────────── */
function EmptyState({ tab = 'upcoming' }: { tab?: Tab }) {
  return (
    <div className="rounded-xl border p-12 text-center"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <CalendarDays size={28} className="mx-auto mb-3" style={{ color: 'var(--text-3)' }} />
      <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-2)' }}>No sessions yet</p>
      <p className="text-xs mb-5" style={{ color: 'var(--text-3)' }}>
        {tab === 'upcoming' || tab === 'all' ? 'Connect with users to book your first session' : 'Nothing here'}
      </p>
      {(tab === 'upcoming' || tab === 'all') && (
        <Link href="/matches"
          className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-xs font-medium transition-all">
          <Zap size={12} /> Go to Matches
        </Link>
      )}
    </div>
  )
}

/* ────────────────────────────────── MAIN ────────────────────────────────── */
export default function SessionsClient({ initialSessions, currentUserId }: {
  initialSessions: Session[]
  currentUserId: string
}) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions)
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const handleUpdate = (updated: Session) =>
    setSessions(prev => prev.map(s => s.id === updated.id ? updated : s))

  const upcoming  = sessions.filter(s => s.status === 'scheduled')
  const completed = sessions.filter(s => s.status === 'completed')
  const cancelled = sessions.filter(s => s.status === 'cancelled')

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'all',       label: 'All',       count: sessions.length },
    { key: 'upcoming',  label: 'Upcoming',  count: upcoming.length },
    { key: 'completed', label: 'Completed', count: completed.length },
    { key: 'cancelled', label: 'Cancelled', count: cancelled.length },
  ]

  const filtered = sessions.filter(s => {
    if (activeTab === 'all')       return true
    if (activeTab === 'upcoming')  return s.status === 'scheduled'
    if (activeTab === 'completed') return s.status === 'completed'
    return s.status === 'cancelled'
  })

  const views: { key: ViewMode; icon: typeof List; label: string }[] = [
    { key: 'list',     icon: List,      label: 'List' },
    { key: 'table',    icon: Table2,    label: 'Table' },
    { key: 'calendar', icon: LayoutGrid, label: 'Calendar' },
  ]

  const nextSession = upcoming.sort((a, b) =>
    new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  )[0]

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Sessions</h1>
          {/* Compact stats inline */}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>
              <span className="font-semibold" style={{ color: 'var(--text-2)' }}>{sessions.length}</span> total
            </span>
            {upcoming.length > 0 && (
              <span className="flex items-center gap-1 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="font-semibold text-blue-600">{upcoming.length}</span>
                <span style={{ color: 'var(--text-3)' }}>upcoming</span>
              </span>
            )}
            {completed.length > 0 && (
              <span className="flex items-center gap-1 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="font-semibold text-emerald-600">{completed.length}</span>
                <span style={{ color: 'var(--text-3)' }}>completed</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-0.5 border rounded-lg p-0.5 flex-shrink-0"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          {views.map(v => (
            <button key={v.key} onClick={() => setViewMode(v.key)} title={v.label}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === v.key ? 'bg-violet-600 text-white' : 'hover:text-[var(--text)]'}`}
              style={viewMode !== v.key ? { color: 'var(--text-3)' } : {}}>
              <v.icon size={13} />
              <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Next session banner — only when relevant */}
      {nextSession && viewMode !== 'calendar' && (
        <div className="rounded-xl border px-4 py-3 mb-4 flex items-center gap-3"
          style={{ background: '#ede9fe', borderColor: '#7c3aed30' }}>
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
            <CalendarDays size={14} className="text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
              Next: {nextSession.skill_topic}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>
              {format(new Date(nextSession.scheduled_at), 'EEEE, MMM d · HH:mm')}
              {' · '}{nextSession.duration_minutes} min
            </p>
          </div>
          <a href={nextSession.meet_link} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-all flex-shrink-0">
            <Video size={11} /> Join
          </a>
        </div>
      )}

      {/* Tabs — hidden in calendar view */}
      {viewMode !== 'calendar' && (
        <div className="flex gap-1 mb-4">
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
      )}

      {/* Content */}
      {viewMode === 'list' && (
        filtered.length === 0
          ? <EmptyState tab={activeTab} />
          : <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {filtered.map(s => (
                <SessionCard key={s.id} session={s} currentUserId={currentUserId} onUpdate={handleUpdate} />
              ))}
            </div>
      )}
      {viewMode === 'table' && (
        <TableView sessions={filtered} currentUserId={currentUserId} onUpdate={handleUpdate} />
      )}
      {viewMode === 'calendar' && (
        <CalendarView sessions={sessions} currentUserId={currentUserId} />
      )}
    </div>
  )
}
