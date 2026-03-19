import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Skill } from '@/lib/types'
import { GraduationCap, BookOpen, Clock, Star, CalendarCheck, ArrowLeft, ShieldCheck, ArrowLeftRight } from 'lucide-react'
import Link from 'next/link'

const LEVEL_LABEL: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

const AVAILABILITY_LABEL: Record<string, string> = {
  weekday_morning:   'Weekday Morning',
  weekday_afternoon: 'Weekday Afternoon',
  weekday_evening:   'Weekday Evening',
  weekend_morning:   'Weekend Morning',
  weekend_afternoon: 'Weekend Afternoon',
  weekend_evening:   'Weekend Evening',
}

function avatarColor(name: string) {
  const colors = ['#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#14b8a6']
  return colors[(name?.charCodeAt(0) ?? 0) % colors.length]
}

export default async function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Redirect to own profile page
  if (userId === user.id) redirect('/profile')

  const [{ data: profile }, { data: credentials }, { data: sessionStats }] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', userId).single(),
    supabase.from('credentials').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('sessions').select('rating').eq('teacher_id', userId).eq('status', 'completed').not('rating', 'is', null),
  ])

  if (!profile) notFound()

  // Also fetch current user's skills for match visualization
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('skills_teach, skills_learn')
    .eq('user_id', user.id)
    .single()

  const ratings = (sessionStats ?? []).map((s: { rating: number }) => s.rating)
  const reputation = ratings.length > 0
    ? { rating_avg: Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) * 10) / 10, sessions_taught: ratings.length }
    : null

  const skillsTeach = (profile.skills_teach ?? []) as Skill[]
  const skillsLearn = (profile.skills_learn ?? []) as Skill[]
  const availability = (profile.availability ?? []) as string[]
  const mySkillsLearn = ((myProfile?.skills_learn ?? []) as Skill[]).map(s => s.name.toLowerCase())
  const mySkillsTeach = ((myProfile?.skills_teach ?? []) as Skill[]).map(s => s.name.toLowerCase())

  // What they teach that I want to learn
  const theyTeachWhatILearn = new Set(skillsTeach.filter(s => mySkillsLearn.includes(s.name.toLowerCase())).map(s => s.name.toLowerCase()))
  // What I teach that they want to learn
  const iTeachWhatTheyLearn = new Set(skillsLearn.filter(s => mySkillsTeach.includes(s.name.toLowerCase())).map(s => s.name.toLowerCase()))

  const hasAnyMatch = theyTeachWhatILearn.size > 0 || iTeachWhatTheyLearn.size > 0

  const initials = profile.full_name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() ?? '?'
  const color = avatarColor(profile.full_name ?? '')

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <Link href="/matches" className="inline-flex items-center gap-1.5 text-xs mb-5 hover:opacity-70 transition-opacity"
        style={{ color: 'var(--text-3)' }}>
        <ArrowLeft size={13} /> Back to matches
      </Link>

      {/* Header card */}
      <div className="rounded-2xl border p-6 mb-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
            style={{ background: color }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>{profile.full_name}</h1>
            {reputation && (
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                  <Star size={11} fill="currentColor" /> {reputation.rating_avg}
                </span>
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-3)' }}>
                  <CalendarCheck size={11} /> {reputation.sessions_taught} session{reputation.sessions_taught !== 1 ? 's' : ''} taught
                </span>
              </div>
            )}
            {profile.bio && (
              <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-2)' }}>{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Availability */}
        {availability.length > 0 && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Clock size={12} style={{ color: 'var(--text-3)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Availability</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availability.map(a => (
                <span key={a} className="text-[11px] px-2 py-0.5 rounded-full border"
                  style={{ background: 'var(--surface-2)', borderColor: 'var(--border-2)', color: 'var(--text-2)' }}>
                  {AVAILABILITY_LABEL[a] ?? a}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Skill compatibility banner */}
      {hasAnyMatch && (
        <div className="rounded-xl border p-4 mb-4 flex items-start gap-3"
          style={{ background: '#f0fdf4', borderColor: '#86efac' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: '#dcfce7', border: '1px solid #86efac' }}>
            <ArrowLeftRight size={14} style={{ color: '#15803d' }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#15803d' }}>Great match!</p>
            <p className="text-xs mt-0.5" style={{ color: '#166534' }}>
              {theyTeachWhatILearn.size > 0 && iTeachWhatTheyLearn.size > 0
                ? `You can exchange skills with ${profile.full_name} — highlighted below.`
                : theyTeachWhatILearn.size > 0
                  ? `${profile.full_name} can teach you skills you want to learn — highlighted below.`
                  : `You can teach ${profile.full_name} skills they want to learn — highlighted below.`}
            </p>
          </div>
        </div>
      )}

      {/* Skills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {skillsTeach.length > 0 && (
          <div className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-1.5 mb-3">
              <GraduationCap size={13} style={{ color: '#7c3aed' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Can teach</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {skillsTeach.map((s, i) => {
                const isMatch = theyTeachWhatILearn.has(s.name.toLowerCase())
                return (
                  <div key={i} className={`flex items-center justify-between rounded-lg px-2 py-1 -mx-2 transition-colors ${isMatch ? 'bg-emerald-50' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: 'var(--text)' }}>{s.name}</span>
                      {isMatch && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                          YOU WANT
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {s.verified && <ShieldCheck size={11} className="text-violet-500" />}
                      <span className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: '#ede9fe', color: '#7c3aed' }}>
                        {LEVEL_LABEL[s.level] ?? s.level}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {skillsLearn.length > 0 && (
          <div className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-1.5 mb-3">
              <BookOpen size={13} style={{ color: 'var(--text-3)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Wants to learn</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {skillsLearn.map((s, i) => {
                const isMatch = iTeachWhatTheyLearn.has(s.name.toLowerCase())
                return (
                  <div key={i} className={`flex items-center justify-between rounded-lg px-2 py-1 -mx-2 transition-colors ${isMatch ? 'bg-blue-50' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: 'var(--text)' }}>{s.name}</span>
                      {isMatch && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                          YOU TEACH
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                      {LEVEL_LABEL[s.level] ?? s.level}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Credentials */}
      {credentials && credentials.length > 0 && (
        <div className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-1.5 mb-3">
            <ShieldCheck size={13} style={{ color: '#7c3aed' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Credentials</span>
          </div>
          <div className="flex flex-col gap-2">
            {credentials.map((c: { id: string; title: string; issuer: string; issued_at?: string; file_url?: string }) => (
              <div key={c.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{c.title}</p>
                  {c.issuer && <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>{c.issuer}{c.issued_at ? ` · ${c.issued_at}` : ''}</p>}
                </div>
                {c.file_url && (
                  <a href={c.file_url} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] px-2 py-1 rounded-lg border transition-colors hover:border-violet-300 hover:text-violet-600"
                    style={{ borderColor: 'var(--border-2)', color: 'var(--text-3)' }}>
                    View
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
