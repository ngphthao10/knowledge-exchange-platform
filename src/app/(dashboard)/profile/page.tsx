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

  const [{ data: profile }, { data: credentials }] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('credentials').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  const params = await searchParams
  const isOnboarding = params.onboarding === 'true'

  return (
    <ProfileForm
      profile={profile}
      isOnboarding={isOnboarding}
      userId={user.id}
      initialCredentials={credentials ?? []}
    />
  )
}
