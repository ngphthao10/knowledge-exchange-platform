'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Users } from 'lucide-react'
import { Match, Profile, Message } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

type MatchWithProfiles = Match & { profile_a: Profile; profile_b: Profile }

interface Props {
  matches: MatchWithProfiles[]
  lastMessages: Record<string, Message>
  currentUserId: string
}

const READ_KEY = (matchId: string) => `skillswap_read_${matchId}`

function getLastRead(matchId: string): number {
  if (typeof window === 'undefined') return Date.now()
  return parseInt(localStorage.getItem(READ_KEY(matchId)) ?? '0', 10)
}

const supabase = createClient()

export default function MessagesClient({ matches, lastMessages: initialLastMessages, currentUserId }: Props) {
  const [lastMessages, setLastMessages] = useState<Record<string, Message>>(initialLastMessages)
  const [unreadMatches, setUnreadMatches] = useState<Set<string>>(() => {
    const set = new Set<string>()
    for (const [matchId, msg] of Object.entries(initialLastMessages)) {
      if (msg.sender_id !== currentUserId) {
        const msgTs = new Date(msg.created_at).getTime()
        if (msgTs > getLastRead(matchId)) set.add(matchId)
      }
    }
    return set
  })
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const channel = supabase
      .channel('messages-list')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const msg = payload.new as Message
        // Update last message for this match
        setLastMessages(prev => ({ ...prev, [msg.match_id]: msg }))
        // Mark as unread if from someone else
        if (msg.sender_id !== currentUserId) {
          setUnreadMatches(prev => new Set(prev).add(msg.match_id))
        }
      })
      .subscribe()

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [currentUserId])

  // Sort matches: unread first, then by last message time
  const sortedMatches = [...matches].sort((a, b) => {
    const aUnread = unreadMatches.has(a.id) ? 1 : 0
    const bUnread = unreadMatches.has(b.id) ? 1 : 0
    if (aUnread !== bUnread) return bUnread - aUnread
    const aTime = lastMessages[a.id] ? new Date(lastMessages[a.id].created_at).getTime() : 0
    const bTime = lastMessages[b.id] ? new Date(lastMessages[b.id].created_at).getTime() : 0
    return bTime - aTime
  })

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Messages</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
          Chat with the people you are connected with
        </p>
      </div>

      {sortedMatches.length === 0 ? (
        <div className="rounded-xl border p-16 text-center"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border-2)' }}>
            <Users size={24} style={{ color: 'var(--text-3)' }} />
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-2)' }}>No conversations yet</p>
          <p className="text-xs mb-5" style={{ color: 'var(--text-3)' }}>
            Accept a match to start messaging
          </p>
          <Link href="/matches"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all">
            Go to Matches
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          {sortedMatches.map((match) => {
            const other = match.user_a_id === currentUserId ? match.profile_b : match.profile_a
            const last = lastMessages[match.id]
            const isUnread = unreadMatches.has(match.id)
            const initials = other?.full_name?.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() ?? '?'

            return (
              <Link key={match.id} href={`/messages/${match.id}`}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors border-b last:border-b-0 relative"
                style={{
                  background: isUnread ? 'color-mix(in srgb, var(--surface) 100%, var(--accent) 3%)' : 'var(--surface)',
                  borderColor: 'var(--border)',
                }}>

                {/* Unread dot */}
                {isUnread && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 rounded-r-full bg-violet-500" />
                )}

                {/* Avatar with unread ring */}
                <div className={`relative w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                  isUnread
                    ? 'bg-violet-100 border-2 border-violet-300 text-violet-700'
                    : 'bg-violet-100 border border-violet-200 text-violet-700'
                }`}>
                  {initials}
                  {isUnread && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2"
                      style={{ borderColor: 'var(--surface)' }} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className={`text-sm truncate ${isUnread ? 'font-bold' : 'font-semibold'}`}
                      style={{ color: 'var(--text)' }}>
                      {other?.full_name ?? 'Unknown'}
                    </p>
                    {last && (
                      <span className={`text-[11px] flex-shrink-0 ${isUnread ? 'font-medium' : ''}`}
                        style={{ color: isUnread ? 'var(--accent-fg)' : 'var(--text-3)' }}>
                        {formatDistanceToNow(new Date(last.created_at), { addSuffix: false })}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs truncate ${isUnread ? 'font-medium' : ''}`}
                    style={{ color: isUnread ? 'var(--text-2)' : 'var(--text-3)' }}>
                    {last
                      ? (last.sender_id === currentUserId ? 'You: ' : '') + last.content
                      : 'Start a conversation...'}
                  </p>
                </div>

                {/* Unread count bubble */}
                {isUnread && (
                  <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">
                    N
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
