/**
 * Unified AI client — works with any OpenAI-compatible API.
 *
 * Switch provider via .env.local:
 *
 * ── OpenAI ────────────────────────────────────────────────
 *   AI_BASE_URL = https://api.openai.com
 *   AI_MODEL    = gpt-4o-mini
 *   AI_API_KEY  = sk-...
 *
 * ── Local LLM (Ollama) ────────────────────────────────────
 *   AI_BASE_URL = http://localhost:11434
 *   AI_MODEL    = qwen3:30b-a3b
 *   AI_API_KEY  = ollama          (any non-empty string)
 *
 * ── Local LLM (LM Studio) ─────────────────────────────────
 *   AI_BASE_URL = http://localhost:1234
 *   AI_MODEL    = <model-name-in-lm-studio>
 *   AI_API_KEY  = lm-studio
 */

const BASE = (process.env.AI_BASE_URL ?? 'http://localhost:11434').replace(/\/$/, '')
const MODEL = process.env.AI_MODEL ?? 'qwen3:30b-a3b'
const API_KEY = process.env.AI_API_KEY ?? 'ollama'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface CompletionOptions {
  temperature?: number
  json?: boolean
  maxTokens?: number
}

export async function chatCompletion(
  messages: ChatMessage[],
  options: CompletionOptions = {}
): Promise<string> {
  const { temperature = 0.4, json = false, maxTokens = 2048 } = options

  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: false,
  }

  if (json) {
    body.response_format = { type: 'json_object' }
  }

  const res = await fetch(`${BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`AI provider error ${res.status}: ${text}`)
  }

  const data = await res.json()
  return (data.choices?.[0]?.message?.content ?? '').trim()
}

/** Strip markdown code fences and parse JSON */
export function parseJSON<T>(text: string): T {
  const cleaned = text
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/im, '')
    .trim()
  return JSON.parse(cleaned) as T
}
