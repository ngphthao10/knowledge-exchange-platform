import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' })

export async function generateSkillEmbedding(profile: {
  skills_teach: { name: string; level: string }[]
  skills_learn: { name: string; level: string }[]
  bio: string
}): Promise<number[]> {
  const text = `
    Teaches: ${profile.skills_teach.map(s => `${s.name} (${s.level})`).join(', ')}
    Wants to learn: ${profile.skills_learn.map(s => `${s.name} (${s.level})`).join(', ')}
    Bio: ${profile.bio}
  `.trim()

  const result = await embeddingModel.embedContent(text)
  return result.embedding.values
}

export async function generateMatchExplanation(
  userA: { skills_teach: { name: string }[]; skills_learn: { name: string }[] },
  userB: { skills_teach: { name: string }[]; skills_learn: { name: string }[] },
  similarityScore: number
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' })

  const prompt = `
Person A teaches: ${userA.skills_teach.map(s => s.name).join(', ')}
Person A wants to learn: ${userA.skills_learn.map(s => s.name).join(', ')}

Person B teaches: ${userB.skills_teach.map(s => s.name).join(', ')}
Person B wants to learn: ${userB.skills_learn.map(s => s.name).join(', ')}

Compatibility score: ${Math.round(similarityScore * 100)}%

Write 1-2 sentences in English explaining why this is a good match. Be concise, specific, and avoid clichés.
`

  const result = await model.generateContent(prompt)
  return result.response.text()
}

export function computeSkillOverlapScore(
  userA: { skills_teach: { name: string }[]; skills_learn: { name: string }[] },
  userB: { skills_teach: { name: string }[]; skills_learn: { name: string }[] }
): number {
  const aTeach = userA.skills_teach.map(s => s.name.toLowerCase())
  const aLearn = userA.skills_learn.map(s => s.name.toLowerCase())
  const bTeach = userB.skills_teach.map(s => s.name.toLowerCase())
  const bLearn = userB.skills_learn.map(s => s.name.toLowerCase())

  // A teaches what B wants to learn
  const aTeachesBWants = aTeach.filter(s => bLearn.includes(s)).length
  // B teaches what A wants to learn
  const bTeachesAWants = bTeach.filter(s => aLearn.includes(s)).length

  const total = aTeach.length + bTeach.length
  if (total === 0) return 0.3

  return Math.min(1, (aTeachesBWants + bTeachesAWants) / Math.max(aTeach.length, bTeach.length, 1))
}
