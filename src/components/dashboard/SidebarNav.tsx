'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, User, Link2, CalendarDays, Map, MessageSquare, Compass } from 'lucide-react'
import { useEffect } from 'react'
import React from 'react'
import { useNotifications } from '@/contexts/NotificationContext'

type NavItem = { href: string; label: string; icon: React.ElementType; badge?: boolean }

const sections: { label?: string; items: NavItem[] }[] = [
  {
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/discover', label: 'Discover', icon: Compass },
    ],
  },
  {
    label: 'Social',
    items: [
      { href: '/matches', label: 'Matches', icon: Link2 },
      { href: '/messages', label: 'Messages', icon: MessageSquare, badge: true },
    ],
  },
  {
    label: 'Learning',
    items: [
      { href: '/sessions', label: 'Sessions', icon: CalendarDays },
      { href: '/learning-path', label: 'Learning Path', icon: Map },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/profile', label: 'Profile', icon: User },
    ],
  },
]

const mobileItems: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/matches', label: 'Matches', icon: Link2 },
  { href: '/messages', label: 'Messages', icon: MessageSquare, badge: true },
  { href: '/profile', label: 'Profile', icon: User },
]

function isActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === href
  return pathname.startsWith(href)
}

export function SidebarNav() {
  const pathname = usePathname()
  const { unreadCount, markAllRead } = useNotifications()

  useEffect(() => {
    if (pathname.startsWith('/messages')) markAllRead()
  }, [pathname, markAllRead])

  return (
    <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
      {sections.map((section, i) => (
        <div key={i}>
          {section.label && (
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: 'var(--text-3)' }}>
              {section.label}
            </p>
          )}
          <div className="space-y-0.5">
            {section.items.map(({ href, label, icon: Icon, badge }) => {
              const active = isActive(pathname, href)
              const showBadge = badge && unreadCount > 0
              return (
                <Link key={href} href={href}
                  className={`nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium relative ${active ? 'nav-active' : ''}`}
                  style={{ color: active ? 'var(--text)' : 'var(--text-2)' }}>
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-violet-500" />
                  )}
                  <div className="relative flex-shrink-0">
                    <Icon size={15} style={{ color: active ? 'var(--accent)' : 'inherit' }} />
                    {showBadge && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="flex-1">{label}</span>
                  {showBadge && (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}

export function MobileNav() {
  const pathname = usePathname()
  const { unreadCount, markAllRead } = useNotifications()

  useEffect(() => {
    if (pathname.startsWith('/messages')) markAllRead()
  }, [pathname, markAllRead])

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t z-50"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex">
        {mobileItems.map(({ href, label, icon: Icon, badge }) => {
          const active = isActive(pathname, href)
          const showBadge = badge && unreadCount > 0
          return (
            <Link key={href} href={href}
              className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors relative"
              style={{ color: active ? 'var(--accent)' : 'var(--text-3)' }}>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-b-full bg-violet-500" />
              )}
              <div className="relative">
                <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
