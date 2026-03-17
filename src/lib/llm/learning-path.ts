import { chatCompletion, parseJSON } from './client'

export async function generateLearningPath(params: {
  skillName: string
  currentLevel: string
  targetLevel: string
  recentSessionNotes: string[]
  completedMilestones: string[]
}): Promise<{
  weeklyGoal: string
  resources: { title: string; url: string; type: string }[]
  milestones: { title: string; completed: boolean }[]
}> {
  const prompt = `You are a learning coach designing personalized learning paths.

Learner information:
- Skill: ${params.skillName}
- Current level: ${params.currentLevel}
- Target level: ${params.targetLevel}
- Notes from recent sessions: ${params.recentSessionNotes.join('; ') || 'No sessions yet'}
- Completed milestones: ${params.completedMilestones.join(', ') || 'None'}

Create a 4-week learning path. Return pure JSON (no markdown):
{
  "weeklyGoal": "Specific goal for this week, actionable, 1 sentence",
  "resources": [
    { "title": "resource name", "url": "https://...", "type": "video|article|course|docs|practice" }
  ],
  "milestones": [
    { "title": "specific, measurable milestone", "completed": false }
  ]
}

Requirements:
- resources: 3-5 resources, prefer free (YouTube, official docs, freeCodeCamp, MDN...)
- milestones: 6-8 specific, not generic
- All URLs must be real and accessible`

  const text = await chatCompletion(
    [{ role: 'user', content: prompt }],
    { json: true, temperature: 0.4, maxTokens: 1500 }
  )

  return parseJSON(text)
}
