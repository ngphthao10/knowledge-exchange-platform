import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Profile, Match } from '@/lib/types'
import DiscoverClient from './DiscoverClient'

export default async function DiscoverPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profiles }, { data: matches }] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .neq('user_id', user.id)
      .not('skills_teach', 'eq', '[]')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('matches')
      .select('id, user_a_id, user_b_id, status')
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`),
  ])

  return (
    <DiscoverClient
      profiles={(profiles ?? []) as Profile[]}
      existingMatches={(matches ?? []) as Pick<Match, 'id' | 'user_a_id' | 'user_b_id' | 'status'>[]}
      currentUserId={user.id}
    />
  )
}
