import { chatCompletion } from './client'

type UserProfile = {
  full_name?: string
  skills_teach: { name: string }[]
  skills_learn: { name: string }[]
}

export async function generateMatchExplanation(
  userA: UserProfile,
  userB: UserProfile,
  _score: number
): Promise<string> {
  // Compute the actual skill exchanges
  const aTeachesBNeeds = userA.skills_teach
    .filter(s => userB.skills_learn.some(l => fuzzyMatch(s.name.toLowerCase(), l.name.toLowerCase())))
    .map(s => s.name)

  const bTeachesANeeds = userB.skills_teach
    .filter(s => userA.skills_learn.some(l => fuzzyMatch(s.name.toLowerCase(), l.name.toLowerCase())))
    .map(s => s.name)

  const nameA = userA.full_name ?? 'Person A'
  const nameB = userB.full_name ?? 'Person B'

  // Build a specific, data-driven prompt
  const exchangeLines: string[] = []
  if (aTeachesBNeeds.length > 0) exchangeLines.push(`${nameA} can teach ${aTeachesBNeeds.join(', ')} to ${nameB}`)
  if (bTeachesANeeds.length > 0) exchangeLines.push(`${nameB} can teach ${bTeachesANeeds.join(', ')} to ${nameA}`)

  if (exchangeLines.length === 0) {
    // No direct overlap — generate a soft reason based on all skills
    const prompt = `${nameA} teaches: ${userA.skills_teach.map(s => s.name).join(', ')} and wants to learn: ${userA.skills_learn.map(s => s.name).join(', ')}.
${nameB} teaches: ${userB.skills_teach.map(s => s.name).join(', ')} and wants to learn: ${userB.skills_learn.map(s => s.name).join(', ')}.

Write exactly 1 sentence in English explaining a potential connection between them based on their skills. Use their actual names. Be specific and concrete. Do NOT mention any score or percentage.`

    try {
      return await chatCompletion([{ role: 'user', content: prompt }], { temperature: 0.6 })
    } catch {
      return `${nameA} and ${nameB} have complementary skill sets that could benefit each other.`
    }
  }

  const prompt = `${exchangeLines.join(', and ')}. Write exactly 1–2 sentences in English explaining why this is a great skill exchange. Use their actual names (${nameA} and ${nameB}). Be enthusiastic but concise. Do NOT mention any score or percentage.`

  try {
    return await chatCompletion([{ role: 'user', content: prompt }], { temperature: 0.6 })
  } catch {
    // Meaningful fallback using actual skill names
    if (aTeachesBNeeds.length > 0 && bTeachesANeeds.length > 0) {
      return `${nameA} teaches ${aTeachesBNeeds.join(' & ')} while ${nameB} teaches ${bTeachesANeeds.join(' & ')} — a perfect mutual exchange.`
    }
    if (aTeachesBNeeds.length > 0) {
      return `${nameA} can help ${nameB} learn ${aTeachesBNeeds.join(' & ')}.`
    }
    return `${nameB} can help ${nameA} learn ${bTeachesANeeds.join(' & ')}.`
  }
}

export function computeSkillOverlapScore(
  userA: { skills_teach: { name: string }[]; skills_learn: { name: string }[] },
  userB: { skills_teach: { name: string }[]; skills_learn: { name: string }[] }
): number {
  const aTeach = userA.skills_teach.map(s => s.name.toLowerCase())
  const aLearn = userA.skills_learn.map(s => s.name.toLowerCase())
  const bTeach = userB.skills_teach.map(s => s.name.toLowerCase())
  const bLearn = userB.skills_learn.map(s => s.name.toLowerCase())

  const aFulfillsB = bLearn.length > 0
    ? aTeach.filter(s => bLearn.some(l => fuzzyMatch(s, l))).length / bLearn.length
    : 0

  const bFulfillsA = aLearn.length > 0
    ? bTeach.filter(s => aLearn.some(l => fuzzyMatch(s, l))).length / aLearn.length
    : 0

  const avg = (aFulfillsB + bFulfillsA) / 2
  const mutual = aFulfillsB > 0 && bFulfillsA > 0 ? 0.1 : 0

  return Math.min(1, avg + mutual)
}

function fuzzyMatch(a: string, b: string): boolean {
  if (a === b) return true
  const aWords = a.split(/[\s/]+/).filter(w => w.length > 2)
  const bWords = b.split(/[\s/]+/).filter(w => w.length > 2)
  return aWords.some(aw => bWords.some(bw => aw.includes(bw) || bw.includes(aw)))
}
