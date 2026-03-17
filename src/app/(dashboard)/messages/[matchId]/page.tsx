import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Profile, Message } from '@/lib/types'
import ChatClient from './ChatClient'

export default async function ChatPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: match }, { data: messages }] = await Promise.all([
    supabase
      .from('matches')
      .select('*, profile_a:profiles!matches_user_a_id_fkey(*), profile_b:profiles!matches_user_b_id_fkey(*)')
      .eq('id', matchId)
      .single(),
    supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })
      .limit(100),
  ])

  if (!match) redirect('/messages')
  if (match.user_a_id !== user.id && match.user_b_id !== user.id) redirect('/messages')
  if (match.status !== 'accepted') redirect('/messages')

  const otherProfile = (match.user_a_id === user.id ? match.profile_b : match.profile_a) as Profile

  return (
    <ChatClient
      matchId={matchId}
      initialMessages={(messages ?? []) as Message[]}
      currentUserId={user.id}
      otherProfile={otherProfile}
    />
  )
}
