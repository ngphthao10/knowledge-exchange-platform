'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Skill, SkillLevel } from '@/lib/types'
import {
  Plus, X, Check, GraduationCap, BookOpen, Clock, ArrowRight,
  Sparkles, User, CheckCircle2, Code, Globe, Music, Briefcase, ChevronDown,
} from 'lucide-react'
import Image from 'next/image'

const SUGGESTIONS: { label: string; icon: React.ElementType; color: string; items: string[] }[] = [
  {
    label: 'Tech', icon: Code, color: '#2563eb',
    items: ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'TypeScript', 'Figma', 'Go', 'iOS/Swift'],
  },
  {
    label: 'Languages', icon: Globe, color: '#7c3aed',
    items: ['English', 'Spanish', 'French', 'Japanese', 'Chinese (Mandarin)', 'German', 'Korean'],
  },
  {
    label: 'Creative', icon: Music, color: '#db2777',
    items: ['Piano', 'Guitar', 'Drawing', 'Photography', 'Video Editing', 'Graphic Design'],
  },
  {
    label: 'Other', icon: Briefcase, color: '#d97706',
    items: ['Cooking', 'Yoga', 'Public Speaking', 'Excel', 'Marketing', 'Writing', 'Finance'],
  },
]

const AVAILABILITY_OPTIONS = [
  { value: 'weekday_morning',   label: 'Weekday Morning',   sub: '7:00 – 12:00' },
  { value: 'weekday_afternoon', label: 'Weekday Afternoon',  sub: '12:00 – 18:00' },
  { value: 'weekday_evening',   label: 'Weekday Evening',    sub: '18:00 – 22:00' },
  { value: 'weekend_morning',   label: 'Weekend Morning',    sub: '7:00 – 12:00' },
  { value: 'weekend_afternoon', label: 'Weekend Afternoon',  sub: '12:00 – 18:00' },
  { value: 'weekend_evening',   label: 'Weekend Evening',    sub: '18:00 – 22:00' },
]

const inputCls = 'w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors'
const inputStyle = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border-2)',
  color: 'var(--text)',
}

