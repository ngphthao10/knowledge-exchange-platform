import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingClient from './OnboardingClient'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('user_id', user.id)
    .single()

  // Already completed onboarding — go to dashboard
  if (profile?.full_name) redirect('/dashboard')

  return <OnboardingClient userId={user.id} />
}
