'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface NotificationContextValue {
  unreadCount: number
  pendingMatchCount: number
  markAllRead: () => void
  markMatchesRead: () => void
}

const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  pendingMatchCount: 0,
  markAllRead: () => {},
  markMatchesRead: () => {},
})

const MSG_READ_KEY = 'skillswap_last_read'

export function NotificationProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [pendingMatchCount, setPendingMatchCount] = useState(0)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const matchChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const supabase = createClient()

  const refreshPendingMatches = useCallback(() => {
    supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
      .eq('status', 'pending')
      .then(({ count: c }) => setPendingMatchCount(c ?? 0))
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!userId) return

    const lastRead = parseInt(localStorage.getItem(MSG_READ_KEY) ?? '0', 10)
    const lastReadTs = new Date(lastRead).toISOString()

    // Fetch initial unread messages count
    supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .neq('sender_id', userId)
      .gt('created_at', lastReadTs)
      .then(({ count: c }) => setUnreadCount(c ?? 0))

    // Fetch all pending matches (badge persists until all are acted on)
    refreshPendingMatches()

    // Message subscription
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    const channel = supabase
      .channel('global-unread')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as { sender_id: string; content: string }
        if (msg.sender_id === userId) return
        setUnreadCount(prev => prev + 1)
        if (document.hidden && 'Notification' in window) {
          const show = () => new Notification('SkillSwap 💬', {
            body: msg.content.length > 80 ? msg.content.slice(0, 80) + '…' : msg.content,
            icon: '/favicon.ico',
            tag: 'skillswap-msg',
          })
          if (Notification.permission === 'granted') show()
          else if (Notification.permission === 'default') Notification.requestPermission().then(p => { if (p === 'granted') show() })
        }
      })
      .subscribe()
    channelRef.current = channel

    // Match subscription — re-fetch count on any INSERT or UPDATE (accept/decline changes count)
    if (matchChannelRef.current) supabase.removeChannel(matchChannelRef.current)
    const matchChannel = supabase
      .channel('global-matches')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches' }, (payload) => {
        const match = payload.new as { user_a_id: string; user_b_id: string }
        if (match.user_a_id !== userId && match.user_b_id !== userId) return
        refreshPendingMatches()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches' }, (payload) => {
        const match = payload.new as { user_a_id: string; user_b_id: string }
        if (match.user_a_id !== userId && match.user_b_id !== userId) return
        refreshPendingMatches()
      })
      .subscribe()
    matchChannelRef.current = matchChannel

    return () => {
      if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null }
      if (matchChannelRef.current) { supabase.removeChannel(matchChannelRef.current); matchChannelRef.current = null }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const markAllRead = useCallback(() => {
    localStorage.setItem(MSG_READ_KEY, Date.now().toString())
    setUnreadCount(0)
  }, [])

  const markMatchesRead = useCallback(() => {
    // No-op: badge reflects actual pending count, auto-clears when matches are acted on
  }, [])

  return (
    <NotificationContext.Provider value={{ unreadCount, pendingMatchCount, markAllRead, markMatchesRead }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}
