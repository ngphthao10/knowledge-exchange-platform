/**
 * Seed script — expanded demo data (20 users)
 * Run: npx tsx scripts/seed-demo.ts
 *
 * Prerequisites:
 * - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const demoUsers = [
  // ── Tech ──────────────────────────────────────────────────────────────────
  {
    email: 'minh.dev@demo.com',
    full_name: 'Nguyễn Minh',
    bio: 'Frontend developer 3 năm kinh nghiệm tại một startup SaaS. Đam mê React và thiết kế UI sạch.',
    skills_teach: [
      { name: 'React', level: 'advanced', verified: true, assessmentScore: 88 },
      { name: 'TypeScript', level: 'intermediate', verified: true, assessmentScore: 74 },
    ],
    skills_learn: [
      { name: 'Piano', level: 'beginner' },
      { name: 'English Speaking', level: 'beginner' },
    ],
    availability: ['weekday_evening', 'weekend_morning'],
    assessment_completed: true,
  },
  {
    email: 'an.backend@demo.com',
    full_name: 'Phạm Bảo An',
    bio: 'Backend engineer, thích Go và Postgres. Đang tìm hiểu về photography để chụp ảnh sản phẩm.',
    skills_teach: [
      { name: 'Go', level: 'advanced', verified: true, assessmentScore: 85 },
      { name: 'PostgreSQL', level: 'advanced', verified: true, assessmentScore: 82 },
      { name: 'Docker', level: 'intermediate', verified: false },
    ],
    skills_learn: [
      { name: 'Photography', level: 'beginner' },
      { name: 'English Speaking', level: 'intermediate' },
    ],
    availability: ['weekday_morning', 'weekday_evening'],
    assessment_completed: true,
  },
  {
    email: 'hoa.data@demo.com',
    full_name: 'Trần Minh Hoa',
    bio: 'Data scientist tại fintech, Python heavy user. Muốn học đàn guitar sau giờ làm để giải stress.',
    skills_teach: [
      { name: 'Python', level: 'advanced', verified: true, assessmentScore: 91 },
      { name: 'Data Analysis', level: 'advanced', verified: true, assessmentScore: 89 },
      { name: 'Machine Learning', level: 'intermediate', verified: false },
    ],
    skills_learn: [
      { name: 'Guitar', level: 'beginner' },
      { name: 'Japanese', level: 'beginner' },
    ],
    availability: ['weekday_evening', 'weekend_afternoon'],
    assessment_completed: true,
  },
  {
    email: 'kiet.mobile@demo.com',
    full_name: 'Lê Quốc Kiệt',
    bio: 'iOS developer, Swift enthusiast. Muốn chuyển sang full-stack nên đang học Node.js.',
    skills_teach: [
      { name: 'iOS/Swift', level: 'advanced', verified: true, assessmentScore: 86 },
      { name: 'Xcode', level: 'advanced', verified: false },
    ],
    skills_learn: [
      { name: 'Node.js', level: 'beginner' },
      { name: 'React', level: 'beginner' },
    ],
    availability: ['weekend_morning', 'weekend_evening'],
    assessment_completed: true,
  },
  {
    email: 'linh.devops@demo.com',
    full_name: 'Võ Thị Linh',
    bio: 'DevOps/SRE ở công ty product. Thích tự động hóa mọi thứ. Học yoga để cân bằng cuộc sống.',
    skills_teach: [
      { name: 'Docker', level: 'advanced', verified: true, assessmentScore: 90 },
      { name: 'Kubernetes', level: 'intermediate', verified: false },
      { name: 'CI/CD', level: 'advanced', verified: true, assessmentScore: 84 },
    ],
    skills_learn: [
      { name: 'Yoga', level: 'beginner' },
      { name: 'Photography', level: 'beginner' },
    ],
    availability: ['weekday_morning', 'weekend_morning'],
    assessment_completed: true,
  },
  {
    email: 'duc.security@demo.com',
    full_name: 'Nguyễn Tuấn Đức',
    bio: 'Cybersecurity analyst, CEH certified. Thích dạy người mới về an toàn thông tin. Học vẽ để thư giãn.',
    skills_teach: [
      { name: 'Cybersecurity', level: 'advanced', verified: true, assessmentScore: 87 },
      { name: 'Linux', level: 'advanced', verified: true, assessmentScore: 85 },
      { name: 'Python', level: 'intermediate', verified: false },
    ],
    skills_learn: [
      { name: 'Drawing', level: 'beginner' },
      { name: 'Korean', level: 'beginner' },
    ],
    availability: ['weekday_evening', 'weekend_afternoon'],
    assessment_completed: true,
  },

  // ── Design ────────────────────────────────────────────────────────────────
  {
    email: 'thu.design@demo.com',
    full_name: 'Nguyễn Thanh Thu',
    bio: 'UI/UX designer 4 năm, Figma power user. Muốn học code để handoff với dev dễ hơn.',
    skills_teach: [
      { name: 'Figma', level: 'advanced', verified: true, assessmentScore: 93 },
      { name: 'UI Design', level: 'advanced', verified: true, assessmentScore: 88 },
      { name: 'User Research', level: 'intermediate', verified: false },
    ],
    skills_learn: [
      { name: 'React', level: 'beginner' },
      { name: 'TypeScript', level: 'beginner' },
    ],
    availability: ['weekend_morning', 'weekend_afternoon'],
    assessment_completed: true,
  },
  {
    email: 'nam.photo@demo.com',
    full_name: 'Phạm Hoàng Nam',
    bio: 'Nhiếp ảnh gia tự do, chuyên portrait và landscape. Muốn xây website portfolio nên cần học web.',
    skills_teach: [
      { name: 'Photography', level: 'advanced', verified: true, assessmentScore: 94 },
      { name: 'Lightroom', level: 'advanced', verified: true, assessmentScore: 90 },
      { name: 'Video Editing', level: 'intermediate', verified: false },
    ],
    skills_learn: [
      { name: 'React', level: 'beginner' },
      { name: 'Node.js', level: 'beginner' },
    ],
    availability: ['weekday_morning', 'weekend_afternoon'],
    assessment_completed: true,
  },
  {
    email: 'mai.graphic@demo.com',
    full_name: 'Lê Thị Mai',
    bio: 'Graphic designer, illustrator. Vẽ tay và kỹ thuật số. Muốn học marketing để freelance hiệu quả hơn.',
    skills_teach: [
      { name: 'Drawing', level: 'advanced', verified: true, assessmentScore: 92 },
      { name: 'Illustrator', level: 'advanced', verified: true, assessmentScore: 89 },
      { name: 'Photoshop', level: 'intermediate', verified: false },
    ],
    skills_learn: [
      { name: 'Digital Marketing', level: 'beginner' },
      { name: 'English Speaking', level: 'intermediate' },
    ],
    availability: ['weekday_evening', 'weekend_morning'],
    assessment_completed: true,
  },

  // ── Ngôn ngữ ──────────────────────────────────────────────────────────────
  {
    email: 'hieu.english@demo.com',
    full_name: 'Lê Văn Hiếu',
    bio: 'IELTS 8.0, từng du học Canada 3 năm. Dạy tiếng Anh giao tiếp và học thuật. Muốn học data.',
    skills_teach: [
      { name: 'English Speaking', level: 'advanced', verified: true, assessmentScore: 95 },
      { name: 'IELTS Preparation', level: 'advanced', verified: true, assessmentScore: 92 },
    ],
    skills_learn: [
      { name: 'Python', level: 'beginner' },
      { name: 'Data Analysis', level: 'beginner' },
    ],
    availability: ['weekday_evening', 'weekend_morning', 'weekend_evening'],
    assessment_completed: true,
  },
  {
    email: 'yuki.japanese@demo.com',
    full_name: 'Sakura Yamamoto',
    bio: 'Người Nhật đang sống ở Hà Nội. Dạy tiếng Nhật và văn hóa Nhật. Muốn học tiếng Việt và nấu ăn Việt.',
    skills_teach: [
      { name: 'Japanese', level: 'advanced', verified: true, assessmentScore: 97 },
      { name: 'Japanese Culture', level: 'advanced', verified: false },
    ],
    skills_learn: [
      { name: 'Vietnamese', level: 'beginner' },
      { name: 'Cooking', level: 'beginner' },
    ],
    availability: ['weekday_morning', 'weekend_morning'],
    assessment_completed: true,
  },
  {
    email: 'sofia.spanish@demo.com',
    full_name: 'Sofia Reyes',
    bio: 'Native Spanish speaker from Mexico, living in HCMC. Teaching Spanish, learning Vietnamese and cooking.',
    skills_teach: [
      { name: 'Spanish', level: 'advanced', verified: true, assessmentScore: 98 },
      { name: 'English Speaking', level: 'advanced', verified: true, assessmentScore: 90 },
    ],
    skills_learn: [
      { name: 'Vietnamese', level: 'beginner' },
      { name: 'Cooking', level: 'intermediate' },
    ],
    availability: ['weekday_evening', 'weekend_afternoon'],
    assessment_completed: true,
  },
  {
    email: 'minji.korean@demo.com',
    full_name: 'Kim Minji',
    bio: 'Korean expat, K-pop dance instructor. Dạy tiếng Hàn và dance. Muốn học tiếng Anh tốt hơn.',
    skills_teach: [
      { name: 'Korean', level: 'advanced', verified: true, assessmentScore: 97 },
      { name: 'K-pop Dance', level: 'advanced', verified: false },
    ],
    skills_learn: [
      { name: 'English Speaking', level: 'intermediate' },
      { name: 'Cooking', level: 'beginner' },
    ],
    availability: ['weekday_morning', 'weekday_evening'],
    assessment_completed: true,
  },

  // ── Âm nhạc ───────────────────────────────────────────────────────────────
  {
    email: 'linh.piano@demo.com',
    full_name: 'Trần Thị Linh',
    bio: 'Giáo viên nhạc, chơi piano 10 năm, từng biểu diễn ở nhiều concert. Muốn học lập trình.',
    skills_teach: [
      { name: 'Piano', level: 'advanced', verified: true, assessmentScore: 96 },
      { name: 'Music Theory', level: 'advanced', verified: true, assessmentScore: 93 },
    ],
    skills_learn: [
      { name: 'Python', level: 'beginner' },
      { name: 'React', level: 'beginner' },
    ],
    availability: ['weekday_morning', 'weekend_afternoon'],
    assessment_completed: true,
  },
  {
    email: 'hung.guitar@demo.com',
    full_name: 'Đỗ Thanh Hùng',
    bio: 'Guitarist trong band nhạc indie, dạy guitar acoustic và điện. Muốn học tiếng Anh để hát tốt hơn.',
    skills_teach: [
      { name: 'Guitar', level: 'advanced', verified: true, assessmentScore: 91 },
      { name: 'Music Theory', level: 'intermediate', verified: false },
    ],
    skills_learn: [
      { name: 'English Speaking', level: 'intermediate' },
      { name: 'Video Editing', level: 'beginner' },
    ],
    availability: ['weekend_afternoon', 'weekend_evening'],
    assessment_completed: true,
  },

  // ── Life skills ───────────────────────────────────────────────────────────
  {
    email: 'lan.cooking@demo.com',
    full_name: 'Nguyễn Thị Lan',
    bio: 'Đầu bếp tại nhà hàng 5 sao, chuyên ẩm thực Việt và Âu. Muốn học digital marketing để mở quán riêng.',
    skills_teach: [
      { name: 'Cooking', level: 'advanced', verified: true, assessmentScore: 94 },
      { name: 'Baking', level: 'advanced', verified: true, assessmentScore: 91 },
      { name: 'Vietnamese Cuisine', level: 'advanced', verified: false },
    ],
    skills_learn: [
      { name: 'Digital Marketing', level: 'beginner' },
      { name: 'Excel', level: 'beginner' },
    ],
    availability: ['weekday_morning', 'weekend_morning'],
    assessment_completed: true,
  },
  {
    email: 'quynh.yoga@demo.com',
    full_name: 'Hoàng Minh Quỳnh',
    bio: 'Yoga instructor, certified RYT-200. Thiền và mindfulness. Muốn học piano để thư giãn.',
    skills_teach: [
      { name: 'Yoga', level: 'advanced', verified: true, assessmentScore: 93 },
      { name: 'Meditation', level: 'advanced', verified: false },
      { name: 'Pilates', level: 'intermediate', verified: false },
    ],
    skills_learn: [
      { name: 'Piano', level: 'beginner' },
      { name: 'Drawing', level: 'beginner' },
    ],
    availability: ['weekday_morning', 'weekend_morning'],
    assessment_completed: true,
  },
  {
    email: 'tuan.marketing@demo.com',
    full_name: 'Nguyễn Anh Tuấn',
    bio: 'Growth marketer tại agency, chuyên SEO và paid ads. Muốn học lập trình để tự làm tool automation.',
    skills_teach: [
      { name: 'Digital Marketing', level: 'advanced', verified: true, assessmentScore: 88 },
      { name: 'SEO', level: 'advanced', verified: true, assessmentScore: 85 },
      { name: 'Google Ads', level: 'intermediate', verified: false },
    ],
    skills_learn: [
      { name: 'Python', level: 'beginner' },
      { name: 'Go', level: 'beginner' },
    ],
    availability: ['weekday_evening', 'weekend_afternoon'],
    assessment_completed: true,
  },
  {
    email: 'ha.finance@demo.com',
    full_name: 'Bùi Thanh Hà',
    bio: 'Financial analyst, CFA level 2. Dạy về đầu tư cá nhân và Excel tài chính. Muốn học ngoại ngữ.',
    skills_teach: [
      { name: 'Personal Finance', level: 'advanced', verified: true, assessmentScore: 90 },
      { name: 'Excel', level: 'advanced', verified: true, assessmentScore: 92 },
      { name: 'Investment', level: 'intermediate', verified: false },
    ],
    skills_learn: [
      { name: 'Japanese', level: 'beginner' },
      { name: 'Spanish', level: 'beginner' },
    ],
    availability: ['weekday_evening', 'weekend_morning'],
    assessment_completed: true,
  },
  {
    email: 'long.speak@demo.com',
    full_name: 'Trần Quốc Long',
    bio: 'Diễn giả, MC sự kiện, dạy public speaking và kỹ năng trình bày. Học guitar để biểu diễn trong buổi nói chuyện.',
    skills_teach: [
      { name: 'Public Speaking', level: 'advanced', verified: true, assessmentScore: 95 },
      { name: 'Presentation Skills', level: 'advanced', verified: true, assessmentScore: 93 },
    ],
    skills_learn: [
      { name: 'Guitar', level: 'beginner' },
      { name: 'Piano', level: 'beginner' },
    ],
    availability: ['weekday_evening', 'weekend_afternoon', 'weekend_evening'],
    assessment_completed: true,
  },
]

// Match pairs [indexA, indexB, score, reason]
const matchPairs: [number, number, number, string, 'accepted' | 'pending'][] = [
  [0, 13, 0.91, 'Minh dạy React cho Linh, Linh dạy Piano cho Minh — cặp trao đổi cực kỳ phù hợp.', 'accepted'],
  [0, 7,  0.84, 'Minh học English Speaking từ Hiếu, Hiếu học React từ Minh.', 'accepted'],
  [0, 6,  0.88, 'Thu muốn học React, Minh có thể dạy — Thu dạy lại Figma và UI Design.', 'accepted'],
  [2, 14, 0.87, 'Hoa dạy Python cho Linh (piano), Linh dạy Guitar cho Hoa — đổi tech lấy nghệ thuật.', 'accepted'],
  [2, 8,  0.82, 'Hoa học Japanese từ Sakura, Sakura học Python từ Hoa.', 'accepted'],
  [1, 4,  0.86, 'An và Linh cùng trong thế giới backend/infra — An dạy PostgreSQL, Linh dạy Docker/K8s.', 'accepted'],
  [5, 8,  0.79, 'Đức học Drawing từ Mai, Mai học Cybersecurity basics từ Đức.', 'accepted'],
  [9, 10, 0.83, 'Hiếu dạy English cho Sakura, Sakura dạy Japanese cho Hiếu.', 'accepted'],
  [9, 11, 0.80, 'Hiếu dạy English cho Minji, Minji dạy Korean cho Hiếu.', 'accepted'],
  [15, 16, 0.89, 'Lan dạy Cooking cho Quỳnh, Quỳnh dạy Yoga cho Lan — lifestyle exchange hoàn hảo.', 'accepted'],
  [15, 17, 0.85, 'Lan muốn học Marketing để mở quán, Tuấn muốn học nấu ăn Việt.', 'accepted'],
  [19, 13, 0.78, 'Long học Piano từ Linh, Linh học Public Speaking từ Long — performer combo.', 'accepted'],
  [19, 14, 0.76, 'Long học Guitar từ Hùng, Hùng học Public Speaking để tự tin biểu diễn.', 'accepted'],
  [3,  0,  0.81, 'Kiệt học React từ Minh, Minh học iOS development từ Kiệt.', 'pending'],
  [7,  0,  0.77, 'Nam học React để làm portfolio, Minh học Photography từ Nam.', 'pending'],
  [17, 2,  0.80, 'Tuấn học Python để làm marketing automation, Hoa học Digital Marketing từ Tuấn.', 'pending'],
  [18, 10, 0.74, 'Hà học Japanese từ Sakura, Sakura học Personal Finance từ Hà.', 'pending'],
  [6,  8,  0.75, 'Thu học Digital Marketing từ Tuấn, Tuấn học UI Design từ Thu.', 'pending'],
  [11, 15, 0.72, 'Minji học Cooking từ Lan, Lan học Korean từ Minji.', 'pending'],
]

// Sessions for accepted matches (first 13 pairs)
const sessionTemplates = [
  { daysAgo: 14, skill: 'React', teacherIdx: 0, learnerIdx: 13, status: 'completed', rating: 5, notes: 'Học được cách dùng useEffect và custom hooks. Rất clear.' },
  { daysAgo: 7,  skill: 'Piano', teacherIdx: 13, learnerIdx: 0, status: 'completed', rating: 5, notes: 'Bắt đầu với các hợp âm cơ bản C, Am, F, G. Minh học nhanh!' },
  { daysAgo: 3,  skill: 'React', teacherIdx: 0, learnerIdx: 13, status: 'completed', rating: 4, notes: 'Đi sâu vào React Query và state management.' },
  { daysAgo: 10, skill: 'English Speaking', teacherIdx: 9, learnerIdx: 0, status: 'completed', rating: 5, notes: 'Luyện pronunciation và common phrases. Rất helpful.' },
  { daysAgo: 5,  skill: 'Python', teacherIdx: 2, learnerIdx: 14, status: 'completed', rating: 5, notes: 'Giới thiệu pandas và matplotlib. Linh học rất chăm.' },
  { daysAgo: 12, skill: 'Docker', teacherIdx: 4, learnerIdx: 1, status: 'completed', rating: 4, notes: 'Docker compose cho local dev. Practical và dễ hiểu.' },
  { daysAgo: 8,  skill: 'PostgreSQL', teacherIdx: 1, learnerIdx: 4, status: 'completed', rating: 5, notes: 'Indexing và query optimization. Giải thích rất chi tiết.' },
  { daysAgo: 6,  skill: 'Japanese', teacherIdx: 10, learnerIdx: 2, status: 'completed', rating: 5, notes: 'Học Hiragana xong buổi đầu. Sakura giải thích rất kiên nhẫn.' },
  { daysAgo: 4,  skill: 'Cooking', teacherIdx: 15, learnerIdx: 16, status: 'completed', rating: 5, notes: 'Làm phở bò từ đầu. Lan dạy rất tỉ mỉ và vui.' },
  { daysAgo: 2,  skill: 'Yoga', teacherIdx: 16, learnerIdx: 15, status: 'completed', rating: 5, notes: 'Bài tập buổi sáng 45 phút. Lan nói cảm thấy rất thư giãn.' },
  { daysAgo: 1,  skill: 'Digital Marketing', teacherIdx: 17, learnerIdx: 15, status: 'completed', rating: 4, notes: 'Cơ bản về Facebook Ads và targeting.' },
  { daysAgo: 9,  skill: 'English Speaking', teacherIdx: 9, learnerIdx: 10, status: 'completed', rating: 5, notes: 'Luyện conversational English. Sakura tiến bộ rất nhanh.' },
  { daysAgo: 3,  skill: 'Korean', teacherIdx: 11, learnerIdx: 9, status: 'completed', rating: 4, notes: 'Học Hangul cơ bản và cách chào hỏi.' },
  { daysFromNow: 2,  skill: 'Figma', teacherIdx: 6, learnerIdx: 0, status: 'scheduled' },
  { daysFromNow: 3,  skill: 'React', teacherIdx: 0, learnerIdx: 6, status: 'scheduled' },
  { daysFromNow: 5,  skill: 'Guitar', teacherIdx: 14, learnerIdx: 19, status: 'scheduled' },
  { daysFromNow: 1,  skill: 'Public Speaking', teacherIdx: 19, learnerIdx: 14, status: 'scheduled' },
  { daysFromNow: 4,  skill: 'Python', teacherIdx: 2, learnerIdx: 8, status: 'scheduled' },
]

function generateMeetLink() {
  const chars = 'abcdefghijklmnopqrstuvwxyz'
  const seg = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `https://meet.google.com/${seg(3)}-${seg(4)}-${seg(3)}`
}

async function seed() {
  console.log('🌱 Starting seed with', demoUsers.length, 'users...\n')

  const userIds: string[] = []

  // ── Create users ───────────────────────────────────────────────────────────
  for (const user of demoUsers) {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: 'demo123456',
      user_metadata: { full_name: user.full_name },
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
        console.log(`⚠️  ${user.full_name} already exists, fetching id...`)
        const { data: existing } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('full_name', user.full_name)
          .single()
        userIds.push(existing?.user_id ?? '')
        continue
      }
      console.error(`❌ Auth error for ${user.email}:`, authError.message)
      userIds.push('')
      continue
    }

    const userId = authData.user.id
    userIds.push(userId)
    console.log(`✅ ${user.full_name} (${user.email})`)

    await new Promise(r => setTimeout(r, 400)) // wait for trigger

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        full_name: user.full_name,
        bio: user.bio,
        skills_teach: user.skills_teach,
        skills_learn: user.skills_learn,
        availability: user.availability,
        assessment_completed: user.assessment_completed,
      }, { onConflict: 'user_id' })

    if (profileError) {
      console.error(`   ❌ Profile error:`, profileError.message)
    } else {
      console.log(`   📝 Profile ok — teaches: ${user.skills_teach.map(s => s.name).join(', ')}`)
    }
  }

  console.log('\n── Creating matches ──────────────────────────────────────────')

  const matchIds: Record<string, string> = {}

  for (const [aIdx, bIdx, score, reason, status] of matchPairs) {
    const aId = userIds[aIdx]
    const bId = userIds[bIdx]
    if (!aId || !bId) continue

    const { data: match, error } = await supabase
      .from('matches')
      .upsert(
        { user_a_id: aId, user_b_id: bId, match_score: score, match_reason: reason, status },
        { onConflict: 'user_a_id,user_b_id', ignoreDuplicates: false }
      )
      .select('id')
      .single()

    if (error) {
      console.error(`❌ Match error ${demoUsers[aIdx].full_name} ↔ ${demoUsers[bIdx].full_name}:`, error.message)
    } else {
      matchIds[`${aIdx}-${bIdx}`] = match.id
      console.log(`🔗 ${status === 'accepted' ? '✓' : '⏳'} ${demoUsers[aIdx].full_name} ↔ ${demoUsers[bIdx].full_name} (${Math.round(score * 100)}%)`)
    }
  }

  console.log('\n── Creating sessions ─────────────────────────────────────────')

  const matchIndexPairs = matchPairs.map(([a, b]) => `${a}-${b}`)

  for (const tpl of sessionTemplates) {
    const { teacherIdx, learnerIdx } = tpl

    // Find which match pair these users belong to
    const pairKey = matchIndexPairs.find(key => {
      const [a, b] = key.split('-').map(Number)
      return (a === teacherIdx && b === learnerIdx) || (a === learnerIdx && b === teacherIdx)
    })

    const matchId = pairKey ? matchIds[pairKey] : null
    if (!matchId) continue

    const teacherId = userIds[teacherIdx]
    const learnerId = userIds[learnerIdx]
    if (!teacherId || !learnerId) continue

    const scheduledAt = new Date()
    if ('daysAgo' in tpl && tpl.daysAgo !== undefined) scheduledAt.setDate(scheduledAt.getDate() - tpl.daysAgo)
    if ('daysFromNow' in tpl && tpl.daysFromNow !== undefined) scheduledAt.setDate(scheduledAt.getDate() + tpl.daysFromNow)
    scheduledAt.setHours(19, 0, 0, 0)

    const { error } = await supabase.from('sessions').insert({
      match_id: matchId,
      teacher_id: teacherId,
      learner_id: learnerId,
      skill_topic: tpl.skill,
      scheduled_at: scheduledAt.toISOString(),
      duration_minutes: 90,
      meet_link: generateMeetLink(),
      status: tpl.status,
      notes: 'notes' in tpl ? tpl.notes : null,
      rating: 'rating' in tpl ? tpl.rating : null,
    })

    if (error) {
      console.error(`❌ Session error [${tpl.skill}]:`, error.message)
    } else {
      const label = tpl.status === 'completed' ? `✓ completed` : `📅 scheduled`
      console.log(`${label} — ${tpl.skill}: ${demoUsers[teacherIdx].full_name} → ${demoUsers[learnerIdx].full_name}`)
    }
  }

  console.log('\n✨ Seed completed!')
  console.log(`\n📊 Summary:`)
  console.log(`   Users   : ${demoUsers.length}`)
  console.log(`   Matches : ${matchPairs.length} (${matchPairs.filter(m => m[4] === 'accepted').length} accepted, ${matchPairs.filter(m => m[4] === 'pending').length} pending)`)
  console.log(`   Sessions: ${sessionTemplates.length} (${sessionTemplates.filter(s => s.status === 'completed').length} completed, ${sessionTemplates.filter(s => s.status === 'scheduled').length} upcoming)`)
  console.log('\n🔑 All accounts use password: demo123456')
  console.log('\nSample logins:')
  console.log('  minh.dev@demo.com      — React / TypeScript developer')
  console.log('  linh.piano@demo.com    — Piano teacher')
  console.log('  hieu.english@demo.com  — English IELTS 8.0')
  console.log('  hoa.data@demo.com      — Data scientist')
  console.log('  thu.design@demo.com    — UI/UX Figma designer')
}

seed().catch(console.error)
