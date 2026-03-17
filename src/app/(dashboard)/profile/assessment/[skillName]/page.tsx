import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AssessmentChat from '@/components/assessment/AssessmentChat'
import { Skill } from '@/lib/types'
import { ChevronLeft, ShieldCheck } from 'lucide-react'

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ skillName: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { skillName } = await params
  const decodedSkillName = decodeURIComponent(skillName)

  const { data: profile } = await supabase
    .from('profiles')
    .select('skills_teach')
    .eq('user_id', user.id)
    .single()

  const skill = (profile?.skills_teach as Skill[] | null)?.find(
    s => s.name.toLowerCase() === decodedSkillName.toLowerCase()
  )

  const { data: assessmentSession } = await supabase
    .from('assessment_sessions')
    .insert({ user_id: user.id, skill_name: decodedSkillName, messages: [] })
    .select()
    .single()

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/profile"
          className="flex items-center gap-1 text-xs transition-colors hover:text-white"
          style={{ color: 'var(--text-3)' }}>
          <ChevronLeft size={14} /> Back to profile
        </Link>
      </div>

      <div className="mb-5">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>AI Assessment</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>Verify skill: {decodedSkillName}</p>
      </div>

      {skill?.verified ? (
        <div className="rounded-xl border p-8 text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 bg-emerald-500/10 border border-emerald-500/20">
            <ShieldCheck size={20} className="text-emerald-400" />
          </div>
          <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>
            Verified: {decodedSkillName}
          </h2>
          <p className="text-xs mb-0.5" style={{ color: 'var(--text-3)' }}>Level: <span className="text-violet-400">{skill.level}</span></p>
          <p className="text-xs mb-6" style={{ color: 'var(--text-3)' }}>Score: <span className="text-violet-400">{skill.assessmentScore}/100</span></p>
          <Link href="/profile"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors">
            Back to profile
          </Link>
        </div>
      ) : (
        <AssessmentChat
          skillName={decodedSkillName}
          assessmentSessionId={assessmentSession?.id}
        />
      )}
    </div>
  )
}
