import { redirect } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/dashboard/LogoutButton'
import { SidebarNav, MobileNav } from '@/components/dashboard/SidebarNav'
import { NotificationProvider } from '@/contexts/NotificationContext'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('user_id', user.id)
    .single()

  // New user — hasn't set up profile yet
  if (!profile?.full_name) redirect('/onboarding')

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase()
    : 'U'

  return (
    <NotificationProvider userId={user.id}>
      <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
        {/* Sidebar — desktop only */}
        <aside className="hidden md:flex flex-col w-60 fixed inset-y-0 border-r"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

          {/* Logo */}
          <div className="flex items-center gap-3 px-5 h-14 border-b flex-shrink-0"
            style={{ borderColor: 'var(--border)' }}>
            <Image src="/skillswap-logo.svg" alt="SkillSwap" width={28} height={28} />
            <span className="font-bold text-sm tracking-tight" style={{ color: 'var(--text)' }}>SkillSwap</span>
          </div>

          {/* Nav */}
          <SidebarNav />

          {/* User footer */}
          <div className="flex-shrink-0 px-3 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg mb-1"
              style={{ background: 'var(--surface-2)' }}>
              <div className="w-7 h-7 rounded-lg bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-700 font-bold text-xs flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>
                  {profile?.full_name ?? 'User'}
                </p>
                <p className="text-[11px] truncate" style={{ color: 'var(--text-3)' }}>
                  {user.email}
                </p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </aside>

        {/* Mobile header */}
        <header className="md:hidden fixed top-0 left-0 right-0 h-12 flex items-center px-4 border-b z-40"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <Image src="/skillswap-logo.svg" alt="SkillSwap" width={24} height={24} />
            <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>SkillSwap</span>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 md:ml-60 pt-12 md:pt-0 pb-20 md:pb-0 min-h-screen">
          <div className="px-4 py-5 md:px-8 md:py-8">
            {children}
          </div>
        </main>

        <MobileNav />
      </div>
    </NotificationProvider>
  )
}
