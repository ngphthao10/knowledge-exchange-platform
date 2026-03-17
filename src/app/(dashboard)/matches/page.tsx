import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MatchesClient from './MatchesClient'

export default async function MatchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      profile_a:profiles!matches_user_a_id_fkey(*),
      profile_b:profiles!matches_user_b_id_fkey(*)
    `)
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  return <MatchesClient initialMatches={matches ?? []} currentUserId={user.id} />
}
