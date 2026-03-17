import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function generateMeetLink(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz'
  const segment = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `https://meet.google.com/${segment(3)}-${segment(4)}-${segment(3)}`
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { matchId, teacherId, learnerId, skillTopic, scheduledAt, durationMinutes = 90 } = await req.json()

  const { data: session, error } = await supabase
    .from('sessions')
    .insert({
      match_id: matchId,
      teacher_id: teacherId,
      learner_id: learnerId,
      skill_topic: skillTopic,
      scheduled_at: scheduledAt,
      duration_minutes: durationMinutes,
      meet_link: generateMeetLink(),
      status: 'scheduled',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ session })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`)
    .order('scheduled_at', { ascending: true })

  return NextResponse.json({ sessions: sessions ?? [] })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId, status, rating, notes } = await req.json()

  const { data: session, error } = await supabase
    .from('sessions')
    .update({ status, rating, notes })
    .eq('id', sessionId)
    .or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ session })
}
