import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET — load current user's skill_futures + pledges (both directions)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: myFutures }, { data: outgoing }, { data: incoming }] = await Promise.all([
    supabase.from('skill_futures').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    // Pledges I made to others' futures
    supabase.from('future_pledges').select('*, future_owner_profile:profiles!future_pledges_future_owner_id_fkey(full_name, skills_teach, skills_learn)').eq('pledger_id', user.id).order('created_at', { ascending: false }),
    // Pledges others made to my futures
    supabase.from('future_pledges').select('*, pledger_profile:profiles!future_pledges_pledger_id_fkey(full_name, skills_teach, skills_learn)').eq('future_owner_id', user.id).order('created_at', { ascending: false }),
  ])

  return NextResponse.json({
    futures: myFutures ?? [],
    outgoing: outgoing ?? [],
    incoming: incoming ?? [],
  })
}

// POST — create future skill OR pledge
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // action: 'create_future' — add a skill I'm learning
  if (body.action === 'create_future') {
    const { skill_name, current_level, target_level, estimated_weeks } = body
    if (!skill_name || !estimated_weeks) {
      return NextResponse.json({ error: 'skill_name and estimated_weeks required' }, { status: 400 })
    }
    const { data, error } = await supabase.from('skill_futures').insert({
      user_id: user.id,
      skill_name,
      current_level: current_level ?? 'beginner',
      target_level: target_level ?? 'intermediate',
      estimated_weeks,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ future: data })
  }

  // action: 'pledge' — commit my skill now for their future skill
  if (body.action === 'pledge') {
    const { future_owner_id, pledger_skill, future_skill, sessions_pledged } = body
    if (!future_owner_id || !pledger_skill || !future_skill) {
      return NextResponse.json({ error: 'future_owner_id, pledger_skill, future_skill required' }, { status: 400 })
    }
    if (future_owner_id === user.id) {
      return NextResponse.json({ error: 'Cannot pledge to yourself' }, { status: 400 })
    }
    const admin = createAdminClient()
    const { data, error } = await admin.from('future_pledges').insert({
      pledger_id: user.id,
      future_owner_id,
      pledger_skill,
      future_skill,
      sessions_pledged: sessions_pledged ?? 5,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ pledge: data })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

// DELETE — remove a future skill I own
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase.from('skill_futures').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
