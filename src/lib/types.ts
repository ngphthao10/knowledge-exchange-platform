export type SkillLevel = 'beginner' | 'intermediate' | 'advanced'

export interface Skill {
  name: string
  level: SkillLevel
  verified?: boolean
  assessmentScore?: number
}

export interface Profile {
  id: string
  user_id: string
  full_name: string
  bio: string
  avatar_url: string | null
  skills_teach: Skill[]
  skills_learn: Skill[]
  availability: string[]         // e.g. ["weekday_evening", "weekend_morning"]
  timezone: string
  assessment_completed: boolean
  created_at: string
}

export interface Match {
  id: string
  user_a_id: string
  user_b_id: string
  match_score: number
  match_reason: string           // AI-generated explanation
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  profile_a?: Profile
  profile_b?: Profile
}

export interface Session {
  id: string
  match_id: string
  teacher_id: string
  learner_id: string
  skill_topic: string
  scheduled_at: string
  duration_minutes: number
  meet_link: string
  status: 'scheduled' | 'completed' | 'cancelled'
  notes: string | null
  rating: number | null
  created_at: string
}

export interface LearningPath {
  id: string
  user_id: string
  skill_name: string
  current_level: SkillLevel
  target_level: SkillLevel
  weekly_goal: string
  resources: { title: string; url: string; type: string }[]
  milestones: { title: string; completed: boolean }[]
  generated_at: string
}

export interface Message {
  id: string
  match_id: string
  sender_id: string
  content: string
  created_at: string
}

export interface AssessmentMessage {
  role: 'user' | 'model'
  content: string
}
