import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SessionsClient from './SessionsClient'

export default async function SessionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`)
    .order('scheduled_at', { ascending: true })

  return <SessionsClient initialSessions={sessions ?? []} currentUserId={user.id} />
}
