'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Skill, SkillLevel } from '@/lib/types'
import { Plus, X, ShieldCheck, Check, GraduationCap, BookOpen, ChevronDown, Upload, FileText, Trophy, Briefcase, ImageIcon, Trash2, ExternalLink, Loader2 } from 'lucide-react'

/* ─── Skill suggestions by category ─── */
const SKILL_SUGGESTIONS: { category: string; skills: string[] }[] = [
  { category: 'Programming', skills: ['JavaScript', 'TypeScript', 'Python', 'React', 'Next.js', 'Node.js', 'Go', 'Rust', 'Java', 'Swift', 'Kotlin', 'C++'] },
  { category: 'Design',      skills: ['UI/UX Design', 'Figma', 'Photoshop', 'Illustrator', 'Blender', 'After Effects', 'Motion Design'] },
  { category: 'Data',        skills: ['Data Analysis', 'Machine Learning', 'SQL', 'Tableau', 'Power BI', 'TensorFlow', 'PyTorch'] },
  { category: 'Language',    skills: ['English', 'Vietnamese', 'Japanese', 'Korean', 'Chinese', 'French', 'Spanish', 'German'] },
  { category: 'Music',       skills: ['Piano', 'Guitar', 'Violin', 'Drums', 'Singing', 'Music Production', 'DJ'] },
  { category: 'Business',    skills: ['Marketing', 'SEO', 'Content Writing', 'Project Management', 'Finance', 'Public Speaking'] },
  { category: 'Other',       skills: ['Photography', 'Video Editing', 'Drawing', 'Cooking', 'Yoga', 'Chess'] },
]

const AVAILABILITY_OPTIONS = [
  { value: 'weekday_morning',   label: 'Weekday Morning' },
  { value: 'weekday_afternoon', label: 'Weekday Afternoon' },
  { value: 'weekday_evening',   label: 'Weekday Evening' },
  { value: 'weekend_morning',   label: 'Weekend Morning' },
  { value: 'weekend_afternoon', label: 'Weekend Afternoon' },
  { value: 'weekend_evening',   label: 'Weekend Evening' },
]

const LEVEL_LABEL: Record<SkillLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

interface ProfileFormProps {
  profile: {
    full_name: string
    bio: string
    skills_teach: Skill[]
    skills_learn: Skill[]
    availability: string[]
  } | null
  isOnboarding: boolean
  userId: string
  initialCredentials?: Credential[]
}

const inputStyle = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border-2)',
  color: 'var(--text)',
}

