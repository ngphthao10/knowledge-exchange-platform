import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatCompletion, parseJSON } from '@/lib/ai/client'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId, transcript, skillTopic, isFinal } = await req.json()
  if (!transcript?.trim()) return NextResponse.json({ teacherHint: null, learnerHint: null })

  // If final — generate full summary and save to session notes
  if (isFinal) {
    const summaryPrompt = `You are an AI learning coach. Here is the full transcript of a skill exchange session about "${skillTopic}".

Transcript:
${transcript}

Write a concise session summary (3-5 bullet points) covering:
- Main concepts taught
- Key questions asked
- Progress made
- Suggested next steps

Keep it under 200 words. Use plain text, no markdown headers.`

    try {
      const summary = await chatCompletion([{ role: 'user', content: summaryPrompt }], { temperature: 0.4, maxTokens: 300 })
      if (sessionId) {
        const admin = (await import('@/lib/supabase/server')).createAdminClient()
        await admin.from('sessions').update({ notes: summary }).eq('id', sessionId)
      }
      return NextResponse.json({ summary })
    } catch {
      return NextResponse.json({ summary: '' })
    }
  }

  // Real-time coaching hints
  const prompt = `You are an ambient AI coach observing a skill exchange session about "${skillTopic}".

Recent transcript (last ~15 seconds):
"${transcript}"

Based on this snippet, provide short coaching hints for both sides. Be concise (max 15 words each).
Return JSON:
{
  "teacherHint": "<hint for the teacher, or null if nothing to suggest>",
  "learnerHint": "<hint for the learner, or null if nothing to suggest>"
}

Only give a hint if there's something genuinely useful. Return null if the conversation is going well.`

  try {
    const raw = await chatCompletion(
      [{ role: 'user', content: prompt }],
      { json: true, temperature: 0.5, maxTokens: 100 }
    )
    const result = parseJSON<{ teacherHint: string | null; learnerHint: string | null }>(raw)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ teacherHint: null, learnerHint: null })
  }
}
