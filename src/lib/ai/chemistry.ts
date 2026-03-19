import { chatCompletion, parseJSON } from './client'

type ProfileForChemistry = {
  full_name?: string
  bio?: string
  skills_teach: { name: string; level?: string }[]
  skills_learn: { name: string }[]
  availability?: string[]
}

export async function computeChemistryScore(
  userA: ProfileForChemistry,
  userB: ProfileForChemistry
): Promise<{ score: number; explanation: string }> {
  const nameA = userA.full_name ?? 'Person A'
  const nameB = userB.full_name ?? 'Person B'

  const prompt = `You are analyzing learning chemistry between two people for a peer-to-peer skill exchange.

${nameA}:
Bio: ${userA.bio || 'Not provided'}
Teaches: ${userA.skills_teach.map(s => `${s.name}${s.level ? ` (${s.level})` : ''}`).join(', ')}
Wants to learn: ${userA.skills_learn.map(s => s.name).join(', ')}
Available: ${userA.availability?.join(', ') || 'flexible'}

${nameB}:
Bio: ${userB.bio || 'Not provided'}
Teaches: ${userB.skills_teach.map(s => `${s.name}${s.level ? ` (${s.level})` : ''}`).join(', ')}
Wants to learn: ${userB.skills_learn.map(s => s.name).join(', ')}
Available: ${userB.availability?.join(', ') || 'flexible'}

Infer their learning/teaching styles from how they describe themselves and their skill backgrounds. Then rate their chemistry (0.0 to 1.0) based on:
- Are their communication styles compatible? (e.g. one is hands-on, other is theoretical = low)
- Do their backgrounds suggest similar thinking styles or complementary approaches?
- Would they naturally click as learning partners?

Return JSON only:
{
  "score": <number 0.0-1.0>,
  "explanation": "<one sentence using both names, explaining the chemistry score concisely>"
}`

  try {
    const raw = await chatCompletion(
      [{ role: 'user', content: prompt }],
      { json: true, temperature: 0.4, maxTokens: 200 }
    )
    const result = parseJSON<{ score: number; explanation: string }>(raw)
    return {
      score: Math.max(0, Math.min(1, result.score ?? 0.5)),
      explanation: result.explanation ?? '',
    }
  } catch {
    return { score: 0.5, explanation: '' }
  }
}
