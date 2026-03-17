import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Profile, Match, Message } from '@/lib/types'
import MessagesClient from './MessagesClient'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: matchesData }, { data: messagesData }] = await Promise.all([
    supabase
      .from('matches')
      .select('*, profile_a:profiles!matches_user_a_id_fkey(*), profile_b:profiles!matches_user_b_id_fkey(*)')
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false }),
    supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false }),
  ])

  const matches = (matchesData ?? []) as (Match & { profile_a: Profile; profile_b: Profile })[]

  // Last message per match
  const lastMessages: Record<string, Message> = {}
  for (const msg of (messagesData ?? []) as Message[]) {
    if (!lastMessages[msg.match_id]) lastMessages[msg.match_id] = msg
  }

  return (
    <MessagesClient
      matches={matches}
      lastMessages={lastMessages}
      currentUserId={user.id}
    />
  )
}
