'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button onClick={handleLogout}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-xs font-medium hover:text-red-400"
      style={{ color: 'var(--text-3)' }}
    >
      <LogOut size={15} />
      Sign Out
    </button>
  )
}
