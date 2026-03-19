import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { chatCompletion, parseJSON, ChatMessage } from '@/lib/ai/client'
import { checkRateLimit } from '@/lib/rateLimit'

const SYSTEM_PROMPT = `You are a skill assessor evaluating skills through conversation.
Assess the user's real level through 5-7 adaptive questions.

Rules:
1. Start at intermediate level, adjust based on answers
2. Ask in English, naturally
3. Do not reveal the score during the assessment
4. Return pure JSON only, no markdown

While asking:
{"type":"question","next_question":"<question>","question_number":<1-7>}

When finished (question 5-7):
{"type":"assessment_complete","score":<0-100>,"level":"beginner"|"intermediate"|"advanced","summary":"<feedback on strengths and areas for improvement>","next_question":null}`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 30 requests per user per 10 minutes (covers a full assessment session)
  if (!checkRateLimit(`assessment:${user.id}`, 30, 10 * 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a few minutes.' }, { status: 429 })
  }

  const { skillName, messages, assessmentSessionId } = await req.json()

  // First message — return static opening question (no LLM needed)
  if (messages.length === 0) {
    return NextResponse.json({
      type: 'question',
      next_question: `What is your current level with ${skillName}? Please describe a real project or situation where you applied this skill.`,
      question_number: 1,
    })
  }

  // Build OpenAI-compatible message history
  const history: ChatMessage[] = [
    { role: 'system', content: `${SYSTEM_PROMPT}\n\nSkill to assess: ${skillName}` },
    {
      role: 'assistant',
      content: JSON.stringify({
        type: 'question',
        next_question: `What is your current level with ${skillName}? Please describe a real project or situation where you applied this skill.`,
        question_number: 1,
      }),
    },
    ...messages.map((m: { role: string; content: string }) => ({
      role: (m.role === 'model' ? 'assistant' : m.role) as ChatMessage['role'],
      content: m.content,
    })),
  ]

  let responseText: string
  try {
    responseText = await chatCompletion(history, { temperature: 0.5, json: true })
  } catch (err) {
    console.error('[assessment] AI error:', err)
    return NextResponse.json({ error: `AI error: ${(err as Error).message}` }, { status: 502 })
  }

  let parsed: Record<string, unknown>
  try {
    parsed = parseJSON(responseText)
  } catch {
    // If JSON parse fails, treat it as a plain question
    parsed = {
      type: 'question',
      next_question: responseText,
      question_number: messages.filter((m: { role: string }) => m.role === 'model').length + 1,
    }
  }

  // On completion: update profile + assessment session (admin to bypass RLS)
  if (parsed.type === 'assessment_complete') {
    const admin = createAdminClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('skills_teach')
      .eq('user_id', user.id)
      .single()

    if (profile) {
      const updatedSkills = profile.skills_teach.map((s: { name: string; level: string }) =>
        s.name.toLowerCase() === skillName.toLowerCase()
          ? { ...s, level: parsed.level, verified: true, assessmentScore: parsed.score }
          : s
      )
      await admin
        .from('profiles')
        .update({ skills_teach: updatedSkills, assessment_completed: true })
        .eq('user_id', user.id)
    }

    if (assessmentSessionId) {
      await admin
        .from('assessment_sessions')
        .update({ messages, final_score: parsed.score, final_level: parsed.level, completed: true })
        .eq('id', assessmentSessionId)
    }
  }

  return NextResponse.json(parsed)
}
