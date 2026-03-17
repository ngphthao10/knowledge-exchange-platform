import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { matchId, content } = await req.json()
  if (!matchId || !content?.trim()) {
    return NextResponse.json({ error: 'matchId and content are required' }, { status: 400 })
  }

  // Verify user is a participant of this accepted match
  const { data: match } = await supabase
    .from('matches')
    .select('id, status, user_a_id, user_b_id')
    .eq('id', matchId)
    .single()

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  if (match.status !== 'accepted') return NextResponse.json({ error: 'Match not accepted' }, { status: 403 })
  if (match.user_a_id !== user.id && match.user_b_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({ match_id: matchId, sender_id: user.id, content: content.trim() })
    .select()
    .single()

  if (error) {
    console.error('[messages] insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message })
}
