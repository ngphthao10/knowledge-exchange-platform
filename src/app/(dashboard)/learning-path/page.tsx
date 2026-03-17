import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LearningPathClient from './LearningPathClient'
import { Skill } from '@/lib/types'

export default async function LearningPathPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: paths }] = await Promise.all([
    supabase.from('profiles').select('skills_learn, skills_teach').eq('user_id', user.id).single(),
    supabase.from('learning_paths').select('*').eq('user_id', user.id).order('generated_at', { ascending: false }),
  ])

  const skillsLearn = (profile?.skills_learn as Skill[] | null) ?? []

  return (
    <LearningPathClient
      initialPaths={paths ?? []}
      skillsLearn={skillsLearn}
    />
  )
}
