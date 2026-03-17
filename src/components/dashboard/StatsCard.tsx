import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  color?: string
}

export default function StatsCard({ label, value, icon: Icon, color = 'text-violet-400' }: StatsCardProps) {
  return (
    <div className="rounded-xl p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>{value}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{label}</p>
        </div>
        <div className="p-2 rounded-lg" style={{ background: 'var(--surface-2)' }}>
          <Icon size={16} className={color} />
        </div>
      </div>
    </div>
  )
}
