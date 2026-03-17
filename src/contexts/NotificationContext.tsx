'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface NotificationContextValue {
  unreadCount: number
  markAllRead: () => void
}

const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  markAllRead: () => {},
})

const STORAGE_KEY = 'skillswap_last_read'

export function NotificationProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return

    const lastRead = parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10)
    const lastReadTs = new Date(lastRead).toISOString()

    // Fetch initial unread count
    supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .neq('sender_id', userId)
      .gt('created_at', lastReadTs)
      .then(({ count: c }) => setUnreadCount(c ?? 0))

    // Single global subscription for unread messages
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel('global-unread')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const msg = payload.new as { sender_id: string; content: string }
        if (msg.sender_id === userId) return

        setUnreadCount(prev => prev + 1)

        // Browser notification when tab is hidden
        if (document.hidden && 'Notification' in window) {
          const show = () => new Notification('SkillSwap 💬', {
            body: msg.content.length > 80 ? msg.content.slice(0, 80) + '…' : msg.content,
            icon: '/favicon.ico',
            tag: 'skillswap-msg',
          })

          if (Notification.permission === 'granted') {
            show()
          } else if (Notification.permission === 'default') {
            Notification.requestPermission().then(p => { if (p === 'granted') show() })
          }
        }
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const markAllRead = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString())
    setUnreadCount(0)
  }, [])

  return (
    <NotificationContext.Provider value={{ unreadCount, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}
