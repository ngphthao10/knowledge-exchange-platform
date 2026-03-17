import { chatCompletion, parseJSON } from './client'

export async function generateLearningPath(params: {
  skillName: string
  currentLevel: string
  targetLevel: string
  recentSessionNotes: string[]
  completedMilestones: string[]
}): Promise<{
  weeklyGoal: string
  milestones: { title: string; completed: boolean }[]
}> {
  const prompt = `You are a learning coach designing personalized learning paths.

Learner information:
- Skill: ${params.skillName}
- Current level: ${params.currentLevel}
- Target level: ${params.targetLevel}
- Notes from recent sessions: ${params.recentSessionNotes.join('; ') || 'None'}
- Completed milestones: ${params.completedMilestones.join(', ') || 'None'}

Create a 4-week learning path. Return pure JSON (no markdown):
{
  "weeklyGoal": "This week's goal, actionable, 1 sentence",
  "milestones": [
    { "title": "specific, measurable milestone", "completed": false }
  ]
}

Requirements: 6-8 specific, realistic, measurable milestones.`

  const text = await chatCompletion(
    [{ role: 'user', content: prompt }],
    { json: true, temperature: 0.4, maxTokens: 1500 }
  )

  console.log('[learning-path] AI raw text:', text.slice(0, 500))

  const raw = parseJSON<Record<string, unknown>>(text)
  console.log('[learning-path] AI parsed keys:', Object.keys(raw))

  // AI may nest everything under a key, e.g. { "learning_path": { ... } }
  const data: Record<string, unknown> =
    (raw.weeklyGoal ?? raw.weekly_goal ?? raw.milestones)
      ? raw
      : (Object.values(raw)[0] as Record<string, unknown>) ?? raw

  return {
    weeklyGoal: (data.weeklyGoal ?? data.weekly_goal ?? '') as string,
    milestones: (data.milestones ?? []) as { title: string; completed: boolean }[],
  }
}
