import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileForm from './ProfileForm'

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: credentials }, { data: sessionStats }, { data: futures }] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('credentials').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('sessions').select('rating').eq('teacher_id', user.id).eq('status', 'completed').not('rating', 'is', null),
    supabase.from('skill_futures').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  const ratings = (sessionStats ?? []).map((s: { rating: number }) => s.rating)
  const reputation = ratings.length > 0
    ? { rating_avg: Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10, sessions_taught: ratings.length }
    : null

  const params = await searchParams
  const isOnboarding = params.onboarding === 'true'

  return (
    <ProfileForm
      profile={profile}
      isOnboarding={isOnboarding}
      userId={user.id}
      initialCredentials={credentials ?? []}
      initialFutures={futures ?? []}
      reputation={reputation}
    />
  )
}
