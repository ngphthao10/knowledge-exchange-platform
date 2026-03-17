import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { format, formatDistanceToNow } from 'date-fns'
import {
  CheckCircle2, Link2, ShieldCheck, Target, ArrowRight, Video,
  Brain, Search, MessageSquare, Clock, Compass, CalendarDays,
} from 'lucide-react'
import StatsCard from '@/components/dashboard/StatsCard'
import CountdownTimer from '@/components/dashboard/CountdownTimer'
import { Skill, Match, Session, LearningPath, Profile } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: matchesRaw }, { data: sessionsRaw }, { data: pathsRaw }] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    supabase
      .from('matches')
      .select('*, profile_a:profiles!matches_user_a_id_fkey(*), profile_b:profiles!matches_user_b_id_fkey(*)')
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .order('created_at', { ascending: false }),
    supabase.from('sessions').select('*').or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`).order('scheduled_at'),
    supabase.from('learning_paths').select('*').eq('user_id', user.id),
  ])

  const matches = (matchesRaw ?? []) as (Match & { profile_a: Profile; profile_b: Profile })[]
  const sessions = (sessionsRaw ?? []) as Session[]
  const paths = (pathsRaw ?? []) as LearningPath[]
  const skillsTeach = (profile?.skills_teach ?? []) as Skill[]

  const completedSessions = sessions.filter(s => s.status === 'completed').length
  const activeMatches = matches.filter(m => m.status === 'accepted').length
  const verifiedSkills = skillsTeach.filter(s => s.verified).length
  const completedMilestones = paths.reduce((acc, p) => acc + p.milestones.filter(m => m.completed).length, 0)

  const nextSession = sessions
    .filter(s => s.status === 'scheduled' && new Date(s.scheduled_at) > new Date())
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0]

  const upcomingSessions = sessions
    .filter(s => s.status === 'scheduled' && new Date(s.scheduled_at) > new Date())
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 4)

  const acceptedMatches = matches.filter(m => m.status === 'accepted').slice(0, 4)

  // Activity feed from sessions + matches
  type ActivityEvent = { id: string; label: string; sub: string; time: string; icon: typeof CheckCircle2; color: string }
  const activity: ActivityEvent[] = [
    ...sessions
      .filter(s => s.status === 'completed')
      .slice(0, 5)
      .map(s => ({
        id: s.id,
        label: `Completed session: ${s.skill_topic}`,
        sub: format(new Date(s.scheduled_at), 'MM/dd/yyyy'),
        time: s.scheduled_at,
        icon: CheckCircle2,
        color: '#34d399',
      })),
    ...matches
      .filter(m => m.status === 'accepted')
      .slice(0, 5)
      .map(m => {
        const other = m.user_a_id === user.id ? m.profile_b : m.profile_a
        return {
          id: m.id,
          label: `Connected with ${other?.full_name ?? 'someone'}`,
          sub: `${Math.round(m.match_score * 100)}% compatibility`,
          time: m.created_at,
          icon: Link2,
          color: '#a78bfa',
        }
      }),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 6)

  const hasSkills = (profile?.skills_teach?.length ?? 0) > 0
  const hasAssessment = profile?.assessment_completed
  const hasMatches = matches.length > 0
  const unverifiedSkill = skillsTeach.find(s => !s.verified)

  const actions = [
    !hasSkills && { href: '/profile', icon: Brain, label: 'Complete your profile', sub: 'Add your skills', color: '#fbbf24' },
    hasSkills && !hasAssessment && unverifiedSkill && { href: `/profile/assessment/${encodeURIComponent(unverifiedSkill.name)}`, icon: ShieldCheck, label: 'Verify skills with AI', sub: `Start with: ${unverifiedSkill.name}`, color: '#60a5fa' },
    !hasMatches && { href: '/discover', icon: Compass, label: 'Discover users', sub: 'Find people to swap with', color: '#a78bfa' },
  ].filter(Boolean) as { href: string; icon: typeof Brain; label: string; sub: string; color: string }[]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
            Hello, {profile?.full_name?.split(' ').at(-1) ?? 'there'} 👋
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>Your SkillSwap activity overview</p>
        </div>
        <Link href="/discover"
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-medium transition-all hover:border-violet-500/30"
          style={{ borderColor: 'var(--border)', color: 'var(--text-3)', background: 'var(--surface)' }}>
          <Compass size={13} /> Discover
        </Link>
      </div>

      {/* Quick actions */}
      {actions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {actions.map(action => (
            <Link key={action.href} href={action.href}
              className="flex items-center gap-3 border rounded-xl px-4 py-3 transition-all hover:border-violet-500/20 group"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${action.color}15`, border: `1px solid ${action.color}30` }}>
                <action.icon size={14} style={{ color: action.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{action.label}</p>
                <p className="text-[11px] truncate" style={{ color: 'var(--text-3)' }}>{action.sub}</p>
              </div>
              <ArrowRight size={12} style={{ color: 'var(--text-3)' }} className="group-hover:text-violet-600 transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard label="Sessions completed" value={completedSessions} icon={CheckCircle2} color="text-emerald-600" />
        <StatsCard label="Active matches" value={activeMatches} icon={Link2} color="text-violet-600" />
        <StatsCard label="Verified skills" value={verifiedSkills} icon={ShieldCheck} color="text-amber-600" />
        <StatsCard label="Milestones done" value={completedMilestones} icon={Target} color="text-pink-600" />
      </div>

      {/* Main 2-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        {/* Left column */}
        <div className="space-y-5">
          {/* Next session countdown */}
          {nextSession && (
            <div className="rounded-xl border p-5"
              style={{ background: 'var(--surface)', borderColor: '#7c3aed30', boxShadow: 'inset 0 0 0 1px #7c3aed10' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600 mb-1">Next Session</p>
                  <p className="text-base font-bold mb-1" style={{ color: 'var(--text)' }}>{nextSession.skill_topic}</p>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                    {format(new Date(nextSession.scheduled_at), "EEEE, MM/dd 'at' HH:mm")} · {nextSession.duration_minutes} min
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] mb-1" style={{ color: 'var(--text-3)' }}>Starts in</p>
                  <CountdownTimer targetDate={nextSession.scheduled_at} />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <a href={nextSession.meet_link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold transition-all">
                  <Video size={12} /> Join Google Meet
                </a>
                <Link href="/sessions"
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg text-xs transition-all hover:border-violet-500/30"
                  style={{ borderColor: 'var(--border-2)', color: 'var(--text-3)' }}>
                  View schedule
                </Link>
              </div>
            </div>
          )}

          {/* Upcoming sessions list */}
          <div className="rounded-xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <CalendarDays size={13} style={{ color: 'var(--text-3)' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Schedule</h2>
              </div>
              <Link href="/sessions" className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1 transition-colors">
                View all <ArrowRight size={11} />
              </Link>
            </div>
            <div className="p-4">
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <p className="text-sm" style={{ color: 'var(--text-3)' }}>No upcoming sessions</p>
                  <Link href="/matches" className="text-xs text-violet-600 hover:text-violet-700 transition-colors">
                    Book from the Matches page →
                  </Link>
                </div>
              ) : (
                <div className="space-y-1">
                  {upcomingSessions.map(session => (
                    <div key={session.id} className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 rounded-full bg-blue-500/40 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{session.skill_topic}</p>
                          <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                            {format(new Date(session.scheduled_at), 'MM/dd, HH:mm')} · {session.duration_minutes}m
                          </p>
                        </div>
                      </div>
                      <a href={session.meet_link} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-700 border border-violet-200 hover:border-violet-400 px-3 py-1.5 rounded-lg transition-all">
                        <Video size={11} /> Join
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Accepted matches */}
          {acceptedMatches.length > 0 && (
            <div className="rounded-xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                  <Link2 size={13} style={{ color: 'var(--text-3)' }} />
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Connected</h2>
                </div>
                <Link href="/matches" className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1 transition-colors">
                  View all <ArrowRight size={11} />
                </Link>
              </div>
              <div className="p-4 space-y-1">
                {acceptedMatches.map(match => {
                  const other = match.user_a_id === user.id ? match.profile_b : match.profile_a
                  const initials = other?.full_name?.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() ?? '?'
                  return (
                    <div key={match.id} className="flex items-center gap-3 py-2.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                      <div className="w-8 h-8 rounded-lg bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-700 text-xs font-bold flex-shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{other?.full_name ?? 'Unknown'}</p>
                        <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>{Math.round(match.match_score * 100)}% compatibility</p>
                      </div>
                      <Link href={`/messages/${match.id}`}
                        className="flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-lg transition-all hover:border-violet-500/30"
                        style={{ borderColor: 'var(--border-2)', color: 'var(--text-3)' }}>
                        <MessageSquare size={11} /> Chat
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Learning progress */}
          <div className="rounded-xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <Target size={13} style={{ color: 'var(--text-3)' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Learning Progress</h2>
              </div>
              <Link href="/learning-path" className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1 transition-colors">
                Details <ArrowRight size={11} />
              </Link>
            </div>
            <div className="p-4">
              {paths.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <p className="text-sm" style={{ color: 'var(--text-3)' }}>No learning paths yet</p>
                  <Link href="/learning-path" className="text-xs text-violet-600 hover:text-violet-700 transition-colors">
                    Create a learning path →
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {paths.slice(0, 3).map(path => {
                    const total = path.milestones.length
                    const done = path.milestones.filter(m => m.completed).length
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0
                    return (
                      <div key={path.id}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-medium truncate" style={{ color: 'var(--text-2)' }}>{path.skill_name}</span>
                          <span className="ml-2 flex-shrink-0" style={{ color: pct === 100 ? '#34d399' : 'var(--text-3)' }}>{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--surface-2)' }}>
                          <div className="h-1.5 rounded-full transition-all"
                            style={{ width: `${pct}%`, background: pct === 100 ? '#10b981' : '#7c3aed' }} />
                        </div>
                        <p className="text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>{done}/{total} milestones</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Activity feed */}
          <div className="rounded-xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Recent Activity</h2>
            </div>
            <div className="p-4">
              {activity.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: 'var(--text-3)' }}>No activity yet</p>
              ) : (
                <div className="space-y-3">
                  {activity.map(event => (
                    <div key={event.id} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: `${event.color}15`, border: `1px solid ${event.color}30` }}>
                        <event.icon size={11} style={{ color: event.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>{event.label}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                          {formatDistanceToNow(new Date(event.time), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: '/discover', icon: Compass, label: 'Discover', color: '#7c3aed' },
              { href: '/messages', icon: MessageSquare, label: 'Messages', color: '#2563eb' },
              { href: '/sessions', icon: CalendarDays, label: 'Sessions', color: '#059669' },
              { href: '/learning-path', icon: Target, label: 'Learning Path', color: '#db2777' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-2.5 p-3 rounded-xl border transition-all hover:border-[var(--border-2)]"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <item.icon size={14} style={{ color: item.color }} />
                <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
