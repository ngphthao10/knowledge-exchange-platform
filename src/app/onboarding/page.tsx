import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingClient from './OnboardingClient'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('skills_teach')
    .eq('user_id', user.id)
    .single()

  // Already completed onboarding — go to dashboard
  if (profile?.skills_teach?.length) redirect('/dashboard')

  const initialFullName: string = (user.user_metadata?.full_name as string) ?? ''

  return <OnboardingClient userId={user.id} initialFullName={initialFullName} />
}
