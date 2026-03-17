import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

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
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash-8b',
    generationConfig: { responseMimeType: 'application/json' },
  })

  const prompt = `
You are a learning coach specializing in personalized learning paths.

Learner information:
- Skill: ${params.skillName}
- Current level: ${params.currentLevel}
- Target level: ${params.targetLevel}
- Notes from recent sessions: ${params.recentSessionNotes.join('; ') || 'No sessions yet'}
- Completed milestones: ${params.completedMilestones.join(', ') || 'None'}

Create a 4-week learning path with:
1. weekly_goal: A specific goal for this week (1 sentence, actionable)
2. resources: 3-5 learning resources (prefer free: YouTube, documentation, blog)
3. milestones: 6-8 specific, measurable checkpoints

Return JSON:
{
  "weeklyGoal": "string",
  "resources": [
    { "title": "string", "url": "https://...", "type": "video|article|course|docs|practice" }
  ],
  "milestones": [
    { "title": "string", "completed": false }
  ]
}

Note: Resources must have real URLs. Milestones must be specific, not generic.
`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  return JSON.parse(text)
}
