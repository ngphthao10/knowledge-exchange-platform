import { chatCompletion } from './client'

export async function generateMatchExplanation(
  userA: { skills_teach: { name: string }[]; skills_learn: { name: string }[] },
  userB: { skills_teach: { name: string }[]; skills_learn: { name: string }[] },
  similarityScore: number
): Promise<string> {
  const prompt = `Person A teaches: ${userA.skills_teach.map(s => s.name).join(', ')}
Person A wants to learn: ${userA.skills_learn.map(s => s.name).join(', ')}

Person B teaches: ${userB.skills_teach.map(s => s.name).join(', ')}
Person B wants to learn: ${userB.skills_learn.map(s => s.name).join(', ')}

Compatibility score: ${Math.round(similarityScore * 100)}%

Write 1-2 sentences in English explaining why this is a good match. Be concise and specific.`

  return chatCompletion([{ role: 'user', content: prompt }], { temperature: 0.5 })
}

export function computeSkillOverlapScore(
  userA: { skills_teach: { name: string }[]; skills_learn: { name: string }[] },
  userB: { skills_teach: { name: string }[]; skills_learn: { name: string }[] }
): number {
  const aTeach = userA.skills_teach.map(s => s.name.toLowerCase())
  const aLearn = userA.skills_learn.map(s => s.name.toLowerCase())
  const bTeach = userB.skills_teach.map(s => s.name.toLowerCase())
  const bLearn = userB.skills_learn.map(s => s.name.toLowerCase())

  const aTeachesBWants = aTeach.filter(s => bLearn.includes(s)).length
  const bTeachesAWants = bTeach.filter(s => aLearn.includes(s)).length

  const denominator = Math.max(aTeach.length, bTeach.length, 1)
  if (aTeach.length === 0 && bTeach.length === 0) return 0.3

  return Math.min(1, (aTeachesBWants + bTeachesAWants) / denominator)
}
