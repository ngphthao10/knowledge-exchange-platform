import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Profile, Match, SkillFuture } from '@/lib/types'
import DiscoverClient from './DiscoverClient'

export type ReputationMap = Record<string, { rating_avg: number; sessions_taught: number }>

export default async function DiscoverPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profiles }, { data: matches }, { data: myProfile }, { data: sessionStats }, { data: allFutures }, { data: myPledges }] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .neq('user_id', user.id)
      .not('skills_teach', 'eq', '[]')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('matches')
      .select('id, user_a_id, user_b_id, status')
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`),
    supabase
      .from('profiles')
      .select('skills_learn, skills_teach')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('sessions')
      .select('teacher_id, rating')
      .eq('status', 'completed')
      .not('rating', 'is', null),
    supabase
      .from('skill_futures')
      .select('*'),
    supabase
      .from('future_pledges')
      .select('future_owner_id, future_skill')
      .eq('pledger_id', user.id),
  ])

  // Build reputation map: teacher_id → { rating_avg, sessions_taught }
  const reputationMap: ReputationMap = {}
  for (const s of sessionStats ?? []) {
    if (!s.teacher_id) continue
    if (!reputationMap[s.teacher_id]) reputationMap[s.teacher_id] = { rating_avg: 0, sessions_taught: 0 }
    reputationMap[s.teacher_id].sessions_taught++
    reputationMap[s.teacher_id].rating_avg += s.rating
  }
  for (const id of Object.keys(reputationMap)) {
    const r = reputationMap[id]
    r.rating_avg = Math.round((r.rating_avg / r.sessions_taught) * 10) / 10
  }

  const mySkillsLearn: string[] = (myProfile?.skills_learn ?? []).map((s: { name: string }) => s.name.toLowerCase())
  const mySkillsTeach: string[] = (myProfile?.skills_teach ?? []).map((s: { name: string }) => s.name.toLowerCase())

  // Group futures by user_id
  const skillFuturesMap: Record<string, SkillFuture[]> = {}
  for (const f of allFutures ?? []) {
    if (!skillFuturesMap[f.user_id]) skillFuturesMap[f.user_id] = []
    skillFuturesMap[f.user_id].push(f)
  }

  // Set of already pledged: `${future_owner_id}:${future_skill}`
  const pledgedSet = new Set((myPledges ?? []).map((p: { future_owner_id: string; future_skill: string }) => `${p.future_owner_id}:${p.future_skill}`))

  return (
    <DiscoverClient
      profiles={(profiles ?? []) as Profile[]}
      existingMatches={(matches ?? []) as Pick<Match, 'id' | 'user_a_id' | 'user_b_id' | 'status'>[]}
      currentUserId={user.id}
      mySkillsLearn={mySkillsLearn}
      mySkillsTeach={mySkillsTeach}
      reputation={reputationMap}
      skillFuturesMap={skillFuturesMap}
      pledgedSet={pledgedSet}
    />
  )
}
