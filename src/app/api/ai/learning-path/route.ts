import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateLearningPath } from '@/lib/ai/learning-path'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 5 learning path generations per user per hour
  if (!checkRateLimit(`learning-path:${user.id}`, 5, 60 * 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait before generating a new learning path.' }, { status: 429 })
  }

  const { skillName, currentLevel, targetLevel } = await req.json()

  // Load recent session notes for context
  const { data: recentSessions } = await supabase
    .from('sessions')
    .select('notes, skill_topic')
    .or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`)
    .eq('status', 'completed')
    .eq('skill_topic', skillName)
    .order('scheduled_at', { ascending: false })
    .limit(5)

  const sessionNotes = recentSessions
    ?.filter(s => s.notes)
    .map(s => s.notes!) ?? []

  // Load existing milestones already completed
  const { data: existingPath } = await supabase
    .from('learning_paths')
    .select('milestones')
    .eq('user_id', user.id)
    .eq('skill_name', skillName)
    .single()

  const completedMilestones = existingPath?.milestones
    ?.filter((m: { completed: boolean; title: string }) => m.completed)
    .map((m: { title: string }) => m.title) ?? []

  let generated
  try {
    generated = await generateLearningPath({
      skillName,
      currentLevel,
      targetLevel,
      recentSessionNotes: sessionNotes,
      completedMilestones,
    })
  } catch (err) {
    console.error('[learning-path] AI error:', err)
    return NextResponse.json({ error: `AI error: ${(err as Error).message}` }, { status: 502 })
  }

  const admin = createAdminClient()

  // Check if path already exists for this user+skill
  const { data: existing } = await admin
    .from('learning_paths')
    .select('id')
    .eq('user_id', user.id)
    .eq('skill_name', skillName)
    .maybeSingle()

  const payload = {
    user_id: user.id,
    skill_name: skillName,
    current_level: currentLevel,
    target_level: targetLevel,
    weekly_goal: generated.weeklyGoal,
    resources: [],
    milestones: generated.milestones,
    generated_at: new Date().toISOString(),
  }

  let path = null
  if (existing?.id) {
    const { data, error } = await admin
      .from('learning_paths')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single()
    if (error) console.error('[learning-path] update error:', error)
    path = data
  } else {
    const { data, error } = await admin
      .from('learning_paths')
      .insert(payload)
      .select()
      .single()
    if (error) console.error('[learning-path] insert error:', error)
    path = data
  }

  if (!path) return NextResponse.json({ error: 'Failed to save learning path' }, { status: 500 })

  return NextResponse.json({ path })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { pathId, milestones } = await req.json()

  const { data: path } = await supabase
    .from('learning_paths')
    .update({ milestones })
    .eq('id', pathId)
    .eq('user_id', user.id)
    .select()
    .single()

  return NextResponse.json({ path })
}
