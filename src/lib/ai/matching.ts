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

  // What fraction of B's learning needs can A cover?
  const aFulfillsB = bLearn.length > 0
    ? aTeach.filter(s => bLearn.some(l => fuzzyMatch(s, l))).length / bLearn.length
    : 0

  // What fraction of A's learning needs can B cover?
  const bFulfillsA = aLearn.length > 0
    ? bTeach.filter(s => aLearn.some(l => fuzzyMatch(s, l))).length / aLearn.length
    : 0

  // Average of both directions — partial matches score between 0 and 1
  const avg = (aFulfillsB + bFulfillsA) / 2

  // Bonus for bidirectional exchange (both sides benefit)
  const mutual = aFulfillsB > 0 && bFulfillsA > 0 ? 0.1 : 0

  return Math.min(1, avg + mutual)
}

// Fuzzy match: exact or significant word overlap
function fuzzyMatch(a: string, b: string): boolean {
  if (a === b) return true
  const aWords = a.split(/[\s/]+/).filter(w => w.length > 2)
  const bWords = b.split(/[\s/]+/).filter(w => w.length > 2)
  return aWords.some(aw => bWords.some(bw => aw.includes(bw) || bw.includes(aw)))
}
