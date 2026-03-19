import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LiveSessionRoom from '@/components/sessions/LiveSessionRoom'

interface Props {
  params: Promise<{ sessionId: string }>
}

export default async function LiveSessionPage({ params }: Props) {
  const { sessionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (!session) notFound()

  const isParticipant = session.teacher_id === user.id || session.learner_id === user.id
  if (!isParticipant) redirect('/sessions')

  const isTeacher = session.teacher_id === user.id

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--text)' }}>
          Live Session
        </h1>
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>
          AI coach is monitoring your session and providing real-time hints
        </p>
      </div>

      <LiveSessionRoom
        sessionId={sessionId}
        skillTopic={session.skill_topic}
        isTeacher={isTeacher}
        meetLink={session.meet_link}
      />
    </div>
  )
}
