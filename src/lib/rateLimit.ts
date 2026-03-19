/**
 * Simple in-memory sliding-window rate limiter.
 * Works per-process — sufficient for basic abuse prevention.
 * For multi-instance deployments, replace with Upstash Redis.
 */

interface Window {
  timestamps: number[]
  blocked: boolean
}

const store = new Map<string, Window>()

// Clean up old entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cutoff = Date.now() - 60_000
    for (const [key, win] of store) {
      if (win.timestamps.every(t => t < cutoff)) store.delete(key)
    }
  }, 5 * 60_000)
}

/**
 * @param key       Unique identifier (e.g. user ID or IP)
 * @param limit     Max requests allowed in the window
 * @param windowMs  Time window in milliseconds
 * @returns true if the request is allowed, false if rate-limited
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const cutoff = now - windowMs
  const win = store.get(key) ?? { timestamps: [], blocked: false }

  win.timestamps = win.timestamps.filter(t => t > cutoff)
  if (win.timestamps.length >= limit) {
    store.set(key, win)
    return false
  }

  win.timestamps.push(now)
  store.set(key, win)
  return true
}
