import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateMatchExplanation, computeSkillOverlapScore } from '@/lib/ai/matching'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Load current user profile
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!currentProfile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  if (!currentProfile.skills_teach?.length || !currentProfile.skills_learn?.length) {
    return NextResponse.json({ error: 'Please add teaching and learning skills before finding matches' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))

  // Direct match from Discover page — skip AI candidate search
  if (body.targetUserId) {
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', body.targetUserId)
      .single()

    if (!targetProfile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const score = computeSkillOverlapScore(currentProfile, targetProfile)
    let reason = ''
    try {
      reason = await generateMatchExplanation(currentProfile, targetProfile, score)
    } catch {
      reason = `Compatibility score: ${Math.round(score * 100)}%`
    }

    const admin = createAdminClient()
    const { data: match, error } = await admin
      .from('matches')
      .upsert(
        { user_a_id: user.id, user_b_id: targetProfile.user_id, match_score: score, match_reason: reason, status: 'pending' },
        { onConflict: 'user_a_id,user_b_id', ignoreDuplicates: false }
      )
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ matches: [{ ...match, profile_b: targetProfile }] })
  }

  // Load existing matches to exclude
  const { data: existingMatches } = await supabase
    .from('matches')
    .select('user_a_id, user_b_id')
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)

  const matchedUserIds = existingMatches?.flatMap(m =>
    [m.user_a_id, m.user_b_id].filter(id => id !== user.id)
  ) ?? []

  let candidateProfiles: typeof currentProfile[] = []

  // Skill overlap matching
  {
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('*')
      .neq('user_id', user.id)
      .not('user_id', 'in', `(${matchedUserIds.length > 0 ? matchedUserIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
      .limit(20)

    if (allProfiles) {
      candidateProfiles = allProfiles
        .filter(p => p.skills_teach?.length > 0 && p.skills_learn?.length > 0)
        .map(p => ({ profile: p, score: computeSkillOverlapScore(currentProfile, p) }))
        // Only include profiles where at least one side can teach the other
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(({ profile }) => profile)
    }
  }

  if (candidateProfiles.length === 0) {
    return NextResponse.json({ matches: [] })
  }

  const admin = createAdminClient()

  // Generate match explanations and create matches
  const newMatches = await Promise.all(
    candidateProfiles.slice(0, 3).map(async (candidate) => {
      const score = computeSkillOverlapScore(currentProfile, candidate)

      let reason = ''
      try {
        reason = await generateMatchExplanation(currentProfile, candidate, score)
      } catch (err) {
        console.error('[match] AI error:', err)
        reason = `Compatibility score: ${Math.round(score * 100)}%`
      }

      // Use admin client to bypass RLS for insert
      const { data: match, error: upsertError } = await admin
        .from('matches')
        .upsert(
          {
            user_a_id: user.id,
            user_b_id: candidate.user_id,
            match_score: score,
            match_reason: reason,
            status: 'pending',
          },
          { onConflict: 'user_a_id,user_b_id', ignoreDuplicates: false }
        )
        .select()
        .single()

      if (upsertError) {
        console.error('[match] DB upsert error:', upsertError.code, upsertError.message)
        return null
      }

      return { ...match, profile_b: candidate }
    })
  )

  return NextResponse.json({ matches: newMatches.filter(Boolean) })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { matchId, status } = await req.json()

  const { data: match, error } = await supabase
    .from('matches')
    .update({ status })
    .eq('id', matchId)
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ match })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      profile_a:profiles!matches_user_a_id_fkey(*),
      profile_b:profiles!matches_user_b_id_fkey(*)
    `)
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  return NextResponse.json({ matches: matches ?? [] })
}