/* ─── Skill section with inline verify + suggestions ─── */
function SkillSection({
  title, icon, skills, onChange, maxSkills = 5,
  showVerify, onVerify, saving,
}: {
  title: string
  icon: React.ReactNode
  skills: Skill[]
  onChange: (skills: Skill[]) => void
  maxSkills?: number
  showVerify?: boolean
  onVerify?: (name: string) => void
  saving?: boolean
}) {
  const [skillName, setSkillName] = useState('')
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('beginner')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const addSkill = (name: string, level: SkillLevel = skillLevel) => {
    const trimmed = name.trim()
    if (!trimmed || skills.length >= maxSkills) return
    if (skills.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) return
    onChange([...skills, { name: trimmed, level }])
    setSkillName('')
  }

  const removeSkill = (i: number) => onChange(skills.filter((_, j) => j !== i))

  const toggleCategory = (cat: string) =>
    setActiveCategory(prev => prev === cat ? null : cat)

  return (
    <div className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{title}</p>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full border"
          style={{ borderColor: 'var(--border-2)', color: 'var(--text-3)' }}>
          {skills.length}/{maxSkills}
        </span>
      </div>

      {/* Added skill pills */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {skills.map((skill, i) => (
            <span key={i}
              className="group flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-xs border transition-colors"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border-2)', color: 'var(--text-2)' }}>
              {skill.verified && <Check size={10} className="text-emerald-600 flex-shrink-0" />}
              <span className="font-medium">{skill.name}</span>
              <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>{LEVEL_LABEL[skill.level]}</span>
              {/* Inline verify button */}
              {showVerify && !skill.verified && onVerify && (
                <button onClick={() => onVerify(skill.name)} disabled={saving} title="Verify with AI"
                  className="ml-0.5 p-0.5 rounded-full hover:bg-violet-500/20 transition-colors flex-shrink-0 disabled:opacity-40"
                  style={{ color: '#7c3aed' }}>
                  <ShieldCheck size={11} />
                </button>
              )}
              <button onClick={() => removeSkill(i)}
                className="ml-0.5 p-0.5 rounded-full hover:bg-red-500/20 transition-colors flex-shrink-0"
                style={{ color: 'var(--text-3)' }}>
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {skills.length < maxSkills && (
        <>
          {/* Custom input */}
          <div className="flex gap-2 mb-4">
            <input type="text" value={skillName}
              onChange={e => setSkillName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill(skillName))}
              className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
              style={inputStyle} placeholder="Type a skill name..." />
            <select value={skillLevel} onChange={e => setSkillLevel(e.target.value as SkillLevel)}
              className="rounded-lg px-2 py-2 text-xs focus:outline-none flex-shrink-0"
              style={inputStyle}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <button type="button" onClick={() => addSkill(skillName)}
              disabled={!skillName.trim()}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-30 flex-shrink-0">
              <Plus size={13} />
            </button>
          </div>

          {/* Suggestions by category */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
              Quick add
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SKILL_SUGGESTIONS.map(({ category, skills: suggestions }) => {
                const isOpen = activeCategory === category
                const available = suggestions.filter(s =>
                  !skills.some(sk => sk.name.toLowerCase() === s.toLowerCase())
                )
                if (available.length === 0) return null
                return (
                  <div key={category} className="relative">
                    <button onClick={() => toggleCategory(category)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] border transition-all hover:border-violet-500/30"
                      style={{
                        background: isOpen ? '#7c3aed18' : 'var(--surface-2)',
                        borderColor: isOpen ? '#7c3aed50' : 'var(--border-2)',
                        color: isOpen ? '#6d28d9' : 'var(--text-3)',
                      }}>
                      {category}
                      <ChevronDown size={10} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isOpen && (
                      <div className="absolute top-full left-0 mt-1.5 z-20 rounded-xl border p-2 shadow-xl flex flex-wrap gap-1.5"
                        style={{ background: 'var(--surface)', borderColor: 'var(--border)', minWidth: 200, maxWidth: 280 }}>
                        {available.map(s => (
                          <button key={s} onClick={() => { addSkill(s); setActiveCategory(null) }}
                            className="px-2.5 py-1 rounded-full text-[11px] border transition-all hover:bg-violet-600/10 hover:border-violet-500/40 hover:text-violet-600"
                            style={{ background: 'var(--surface-2)', borderColor: 'var(--border-2)', color: 'var(--text-2)' }}>
                            + {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {skills.length >= maxSkills && (
        <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>Maximum {maxSkills} skills reached</p>
      )}
    </div>
  )
}

/* ─── Credential types ─── */
const CRED_TYPES = [
  { value: 'cv',          label: 'CV / Resume',   icon: FileText,  color: 'text-blue-600',   bg: 'bg-blue-500/10' },
  { value: 'certificate', label: 'Certificate',   icon: Check,     color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  { value: 'award',       label: 'Award',         icon: Trophy,    color: 'text-amber-600',   bg: 'bg-amber-500/10' },
  { value: 'portfolio',   label: 'Portfolio',     icon: Briefcase, color: 'text-violet-600',  bg: 'bg-violet-500/10' },
  { value: 'other',       label: 'Other',         icon: ImageIcon, color: 'text-zinc-600',    bg: 'bg-zinc-500/10' },
] as const

type CredType = (typeof CRED_TYPES)[number]['value']

interface Credential {
  id: string
  type: CredType
  title: string
  file_url: string
  file_name: string
  file_size?: number
  created_at: string
}

function CredentialsSection({ initialCredentials }: { initialCredentials: Credential[] }) {
  const [credentials, setCredentials] = useState<Credential[]>(initialCredentials)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<CredType>('certificate')
  const [error, setError] = useState('')

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !title.trim()) { setError('Please enter a title first'); return }
    setError('')
    setUploading(true)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', type)
    fd.append('title', title.trim())

    const res = await fetch('/api/credentials', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.credential) {
      setCredentials(prev => [data.credential, ...prev])
      setTitle('')
    } else {
      setError(data.error || 'Upload failed')
    }
    setUploading(false)
    e.target.value = ''
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    await fetch('/api/credentials', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setCredentials(prev => prev.filter(c => c.id !== id))
    setDeleting(null)
  }

  const isPdf = (url: string) => url.toLowerCase().includes('.pdf')

  return (
    <div className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Credentials & Portfolio</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Upload CV, certificates, awards or portfolio to build trust</p>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full border"
          style={{ borderColor: 'var(--border-2)', color: 'var(--text-3)' }}>
          {credentials.length} file{credentials.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Upload form */}
      <div className="flex gap-2 mb-4">
        <select value={type} onChange={e => setType(e.target.value as CredType)}
          className="rounded-lg px-2 py-2 text-xs focus:outline-none flex-shrink-0"
          style={inputStyle}>
          {CRED_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <input value={title} onChange={e => setTitle(e.target.value)}
          className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
          style={inputStyle} placeholder="Title (e.g. IELTS 8.0, React Certificate...)" />
        <label className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all flex-shrink-0 cursor-pointer ${uploading || !title.trim() ? 'opacity-40 cursor-not-allowed' : 'hover:border-violet-500/40 hover:text-violet-600'}`}
          style={{ borderColor: 'var(--border-2)', color: 'var(--text-2)', background: 'var(--surface-2)' }}>
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          {uploading ? 'Uploading...' : 'Upload'}
          <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp"
            disabled={uploading || !title.trim()} onChange={handleUpload} />
        </label>
      </div>

      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

      <p className="text-[10px] mb-3" style={{ color: 'var(--text-3)' }}>
        Accepted: PDF, JPG, PNG, WebP · Max 10MB
      </p>

      {/* Credential cards */}
      {credentials.length === 0 ? (
        <div className="rounded-lg border border-dashed py-8 text-center"
          style={{ borderColor: 'var(--border-2)' }}>
          <Upload size={20} className="mx-auto mb-2" style={{ color: 'var(--text-3)' }} />
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>No files uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {credentials.map(cred => {
            const credType = CRED_TYPES.find(t => t.value === cred.type) ?? CRED_TYPES[4]
            const Icon = credType.icon
            const isImg = !isPdf(cred.file_url)
            return (
              <div key={cred.id} className="rounded-xl border overflow-hidden group"
                style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                {/* Preview */}
                <div className="relative h-32 flex items-center justify-center"
                  style={{ background: 'var(--surface)' }}>
                  {isImg ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cred.file_url} alt={cred.title}
                      className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <FileText size={32} style={{ color: 'var(--text-3)' }} />
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-red-500/10 text-red-600">PDF</span>
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <a href={cred.file_url} target="_blank" rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                      <ExternalLink size={13} className="text-white" />
                    </a>
                    <button onClick={() => handleDelete(cred.id)} disabled={deleting === cred.id}
                      className="w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center transition-colors">
                      {deleting === cred.id
                        ? <Loader2 size={13} className="text-red-600 animate-spin" />
                        : <Trash2 size={13} className="text-red-600" />}
                    </button>
                  </div>
                </div>
                {/* Footer */}
                <div className="px-3 py-2.5 flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${credType.bg}`}>
                    <Icon size={11} className={credType.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>{cred.title}</p>
                    <p className="text-[10px] truncate" style={{ color: 'var(--text-3)' }}>{credType.label}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function ProfileForm({ profile, isOnboarding, userId, initialCredentials = [] }: ProfileFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(isOnboarding ? 1 : 0)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [skillsTeach, setSkillsTeach] = useState<Skill[]>(profile?.skills_teach ?? [])
  const [skillsLearn, setSkillsLearn] = useState<Skill[]>(profile?.skills_learn ?? [])
  const [availability, setAvailability] = useState<string[]>(profile?.availability ?? [])

  const toggleAvailability = (value: string) =>
    setAvailability(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const saveProfile = async (): Promise<boolean> => {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, bio, skills_teach: skillsTeach, skills_learn: skillsLearn, availability })
      .eq('user_id', userId)
    setSaving(false)
    if (error) { showToast('Save failed. Please try again.', 'error'); return false }
    showToast('Profile saved!')
    return true
  }

  const verifySkill = async (skillName: string) => {
    const ok = await saveProfile()
    if (ok) router.push(`/profile/assessment/${encodeURIComponent(skillName)}`)
  }

  const handleFinish = async () => { await saveProfile(); router.push('/dashboard') }

  /* ── Onboarding wizard ── */
  if (step !== 0) {
    const sectionStyle = { background: 'var(--surface)', borderColor: 'var(--border)' }
    return (
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--text)' }}>Set up your profile</h1>
          <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>Step {step} / 3</p>
          <div className="flex gap-1.5">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex-1 h-0.5 rounded-full transition-all"
                style={{ background: s <= step ? '#7c3aed' : 'var(--border-2)' }} />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="rounded-xl border p-5 space-y-4" style={sectionStyle}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Basic information</p>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>Full name</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={inputStyle} placeholder="John Smith" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>Bio ({bio.length}/300)</label>
              <textarea value={bio} onChange={e => setBio(e.target.value.slice(0, 300))}
                rows={3} className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none resize-none" style={inputStyle}
                placeholder="Who are you? What are you working on?" />
            </div>
            <button onClick={() => setStep(2)} disabled={!fullName.trim()}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40">
              Next
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <SkillSection title="Skills I can teach" icon={<GraduationCap size={14} className="text-emerald-600" />}
              skills={skillsTeach} onChange={setSkillsTeach} />
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="px-4 py-2.5 border rounded-xl text-sm transition-colors"
                style={{ borderColor: 'var(--border-2)', color: 'var(--text-3)' }}>Back</button>
              <button onClick={() => setStep(3)} disabled={skillsTeach.length === 0}
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40">
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <SkillSection title="Skills I want to learn" icon={<BookOpen size={14} className="text-blue-600" />}
              skills={skillsLearn} onChange={setSkillsLearn} />
            <div>
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>Availability</p>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABILITY_OPTIONS.map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer" onClick={() => toggleAvailability(opt.value)}>
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all flex-shrink-0 ${availability.includes(opt.value) ? 'bg-violet-600 border-violet-600' : ''}`}
                      style={!availability.includes(opt.value) ? { borderColor: 'var(--border-2)' } : {}}>
                      {availability.includes(opt.value) && <Check size={10} className="text-white" />}
                    </div>
                    <span className="text-xs" style={{ color: availability.includes(opt.value) ? 'var(--text)' : 'var(--text-3)' }}>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setStep(2)} className="px-4 py-2.5 border rounded-xl text-sm transition-colors"
                style={{ borderColor: 'var(--border-2)', color: 'var(--text-3)' }}>Back</button>
              <button onClick={handleFinish} disabled={saving || skillsLearn.length === 0}
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40">
                {saving ? 'Saving...' : 'Complete'}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ── Normal edit mode ── */
  return (
    <div>
      {toast && (
        <div className="toast-enter fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium shadow-xl"
          style={{
            background: toast.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${toast.type === 'success' ? '#16a34a40' : '#dc262640'}`,
            color: toast.type === 'success' ? '#16a34a' : '#dc2626',
          }}>
          <Check size={14} /> {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Profile</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>Manage your information and skills</p>
        </div>
        <button onClick={saveProfile} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all disabled:opacity-40 hover:border-violet-500/40 hover:text-violet-600"
          style={{ borderColor: 'var(--border-2)', color: 'var(--text-2)', background: 'var(--surface)' }}>
          {saving ? <><span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" /> Saving...</> : <><Check size={13} /> Save changes</>}
        </button>
      </div>

      <div className="space-y-4">
        {/* Basic info */}
        <div className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex gap-4">
            <div style={{ flex: '0 0 28%' }}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>Full name</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none transition-colors"
                style={inputStyle} placeholder="John Smith" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>Bio ({bio.length}/300)</label>
              <textarea value={bio} onChange={e => setBio(e.target.value.slice(0, 300))}
                rows={4} className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none resize-none transition-colors"
                style={inputStyle} placeholder="Who are you? What do you do?" />
            </div>
          </div>
        </div>

        {/* Skills side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SkillSection
            title="I can teach"
            icon={<GraduationCap size={14} className="text-emerald-600" />}
            skills={skillsTeach}
            onChange={setSkillsTeach}
            showVerify
            onVerify={verifySkill}
            saving={saving}
          />
          <SkillSection
            title="I want to learn"
            icon={<BookOpen size={14} className="text-blue-600" />}
            skills={skillsLearn}
            onChange={setSkillsLearn}
          />
        </div>

        {/* Availability */}
        <div className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>Availability</p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>When are you free for skill-swap sessions?</p>
          <div className="grid grid-cols-3 gap-2">
            {AVAILABILITY_OPTIONS.map(opt => {
              const active = availability.includes(opt.value)
              return (
                <button key={opt.value} type="button" onClick={() => toggleAvailability(opt.value)}
                  className="py-2 px-3 rounded-lg border text-xs font-medium transition-all text-center"
                  style={{
                    background: active ? '#7c3aed18' : 'var(--surface-2)',
                    borderColor: active ? '#7c3aed80' : 'var(--border-2)',
                    color: active ? '#6d28d9' : 'var(--text-3)',
                  }}>
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Credentials */}
        <CredentialsSection initialCredentials={initialCredentials} />
      </div>
    </div>
  )
}
