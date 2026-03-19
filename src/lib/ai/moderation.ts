import { chatCompletion } from './client'

// Fast keyword pre-check — avoid AI call for obvious cases
const MONEY_KEYWORDS = [
  // Vietnamese
  'trả tiền', 'thanh toán', 'chuyển khoản', 'phí', 'học phí', 'tiền công',
  'thù lao', 'tính tiền', 'bao nhiêu tiền', 'giá', 'báo giá', 'trả phí',
  'tiền dạy', 'tiền học', 'thu tiền', 'trả thêm', 'lương', 'hoa hồng',
  'momo', 'zalopay', 'vietqr', 'số tài khoản', 'stk',
  // English
  'pay', 'payment', 'fee', 'charge', 'rate per', 'per hour', 'per session',
  'invoice', 'bank transfer', 'paypal', 'venmo', 'wire transfer', 'how much',
  'cost', 'pricing', 'paid', 'salary', 'compensat',
]

function hasMoneyKeyword(text: string): boolean {
  const lower = text.toLowerCase()
  return MONEY_KEYWORDS.some(kw => lower.includes(kw))
}

export async function detectMoneyTransaction(content: string): Promise<boolean> {
  // Fast path: no suspicious keywords → skip AI call
  if (!hasMoneyKeyword(content)) return false

  // AI confirmation to reduce false positives
  try {
    const result = await chatCompletion(
      [
        {
          role: 'system',
          content: 'You are a content moderator for a free skill-exchange platform. Respond with only YES or NO.',
        },
        {
          role: 'user',
          content: `Does this message involve requesting or offering money, payment, fees, or financial compensation for teaching/learning?\n\nMessage: "${content}"\n\nAnswer YES or NO only.`,
        },
      ],
      { temperature: 0, maxTokens: 5 }
    )
    return result.trim().toUpperCase().startsWith('YES')
  } catch {
    // If AI fails, fall back to keyword result (already true to reach here)
    return true
  }
}
