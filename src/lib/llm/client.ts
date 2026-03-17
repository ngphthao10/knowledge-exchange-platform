const LLM_BASE = (process.env.LOCAL_LLM_URL ?? 'http://localhost:11434').replace(/\/$/, '')
const LLM_MODEL = process.env.LOCAL_LLM_MODEL ?? 'qwen3:30b-a3b'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface CompletionOptions {
  temperature?: number
  /** Request JSON output (sends response_format if the server supports it) */
  json?: boolean
  /** Max tokens to generate */
  maxTokens?: number
}

export async function chatCompletion(
  messages: ChatMessage[],
  options: CompletionOptions = {}
): Promise<string> {
  const { temperature = 0.4, json = false, maxTokens = 2048 } = options

  const body: Record<string, unknown> = {
    model: LLM_MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: false,
  }

  if (json) {
    body.response_format = { type: 'json_object' }
  }

  const res = await fetch(`${LLM_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`LLM server error ${res.status}: ${text}`)
  }

  const data = await res.json()
  const content: string = data.choices?.[0]?.message?.content ?? ''
  return content.trim()
}

/** Parse JSON from LLM response, stripping markdown code blocks if present */
export function parseJSON<T>(text: string): T {
  const cleaned = text
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/im, '')
    .trim()
  return JSON.parse(cleaned) as T
}
