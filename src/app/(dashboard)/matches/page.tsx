import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MatchesClient from './MatchesClient'

export default async function MatchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: matches }, { data: myProfile }, { data: outgoing }, { data: incoming }] = await Promise.all([
    supabase
      .from('matches')
      .select(`
        *,
        profile_a:profiles!matches_user_a_id_fkey(*),
        profile_b:profiles!matches_user_b_id_fkey(*)
      `)
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('skills_teach, skills_learn')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('future_pledges')
      .select('*, future_owner_profile:profiles!future_pledges_future_owner_id_fkey(full_name, user_id)')
      .eq('pledger_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('future_pledges')
      .select('*, pledger_profile:profiles!future_pledges_pledger_id_fkey(full_name, user_id)')
      .eq('future_owner_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <MatchesClient
      initialMatches={matches ?? []}
      currentUserId={user.id}
      mySkillsTeach={myProfile?.skills_teach ?? []}
      mySkillsLearn={myProfile?.skills_learn ?? []}
      outgoingPledges={outgoing ?? []}
      incomingPledges={incoming ?? []}
    />
  )
}
