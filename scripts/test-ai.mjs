/**
 * AI Provider Test Script
 * Run: node scripts/test-ai.mjs
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

// Load .env.local manually
const envPath = resolve(__dir, '../.env.local')
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const [key, ...rest] = trimmed.split('=')
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
}

const BASE = (process.env.AI_BASE_URL ?? 'http://localhost:11434').replace(/\/$/, '')
const MODEL = process.env.AI_MODEL ?? 'qwen3:30b-a3b'
const API_KEY = process.env.AI_API_KEY ?? 'ollama'

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const CYAN = '\x1b[36m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'

const pass = msg => console.log(`${GREEN}  ✓${RESET} ${msg}`)
const fail = (msg, err) => console.log(`${RED}  ✗${RESET} ${msg}\n    ${DIM}${err}${RESET}`)
const info = msg => console.log(`${CYAN}  →${RESET} ${msg}`)
const warn = msg => console.log(`${YELLOW}  ⚠${RESET} ${msg}`)
const section = title => console.log(`\n${CYAN}━━ ${title} ${'━'.repeat(Math.max(0, 50 - title.length))}${RESET}`)

async function chatCompletion(messages, opts = {}) {
  const { temperature = 0.4, json = false, maxTokens = 512 } = opts
  const body = { model: MODEL, messages, temperature, max_tokens: maxTokens, stream: false }
  if (json) body.response_format = { type: 'json_object' }

  const res = await fetch(`${BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() ?? ''
}

// ──────────────────────────────────────────────────────────────────────────────
// TEST 1: Connection
// ──────────────────────────────────────────────────────────────────────────────
async function testConnection() {
  section('TEST 1 — AI Provider Connection')
  info(`Base URL : ${BASE}`)
  info(`Model    : ${MODEL}`)
  info(`API Key  : ${API_KEY.slice(0, 8)}${'*'.repeat(Math.max(0, API_KEY.length - 8))}`)

  try {
    const res = await fetch(`${BASE}/v1/models`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    })
    if (res.ok) {
      const data = await res.json()
      const models = data.data?.map(m => m.id) ?? []
      pass(`Server reachable (${models.length} model(s) listed)`)
      if (models.length > 0 && models.length <= 5) info(`Models: ${models.join(', ')}`)
    } else {
      warn(`/v1/models returned ${res.status} — skipping model list check`)
    }
  } catch (e) {
    fail('Cannot reach AI server', e.message)
    return false
  }
  return true
}

// ──────────────────────────────────────────────────────────────────────────────
// TEST 2: Basic chat
// ──────────────────────────────────────────────────────────────────────────────
async function testBasicChat() {
  section('TEST 2 — Basic Chat Completion')
  try {
    const start = Date.now()
    const reply = await chatCompletion([
      { role: 'user', content: 'Trả lời đúng 1 từ: thủ đô của Việt Nam là gì?' },
    ])
    const ms = Date.now() - start
    if (reply.toLowerCase().includes('hà nội') || reply.toLowerCase().includes('hanoi')) {
      pass(`Response correct: "${reply}" (${ms}ms)`)
    } else {
      warn(`Unexpected answer: "${reply}" (${ms}ms)`)
    }
    return true
  } catch (e) {
    fail('Basic chat failed', e.message)
    return false
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// TEST 3: JSON output
// ──────────────────────────────────────────────────────────────────────────────
async function testJSONOutput() {
  section('TEST 3 — JSON Structured Output')
  try {
    const start = Date.now()
    const raw = await chatCompletion(
      [{ role: 'user', content: 'Trả về JSON: {"name": "SkillSwap", "type": "app"}' }],
      { json: true }
    )
    const ms = Date.now() - start
    const cleaned = raw.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim()
    const parsed = JSON.parse(cleaned)
    pass(`JSON parsed successfully (${ms}ms): ${JSON.stringify(parsed)}`)
    return true
  } catch (e) {
    fail('JSON output failed', e.message)
    return false
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// TEST 4: Match explanation
// ──────────────────────────────────────────────────────────────────────────────
async function testMatchExplanation() {
  section('TEST 4 — Match Explanation (Matching Feature)')
  try {
    const start = Date.now()
    const prompt = `Người A dạy: React, TypeScript
Người A muốn học: Piano, English

Người B dạy: Piano, English Speaking
Người B muốn học: React, JavaScript

Điểm tương thích: 85%

Viết 1-2 câu tiếng Việt giải thích tại sao đây là cặp match tốt. Ngắn gọn, cụ thể.`

    const reply = await chatCompletion([{ role: 'user', content: prompt }], { temperature: 0.5 })
    const ms = Date.now() - start
    if (reply.length > 20) {
      pass(`Match explanation generated (${ms}ms)`)
      info(`"${reply.slice(0, 120)}${reply.length > 120 ? '...' : ''}"`)
    } else {
      warn(`Response too short: "${reply}"`)
    }
    return true
  } catch (e) {
    fail('Match explanation failed', e.message)
    return false
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// TEST 5: Learning path generation
// ──────────────────────────────────────────────────────────────────────────────
async function testLearningPath() {
  section('TEST 5 — Learning Path Generation')
  try {
    const start = Date.now()
    const prompt = `Bạn là learning coach thiết kế lộ trình học tập cá nhân hóa.

Thông tin người học:
- Skill: React
- Level hiện tại: beginner
- Level mục tiêu: intermediate
- Notes từ session gần đây: Chưa có
- Milestones đã hoàn thành: Chưa có

Tạo lộ trình ngắn. Trả về JSON thuần túy:
{
  "weeklyGoal": "string",
  "resources": [{"title":"string","url":"https://...","type":"video|article|course|docs|practice"}],
  "milestones": [{"title":"string","completed":false}]
}

Chỉ 2 resources và 3 milestones để test nhanh.`

    const raw = await chatCompletion([{ role: 'user', content: prompt }], { json: true, maxTokens: 800 })
    const ms = Date.now() - start
    const cleaned = raw.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim()
    const parsed = JSON.parse(cleaned)

    const checks = [
      ['weeklyGoal', typeof parsed.weeklyGoal === 'string' && parsed.weeklyGoal.length > 0],
      ['resources array', Array.isArray(parsed.resources) && parsed.resources.length > 0],
      ['milestones array', Array.isArray(parsed.milestones) && parsed.milestones.length > 0],
      ['resource has url', parsed.resources?.[0]?.url?.startsWith('http')],
    ]

    let allPass = true
    for (const [label, ok] of checks) {
      if (ok) pass(`  ${label}`)
      else { fail(`  ${label}`, 'missing or invalid'); allPass = false }
    }
    if (allPass) info(`Generated in ${ms}ms — weeklyGoal: "${parsed.weeklyGoal?.slice(0, 60)}..."`)
    return allPass
  } catch (e) {
    fail('Learning path generation failed', e.message)
    return false
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// TEST 6: Assessment chat
// ──────────────────────────────────────────────────────────────────────────────
async function testAssessment() {
  section('TEST 6 — Assessment Chat (Multi-turn)')
  try {
    const skillName = 'JavaScript'
    const systemPrompt = `Bạn là assessor đánh giá kỹ năng qua hội thoại.
Đánh giá level thật sự của người dùng qua 5-7 câu hỏi adaptive.
Hỏi bằng tiếng Việt. Chỉ trả về JSON thuần túy.
Khi đang hỏi: {"type":"question","next_question":"<câu hỏi>","question_number":<1-7>}
Khi kết thúc: {"type":"assessment_complete","score":<0-100>,"level":"beginner"|"intermediate"|"advanced","summary":"<nhận xét>","next_question":null}
Skill cần đánh giá: ${skillName}`

    // Turn 1: user describes experience
    const start = Date.now()
    const turn1 = await chatCompletion([
      { role: 'system', content: systemPrompt },
      {
        role: 'assistant', content: JSON.stringify({
          type: 'question',
          next_question: `Bạn đang ở level nào với ${skillName}? Mô tả một dự án thực tế.`,
          question_number: 1,
        }),
      },
      { role: 'user', content: 'Tôi đã làm việc với JavaScript 2 năm, đã xây dựng các ứng dụng React với REST API.' },
    ], { json: true, maxTokens: 300 })

    const r1 = JSON.parse(turn1.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim())
    if (r1.type === 'question' && r1.next_question) {
      pass(`Turn 1 — question generated (Q${r1.question_number})`)
      info(`"${r1.next_question.slice(0, 80)}..."`)
    } else {
      warn(`Turn 1 unexpected format: ${JSON.stringify(r1)}`)
    }

    const ms = Date.now() - start
    pass(`Assessment multi-turn test completed (${ms}ms)`)
    return true
  } catch (e) {
    fail('Assessment chat failed', e.message)
    return false
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ──────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${CYAN}╔══════════════════════════════════════════════════════╗`)
  console.log(`║          SKILLSWAP — AI API TEST SUITE               ║`)
  console.log(`╚══════════════════════════════════════════════════════╝${RESET}`)

  const results = []

  const ok = await testConnection()
  results.push(['Connection', ok])
  if (!ok) {
    console.log(`\n${RED}Cannot connect to AI server. Aborting remaining tests.${RESET}\n`)
    process.exit(1)
  }

  results.push(['Basic Chat', await testBasicChat()])
  results.push(['JSON Output', await testJSONOutput()])
  results.push(['Match Explanation', await testMatchExplanation()])
  results.push(['Learning Path', await testLearningPath()])
  results.push(['Assessment Chat', await testAssessment()])

  section('SUMMARY')
  let passed = 0
  for (const [name, ok] of results) {
    if (ok) { pass(name); passed++ }
    else fail(name, 'see details above')
  }

  console.log(`\n  ${passed}/${results.length} tests passed\n`)
  process.exit(passed === results.length ? 0 : 1)
}

main().catch(e => {
  console.error(`\n${RED}Fatal error:${RESET}`, e.message)
  process.exit(1)
})
