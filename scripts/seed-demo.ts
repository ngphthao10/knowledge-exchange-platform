/**
 * Seed script for demo data
 * Run: npx ts-node scripts/seed-demo.ts
 * Or add to package.json scripts: "seed": "npx ts-node scripts/seed-demo.ts"
 *
 * Prerequisites:
 * - Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 * - Run supabase/migrations/001_initial.sql in Supabase SQL Editor first
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const demoUsers = [
  {
    email: 'minh.dev@demo.com',
    password: 'demo123456',
    full_name: 'Nguyễn Minh',
    bio: 'Frontend developer 3 năm kinh nghiệm, đam mê React và UI/UX',
    skills_teach: [
      { name: 'React', level: 'advanced', verified: true, assessmentScore: 88 },
      { name: 'TypeScript', level: 'intermediate', verified: true, assessmentScore: 72 },
    ],
    skills_learn: [
      { name: 'Piano', level: 'beginner' },
      { name: 'English Speaking', level: 'beginner' },
    ],
    availability: ['weekday_evening', 'weekend_morning'],
    assessment_completed: true,
  },
  {
    email: 'linh.music@demo.com',
    password: 'demo123456',
    full_name: 'Trần Thị Linh',
    bio: 'Giáo viên âm nhạc, chơi piano 8 năm, muốn học lập trình',
    skills_teach: [
      { name: 'Piano', level: 'advanced', verified: true, assessmentScore: 95 },
      { name: 'Music Theory', level: 'advanced', verified: true, assessmentScore: 90 },
    ],
    skills_learn: [
      { name: 'React', level: 'beginner' },
      { name: 'Python', level: 'beginner' },
    ],
    availability: ['weekday_morning', 'weekend_afternoon'],
    assessment_completed: true,
  },
  {
    email: 'hieu.english@demo.com',
    password: 'demo123456',
    full_name: 'Lê Văn Hiếu',
    bio: 'IELTS 8.0, từng du học Canada, dạy tiếng Anh giao tiếp',
    skills_teach: [
      { name: 'English Speaking', level: 'advanced', verified: true, assessmentScore: 92 },
      { name: 'IELTS Preparation', level: 'advanced', verified: false },
    ],
    skills_learn: [
      { name: 'React', level: 'beginner' },
      { name: 'Data Analysis', level: 'beginner' },
    ],
    availability: ['weekday_evening', 'weekend_morning', 'weekend_evening'],
    assessment_completed: true,
  },
  {
    email: 'an.data@demo.com',
    password: 'demo123456',
    full_name: 'Phạm Bảo An',
    bio: 'Data scientist tại startup fintech, yêu thích Python và ML',
    skills_teach: [
      { name: 'Python', level: 'advanced', verified: true, assessmentScore: 85 },
      { name: 'Data Analysis', level: 'advanced', verified: true, assessmentScore: 88 },
    ],
    skills_learn: [
      { name: 'English Speaking', level: 'intermediate' },
      { name: 'Piano', level: 'beginner' },
    ],
    availability: ['weekday_morning', 'weekday_evening'],
    assessment_completed: true,
  },
  {
    email: 'thu.design@demo.com',
    password: 'demo123456',
    full_name: 'Nguyễn Thanh Thu',
    bio: 'UI/UX designer, Figma power user, muốn học code để handoff tốt hơn',
    skills_teach: [
      { name: 'Figma', level: 'advanced', verified: true, assessmentScore: 91 },
      { name: 'UI Design', level: 'advanced', verified: false },
    ],
    skills_learn: [
      { name: 'TypeScript', level: 'beginner' },
      { name: 'React', level: 'beginner' },
    ],
    availability: ['weekend_morning', 'weekend_afternoon'],
    assessment_completed: true,
  },
]

async function seed() {
  console.log('🌱 Starting seed...\n')

  const createdUserIds: Record<string, string> = {}

  for (const user of demoUsers) {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      user_metadata: { full_name: user.full_name },
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes('already been registered')) {
        console.log(`⚠️  User ${user.email} already exists, skipping...`)
        const { data: existing } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('full_name', user.full_name)
          .single()
        if (existing) createdUserIds[user.email] = existing.user_id
        continue
      }
      console.error(`❌ Error creating user ${user.email}:`, authError.message)
      continue
    }

    const userId = authData.user.id
    createdUserIds[user.email] = userId
    console.log(`✅ Created user: ${user.full_name} (${user.email})`)

    // Update profile (trigger creates it)
    await new Promise(r => setTimeout(r, 500)) // wait for trigger
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        bio: user.bio,
        skills_teach: user.skills_teach,
        skills_learn: user.skills_learn,
        availability: user.availability,
        assessment_completed: user.assessment_completed,
      })
      .eq('user_id', userId)

    if (profileError) {
      console.error(`❌ Profile update error:`, profileError.message)
    } else {
      console.log(`   📝 Profile updated`)
    }
  }

  // Create some matches between demo users
  const userIds = Object.values(createdUserIds)
  if (userIds.length >= 2) {
    const matchPairs = [
      { a: 0, b: 1, score: 0.87, reason: 'Minh dạy React cho Linh, Linh dạy Piano cho Minh — cặp trao đổi hoàn hảo!' },
      { a: 0, b: 2, score: 0.75, reason: 'Minh cần học tiếng Anh, Hiếu cần học React — win-win cho cả hai.' },
      { a: 1, b: 3, score: 0.72, reason: 'An muốn học Piano, Linh muốn học Python — sự bổ trợ tuyệt vời.' },
    ]

    for (const pair of matchPairs) {
      const aId = userIds[pair.a]
      const bId = userIds[pair.b]
      if (!aId || !bId) continue

      const { error } = await supabase.from('matches').insert({
        user_a_id: aId,
        user_b_id: bId,
        match_score: pair.score,
        match_reason: pair.reason,
        status: 'accepted',
      })

      if (!error) console.log(`🔗 Match created: ${demoUsers[pair.a].full_name} ↔ ${demoUsers[pair.b].full_name}`)
    }
  }

  console.log('\n✨ Seed completed!')
  console.log('\nDemo accounts:')
  demoUsers.forEach(u => console.log(`  ${u.email} / demo123456`))
}

seed().catch(console.error)
