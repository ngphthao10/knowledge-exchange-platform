'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ArrowLeft, Send, ArrowDown, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { Message, Profile } from '@/lib/types'
import { useNotifications } from '@/contexts/NotificationContext'

const READ_KEY = (matchId: string) => `skillswap_read_${matchId}`

interface Props {
  matchId: string
  initialMessages: Message[]
  currentUserId: string
  otherProfile: Profile
}

// Singleton supabase client for Realtime (avoid StrictMode double-subscribe issues)
const supabaseClient = createClient()

export default function ChatClient({ matchId, initialMessages, currentUserId, otherProfile }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [newMsgNotif, setNewMsgNotif] = useState<string | null>(null)
  const [moderationWarning, setModerationWarning] = useState<string | null>(null)
  const [atBottom, setAtBottom] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<ReturnType<typeof supabaseClient.channel> | null>(null)
  const { markAllRead } = useNotifications()

  // Mark this conversation as read on open
  useEffect(() => {
    localStorage.setItem(READ_KEY(matchId), Date.now().toString())
    markAllRead()
  }, [matchId, markAllRead])

  const otherInitials = otherProfile?.full_name?.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() ?? '?'

  // Deduplicate messages in render — safety net against any double-adds
  const dedupedMessages = useMemo(() => {
    const seen = new Set<string>()
    return messages.filter(m => {
      // For temp messages, key by content+sender to avoid collision
      const key = m.id.startsWith('temp-') ? `temp:${m.sender_id}:${m.content}` : m.id
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [messages])

  // Realtime subscription
  useEffect(() => {
    // Clean up any existing channel first (handles StrictMode double-mount)
    if (channelRef.current) {
      supabaseClient.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabaseClient
      .channel(`chat:${matchId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`,
      }, (payload) => {
        const newMsg = payload.new as Message

        // Skip own messages — managed via optimistic UI
        if (newMsg.sender_id === currentUserId) return

        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })

        // Show notification if not at bottom
        if (!atBottom) {
          setNewMsgNotif(`New message from ${otherProfile?.full_name ?? 'user'}`)
          setTimeout(() => setNewMsgNotif(null), 3000)
        }
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      supabaseClient.removeChannel(channel)
      channelRef.current = null
    }
  }, [matchId, currentUserId, atBottom, otherProfile?.full_name])

  // Track scroll position to know if user is at bottom
  useEffect(() => {
    const el = scrollAreaRef.current
    if (!el) return
    const onScroll = () => {
      const diff = el.scrollHeight - el.scrollTop - el.clientHeight
      setAtBottom(diff < 60)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // Auto-scroll when at bottom and new messages arrive
  useEffect(() => {
    if (atBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [dedupedMessages, atBottom])

  // Scroll to bottom on first load
  useEffect(() => {
    bottomRef.current?.scrollIntoView()
  }, [])

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setNewMsgNotif(null)
    setAtBottom(true)
  }

  const sendMessage = useCallback(async () => {
    const content = input.trim()
    if (!content || sending) return
    setInput('')
    setSending(true)

    const tempId = `temp-${Date.now()}-${Math.random()}`
    const optimistic: Message = {
      id: tempId,
      match_id: matchId,
      sender_id: currentUserId,
      content,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, content }),
      })
      const data = await res.json()

      if (res.status === 422 && data.error === 'MONEY_DETECTED') {
        // Blocked by moderation — remove optimistic message, restore input, show warning
        setMessages(prev => prev.filter(m => m.id !== tempId))
        setInput(content)
        setModerationWarning(data.message)
        setTimeout(() => setModerationWarning(null), 6000)
      } else if (data.message) {
        setModerationWarning(null)
        setMessages(prev => {
          if (prev.some(m => m.id === data.message.id)) {
            return prev.filter(m => m.id !== tempId)
          }
          return prev.map(m => m.id === tempId ? data.message : m)
        })
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId))
        setInput(content)
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setInput(content)
    }

    setSending(false)
  }, [input, sending, matchId, currentUserId])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-168px)] md:h-[calc(100dvh-96px)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 mb-2 border-b flex-shrink-0"
        style={{ borderColor: 'var(--border)' }}>
        <Link href="/messages"
          className="w-8 h-8 flex items-center justify-center rounded-lg border transition-all hover:border-violet-500/30"
          style={{ borderColor: 'var(--border-2)', color: 'var(--text-3)' }}>
          <ArrowLeft size={14} />
        </Link>
        <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-bold text-sm flex-shrink-0">
          {otherInitials}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{otherProfile?.full_name}</p>
          <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>
            {otherProfile?.skills_teach?.map((s: { name: string }) => s.name).slice(0, 2).join(' · ')}
          </p>
        </div>
      </div>

      {/* Messages scroll area */}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto min-h-0 relative">
        <div className="space-y-1 pr-1 pb-2">
          {dedupedMessages.length === 0 && (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                No messages yet. Start the conversation! 👋
              </p>
            </div>
          )}

          {dedupedMessages.map((msg, i) => {
            const isMe = msg.sender_id === currentUserId
            const prevMsg = dedupedMessages[i - 1]
            const showDate = !prevMsg ||
              format(new Date(msg.created_at), 'dd/MM/yyyy') !== format(new Date(prevMsg.created_at), 'dd/MM/yyyy')
            const showAvatar = !isMe && (!prevMsg || prevMsg.sender_id !== msg.sender_id || showDate)
            const isTemp = msg.id.startsWith('temp-')

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex items-center gap-3 py-3">
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                    <span className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}>
                      {format(new Date(msg.created_at), 'MMMM dd')}
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                  </div>
                )}

                <div className={`flex items-end gap-2 mb-0.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isMe && (
                    <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[11px] font-bold ${
                      showAvatar ? 'bg-violet-600/20 border border-violet-500/30 text-violet-400' : 'opacity-0 pointer-events-none'
                    }`}>
                      {showAvatar ? otherInitials[0] : ''}
                    </div>
                  )}

                  <div className={`max-w-[72%] px-3 py-2 rounded-2xl text-sm transition-opacity ${
                    isMe ? 'rounded-br-sm bg-violet-600 text-white' : 'rounded-bl-sm border'
                  } ${isTemp ? 'opacity-50' : 'opacity-100'}`}
                    style={isMe ? {} : { background: 'var(--surface-2)', borderColor: 'var(--border-2)', color: 'var(--text)' }}>
                    <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className={`text-[10px] mt-0.5 text-right ${isMe ? 'text-white/50' : ''}`}
                      style={!isMe ? { color: 'var(--text-3)' } : {}}>
                      {isTemp ? 'Sending...' : format(new Date(msg.created_at), 'HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* New message notification + scroll-to-bottom */}
        {(!atBottom || newMsgNotif) && (
          <div className="sticky bottom-2 flex justify-center pointer-events-none">
            <button
              onClick={scrollToBottom}
              className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg transition-all hover:opacity-90"
              style={{ background: newMsgNotif ? 'var(--accent)' : 'var(--surface-2)', color: newMsgNotif ? 'white' : 'var(--text-2)', border: '1px solid var(--border-2)' }}>
              <ArrowDown size={11} />
              {newMsgNotif ?? 'Scroll down'}
            </button>
          </div>
        )}
      </div>

      {/* Moderation warning */}
      {moderationWarning && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl text-xs mb-2 flex-shrink-0"
          style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
          <ShieldAlert size={13} className="flex-shrink-0 mt-0.5" />
          <span>{moderationWarning}</span>
        </div>
      )}

      {/* Input */}
      <div className="pt-3 mt-2 border-t flex gap-2 items-end flex-shrink-0"
        style={{ borderColor: 'var(--border)' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message... (Enter to send)"
          rows={1}
          className="flex-1 rounded-xl px-4 py-3 text-sm focus:outline-none resize-none transition-colors"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border-2)',
            color: 'var(--text)',
            maxHeight: '120px',
          }}
          onInput={e => {
            const t = e.currentTarget
            t.style.height = 'auto'
            t.style.height = Math.min(t.scrollHeight, 120) + 'px'
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white transition-all disabled:opacity-40"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  )
}