function SkillInput({ skills, onChange, placeholder }: {
  skills: Skill[]
  onChange: (s: Skill[]) => void
  placeholder: string
}) {
  const [name, setName] = useState('')
  const [level, setLevel] = useState<SkillLevel>('beginner')
  const [openCat, setOpenCat] = useState<string | null>(null)

  const add = (skillName: string = name) => {
    const trimmed = skillName.trim()
    if (!trimmed || skills.length >= 5) return
    if (skills.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) return
    onChange([...skills, { name: trimmed, level }])
    if (skillName === name) setName('')
  }

  const addSuggestion = (item: string) => {
    setName(item)
    setOpenCat(null)
  }

  return (
    <div className="space-y-3">
      {/* Manual input */}
      <div className="flex gap-2">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none min-w-0"
          style={inputStyle}
        />
        <select
          value={level}
          onChange={e => setLevel(e.target.value as SkillLevel)}
          className="rounded-xl px-2 py-2.5 text-xs focus:outline-none flex-shrink-0"
          style={{ ...inputStyle, width: 'auto' }}
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Inter.</option>
          <option value="advanced">Advanced</option>
        </select>
        <button
          type="button"
          onClick={() => add()}
          disabled={!name.trim() || skills.length >= 5}
          className="w-9 h-[42px] rounded-xl bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center transition-all disabled:opacity-30 flex-shrink-0"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Added skills */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((s, i) => (
            <span key={i} className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg text-xs border"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border-2)', color: 'var(--text-2)' }}>
              {s.name}
              <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                · {{ beginner: 'Beg', intermediate: 'Int', advanced: 'Adv' }[s.level]}
              </span>
              <button onClick={() => onChange(skills.filter((_, j) => j !== i))}
                className="ml-0.5 rounded p-0.5 hover:bg-red-50 hover:text-red-500 transition-colors"
                style={{ color: 'var(--text-3)' }}>
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {skills.length < 5 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium" style={{ color: 'var(--text-3)' }}>
            Quick pick:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map(cat => (
              <div key={cat.label} className="relative">
                <button
                  type="button"
                  onClick={() => setOpenCat(openCat === cat.label ? null : cat.label)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all"
                  style={{
                    background: openCat === cat.label ? 'var(--surface-2)' : 'transparent',
                    borderColor: 'var(--border-2)',
                    color: openCat === cat.label ? cat.color : 'var(--text-3)',
                  }}
                >
                  <cat.icon size={11} />
                  {cat.label}
                  <ChevronDown size={9} style={{ transform: openCat === cat.label ? 'rotate(180deg)' : '', transition: 'transform .15s' }} />
                </button>
                {openCat === cat.label && (
                  <div className="absolute top-full left-0 mt-1 z-10 rounded-xl border shadow-lg p-2 min-w-[160px]"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    <div className="flex flex-col gap-0.5">
                      {cat.items.map(item => {
                        const added = skills.some(s => s.name.toLowerCase() === item.toLowerCase())
                        return (
                          <button key={item} type="button"
                            disabled={added || skills.length >= 5}
                            onClick={() => addSuggestion(item)}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left transition-all disabled:opacity-40"
                            style={{ color: added ? 'var(--text-3)' : 'var(--text-2)' }}
                            onMouseEnter={e => { if (!added) (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                          >
                            {added
                              ? <Check size={11} style={{ color: '#16a34a' }} />
                              : <Plus size={11} style={{ color: cat.color }} />
                            }
                            {item}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const STEPS = [
  { id: 'welcome',      label: 'Welcome' },
  { id: 'basic',        label: 'About you' },
  { id: 'teach',        label: 'Teach' },
  { id: 'learn',        label: 'Learn' },
  { id: 'availability', label: 'Availability' },
  { id: 'done',         label: 'Done' },
]

export default function OnboardingClient({ userId, initialFullName }: { userId: string; initialFullName: string }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [animKey, setAnimKey] = useState(0)
  const [saveError, setSaveError] = useState('')

  const [fullName, setFullName] = useState(initialFullName)
  const [bio, setBio] = useState('')
  const [skillsTeach, setSkillsTeach] = useState<Skill[]>([])
  const [skillsLearn, setSkillsLearn] = useState<Skill[]>([])
  const [availability, setAvailability] = useState<string[]>([])

  const goNext = () => { setAnimKey(k => k + 1); setStep(s => s + 1) }
  const goBack = () => { setAnimKey(k => k + 1); setStep(s => s - 1) }

  const finish = async () => {
    setSaving(true)
    setSaveError('')
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .upsert(
        { user_id: userId, full_name: fullName, bio, skills_teach: skillsTeach, skills_learn: skillsLearn, availability },
        { onConflict: 'user_id' }
      )
    setSaving(false)
    if (error) {
      setSaveError('Could not save profile. Please try again.')
      return
    }
    goNext()
  }

  const totalSteps = STEPS.length - 2
  const progressStep = Math.max(0, Math.min(step - 1, totalSteps))

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: 'var(--bg)' }}>

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <Image src="/skillswap-logo.svg" alt="SkillSwap" width={30} height={30} />
        <span className="font-bold text-sm tracking-tight" style={{ color: 'var(--text)' }}>SkillSwap</span>
      </div>

      {/* Progress bar */}
      {step > 0 && step < STEPS.length - 1 && (
        <div className="w-full max-w-lg mb-6">
          <div className="flex justify-between text-[11px] mb-2" style={{ color: 'var(--text-3)' }}>
            <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{STEPS[step].label}</span>
            <span>{progressStep} / {totalSteps}</span>
          </div>
          <div className="h-1 rounded-full w-full" style={{ background: 'var(--border-2)' }}>
            <div
              className="h-1 rounded-full bg-violet-500 transition-all duration-500"
              style={{ width: `${(progressStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Card */}
      <div key={animKey} className="step-enter w-full max-w-lg">

        {/* ── Step 0: Welcome ── */}
        {step === 0 && (
          <div className="rounded-2xl border p-7 text-center space-y-5"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="w-14 h-14 rounded-2xl bg-violet-100 border border-violet-200 flex items-center justify-center mx-auto">
              <Sparkles size={24} className="text-violet-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold mb-1.5" style={{ color: 'var(--text)' }}>Welcome to SkillSwap!</h1>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-3)' }}>
                Connect with people to <span style={{ color: 'var(--accent)' }}>teach</span> what you know and{' '}
                <span style={{ color: 'var(--accent)' }}>learn</span> what you want.
                Takes about 2 minutes.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { icon: GraduationCap, label: 'Share skills', color: '#16a34a', bg: '#f0fdf4' },
                { icon: BookOpen,      label: 'Learn new things', color: '#2563eb', bg: '#eff6ff' },
                { icon: Sparkles,      label: 'AI matching', color: '#7c3aed', bg: '#f5f3ff' },
              ].map((f, i) => (
                <div key={i} className="rounded-xl border p-3 text-center space-y-2"
                  style={{ background: f.bg, borderColor: 'var(--border)' }}>
                  <div className="flex justify-center">
                    <f.icon size={16} style={{ color: f.color }} />
                  </div>
                  <p className="text-[10px] font-medium leading-tight" style={{ color: 'var(--text-3)' }}>{f.label}</p>
                </div>
              ))}
            </div>
            <button onClick={goNext}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2">
              Get started <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* ── Step 1: Basic info ── */}
        {step === 1 && (
          <div className="rounded-2xl border p-6 space-y-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                <User size={15} className="text-violet-600" />
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>Who are you?</h2>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>Visible on your public profile</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>
                  Full name <span className="text-red-500">*</span>
                </label>
                <input value={fullName} onChange={e => setFullName(e.target.value)}
                  className={inputCls} style={inputStyle} placeholder="Your name" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>
                  Short bio <span className="font-normal">({bio.length}/300)</span>
                </label>
                <textarea value={bio} onChange={e => setBio(e.target.value.slice(0, 300))}
                  rows={3} className={inputCls + ' resize-none'} style={inputStyle}
                  placeholder="What do you do? What are you passionate about?" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={goBack} className="px-4 py-2.5 rounded-xl border text-sm transition-all"
                style={{ borderColor: 'var(--border-2)', color: 'var(--text-3)' }}>Back</button>
              <button onClick={goNext} disabled={!fullName.trim()}
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                Next <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Teach ── */}
        {step === 2 && (
          <div className="rounded-2xl border p-6 space-y-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <GraduationCap size={15} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>What can you teach?</h2>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>Add up to 5 skills you can share</p>
              </div>
            </div>
            <SkillInput skills={skillsTeach} onChange={setSkillsTeach} placeholder="e.g. React, Piano, English..." />
            <div className="flex gap-2 pt-1">
              <button onClick={goBack} className="px-4 py-2.5 rounded-xl border text-sm transition-all"
                style={{ borderColor: 'var(--border-2)', color: 'var(--text-3)' }}>Back</button>
              <button onClick={goNext} disabled={skillsTeach.length === 0}
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                Next <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Learn ── */}
        {step === 3 && (
          <div className="rounded-2xl border p-6 space-y-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <BookOpen size={15} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>What do you want to learn?</h2>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>AI uses this to find the best matches for you</p>
              </div>
            </div>
            <SkillInput skills={skillsLearn} onChange={setSkillsLearn} placeholder="e.g. Python, Guitar, Spanish..." />
            <div className="flex gap-2 pt-1">
              <button onClick={goBack} className="px-4 py-2.5 rounded-xl border text-sm transition-all"
                style={{ borderColor: 'var(--border-2)', color: 'var(--text-3)' }}>Back</button>
              <button onClick={goNext} disabled={skillsLearn.length === 0}
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                Next <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Availability ── */}
        {step === 4 && (
          <div className="rounded-2xl border p-6 space-y-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Clock size={15} className="text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>Your availability?</h2>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>Helps match you with compatible schedules</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABILITY_OPTIONS.map(opt => {
                const active = availability.includes(opt.value)
                return (
                  <button key={opt.value} type="button"
                    onClick={() => setAvailability(prev =>
                      prev.includes(opt.value) ? prev.filter(v => v !== opt.value) : [...prev, opt.value]
                    )}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all"
                    style={{
                      background: active ? '#ede9fe' : 'var(--surface-2)',
                      borderColor: active ? '#7c3aed' : 'var(--border-2)',
                    }}>
                    <div className={`w-4 h-4 rounded-md flex items-center justify-center border flex-shrink-0 transition-all ${active ? 'bg-violet-500 border-violet-500' : ''}`}
                      style={!active ? { borderColor: 'var(--border-2)' } : {}}>
                      {active && <Check size={9} className="text-white" />}
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: active ? '#5b21b6' : 'var(--text-2)' }}>{opt.label}</p>
                      <p className="text-[10px]" style={{ color: active ? '#7c3aed' : 'var(--text-3)' }}>{opt.sub}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            {saveError && (
              <p className="text-xs text-red-500 text-center">{saveError}</p>
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={goBack} className="px-4 py-2.5 rounded-xl border text-sm transition-all"
                style={{ borderColor: 'var(--border-2)', color: 'var(--text-3)' }}>Back</button>
              <button onClick={finish} disabled={saving || availability.length === 0}
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                {saving ? 'Saving...' : <><Check size={14} /> Finish</>}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 5: Done ── */}
        {step === 5 && (
          <div className="rounded-2xl border p-7 text-center space-y-5"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 size={26} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1.5" style={{ color: 'var(--text)' }}>Profile ready!</h2>
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                Welcome, <span className="font-semibold" style={{ color: 'var(--text)' }}>{fullName}</span>.
                AI is finding your best matches.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { icon: GraduationCap, label: 'Teaching', value: `${skillsTeach.length} skill${skillsTeach.length !== 1 ? 's' : ''}`, color: '#16a34a', bg: '#f0fdf4' },
                { icon: BookOpen, label: 'Learning', value: `${skillsLearn.length} skill${skillsLearn.length !== 1 ? 's' : ''}`, color: '#2563eb', bg: '#eff6ff' },
              ].map((item, i) => (
                <div key={i} className="rounded-xl border p-3 text-left"
                  style={{ background: item.bg, borderColor: 'var(--border)' }}>
                  <item.icon size={14} style={{ color: item.color }} className="mb-1.5" />
                  <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>{item.label}</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{item.value}</p>
                </div>
              ))}
            </div>
            <button onClick={() => router.push('/dashboard')}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2">
              Go to Dashboard <ArrowRight size={14} />
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
