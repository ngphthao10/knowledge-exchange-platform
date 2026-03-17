'use client'

import { useState, useEffect } from 'react'

export default function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Starting now'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      if (d > 0) setTimeLeft(`${d}d ${h}h ${m}m`)
      else if (h > 0) setTimeLeft(`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
      else setTimeLeft(`${m}:${String(s).padStart(2,'0')}`)
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  return (
    <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--accent-fg)' }}>
      {timeLeft}
    </span>
  )
}
