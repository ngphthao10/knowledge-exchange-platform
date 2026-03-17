'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Skill, SkillLevel } from '@/lib/types'
import { Plus, X, Check, GraduationCap, BookOpen, Clock, ArrowRight, Sparkles } from 'lucide-react'
import Image from 'next/image'

const AVAILABILITY_OPTIONS = [
  { value: 'weekday_morning',   label: 'Weekday Morning',   sub: '7:00 – 12:00' },
  { value: 'weekday_afternoon', label: 'Weekday Afternoon',  sub: '12:00 – 18:00' },
  { value: 'weekday_evening',   label: 'Weekday Evening',    sub: '18:00 – 22:00' },
  { value: 'weekend_morning',   label: 'Weekend Morning', sub: '7:00 – 12:00' },
  { value: 'weekend_afternoon', label: 'Weekend Afternoon', sub: '12:00 – 18:00' },
  { value: 'weekend_evening',   label: 'Weekend Evening', sub: '18:00 – 22:00' },
]

const inputCls = 'w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors'
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

  const add = () => {
    if (!name.trim() || skills.length >= 5) return
    onChange([...skills, { name: name.trim(), level }])
    setName('')
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
          style={inputStyle}
        />
        <select
          value={level}
          onChange={e => setLevel(e.target.value as SkillLevel)}
          className="rounded-xl px-3 py-2.5 text-xs focus:outline-none"
          style={inputStyle}
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <button
          type="button"
          onClick={add}
          disabled={!name.trim() || skills.length >= 5}
          className="w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center transition-all disabled:opacity-30 flex-shrink-0"
        >
          <Plus size={15} />
        </button>
      </div>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {skills.map((s, i) => (
            <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border-2)', color: 'var(--text-2)' }}>
              {s.name}
              <span style={{ color: 'var(--text-3)' }}>· {{
                beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced',
              }[s.level]}</span>
              <button onClick={() => onChange(skills.filter((_, j) => j !== i))}
                className="ml-0.5 hover:text-red-400 transition-colors" style={{ color: 'var(--text-3)' }}>
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

const STEPS = [
  { id: 'welcome',      title: 'Welcome',           icon: '👋' },
  { id: 'basic',        title: 'About you',         icon: '👤' },
  { id: 'teach',        title: 'What do you teach?', icon: '🎓' },
  { id: 'learn',        title: 'What do you want to learn?', icon: '📚' },
  { id: 'availability', title: 'Availability',      icon: '🗓️' },
  { id: 'done',         title: 'All done!',         icon: '🎉' },
]

export default function OnboardingClient({ userId }: { userId: string }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [animKey, setAnimKey] = useState(0)

  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [skillsTeach, setSkillsTeach] = useState<Skill[]>([])
  const [skillsLearn, setSkillsLearn] = useState<Skill[]>([])
  const [availability, setAvailability] = useState<string[]>([])

  const goNext = () => {
    setAnimKey(k => k + 1)
    setStep(s => s + 1)
  }
  const goBack = () => {
    setAnimKey(k => k + 1)
    setStep(s => s - 1)
  }

  const finish = async () => {
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({ full_name: fullName, bio, skills_teach: skillsTeach, skills_learn: skillsLearn, availability })
      .eq('user_id', userId)
    setSaving(false)
    goNext() // show done screen
  }

  const totalSteps = STEPS.length - 2 // exclude welcome and done from progress
  const progressStep = Math.max(0, Math.min(step - 1, totalSteps))

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: 'var(--bg)' }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10">
        <Image src="/skillswap-logo.svg" alt="SkillSwap" width={32} height={32} />
        <span className="font-bold text-base tracking-tight" style={{ color: 'var(--text)' }}>SkillSwap</span>
      </div>

      {/* Progress bar — only between welcome and done */}
      {step > 0 && step < STEPS.length - 1 && (
        <div className="w-full max-w-sm mb-8">
          <div className="flex justify-between text-[11px] mb-2" style={{ color: 'var(--text-3)' }}>
            <span>{STEPS[step].icon} {STEPS[step].title}</span>
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
      <div key={animKey} className="step-enter w-full max-w-sm">

        {/* ── Step 0: Welcome ── */}
        {step === 0 && (
          <div className="rounded-2xl border p-8 text-center space-y-5"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="w-16 h-16 rounded-2xl bg-violet-100 border border-violet-200 flex items-center justify-center mx-auto text-3xl">
              🚀
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>Welcome to SkillSwap!</h1>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-3)' }}>
                The platform connecting people who want to <span style={{ color: 'var(--accent-fg)' }}>teach</span> and
                {' '}<span style={{ color: 'var(--accent-fg)' }}>learn</span> skills from each other.
                Just 2 minutes to set up your profile.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 py-2">
              {[
                { icon: <GraduationCap size={16} />, label: 'Share skills', color: '#16a34a' },
                { icon: <BookOpen size={16} />, label: 'Learn something new', color: '#2563eb' },
                { icon: <Sparkles size={16} />, label: 'AI matching', color: '#7c3aed' },
              ].map((f, i) => (
                <div key={i} className="rounded-xl border p-3 text-center space-y-1.5"
                  style={{ background: 'var(--surface-2)', borderColor: 'var(--border-2)' }}>
                  <div style={{ color: f.color }} className="flex justify-center">{f.icon}</div>
                  <p className="text-[10px] font-medium" style={{ color: 'var(--text-3)' }}>{f.label}</p>
                </div>
              ))}
            </div>
            <button onClick={goNext}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2">
              Get started <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* ── Step 1: Basic info ── */}
        {step === 1 && (
          <div className="rounded-2xl border p-6 space-y-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div>
              <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>Who are you?</h2>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>This information is publicly visible on your profile</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>
                  Full name <span className="text-red-500">*</span>
                </label>
                <input value={fullName} onChange={e => setFullName(e.target.value)}
                  className={inputCls} style={inputStyle} placeholder="John Smith" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>
                  Short bio <span style={{ color: 'var(--text-3)' }}>({bio.length}/300)</span>
                </label>
                <textarea value={bio} onChange={e => setBio(e.target.value.slice(0, 300))}
                  rows={3} className={inputCls + ' resize-none'} style={inputStyle}
                  placeholder="What do you do? What are you passionate about?" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={goBack}
                className="px-4 py-2.5 rounded-xl border text-sm transition-all"
                style={{ borderColor: 'var(--border-2)', color: 'var(--text-3)' }}>
                Back
              </button>
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
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <GraduationCap size={14} className="text-emerald-600" />
                </div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>What can you teach?</h2>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                Add up to 5 skills you are confident sharing with others
              </p>
            </div>
            <SkillInput skills={skillsTeach} onChange={setSkillsTeach} placeholder="React, Piano, English..." />
            {skillsTeach.length === 0 && (
              <p className="text-xs text-center py-2" style={{ color: 'var(--text-3)' }}>
                💡 Every skill has value — cooking, coding, languages, music...
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={goBack}
                className="px-4 py-2.5 rounded-xl border text-sm transition-all"
                style={{ borderColor: 'var(--border-2)', color: 'var(--text-3)' }}>
                Back
              </button>
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
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                  <BookOpen size={14} className="text-blue-600" />
                </div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>What do you want to learn?</h2>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                AI will use this information to find the best matches for you
              </p>
            </div>
            <SkillInput skills={skillsLearn} onChange={setSkillsLearn} placeholder="Python, Guitar, Spanish..." />
            <div className="flex gap-2 pt-1">
              <button onClick={goBack}
                className="px-4 py-2.5 rounded-xl border text-sm transition-all"
                style={{ borderColor: 'var(--border-2)', color: 'var(--text-3)' }}>
                Back
              </button>
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
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <Clock size={14} className="text-orange-400" />
                </div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Your availability?</h2>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                Helps the system match you with people who have compatible schedules
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABILITY_OPTIONS.map(opt => {
                const active = availability.includes(opt.value)
                return (
                  <button key={opt.value} type="button"
                    onClick={() => setAvailability(prev =>
                      prev.includes(opt.value) ? prev.filter(v => v !== opt.value) : [...prev, opt.value]
                    )}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all"
                    style={{
                      background: active ? '#ede9fe' : 'var(--surface-2)',
                      borderColor: active ? '#7c3aed' : 'var(--border-2)',
                      color: active ? '#5b21b6' : 'var(--text-3)',
                    }}>
                    <div className={`w-4 h-4 rounded-md flex items-center justify-center border flex-shrink-0 transition-all ${active ? 'bg-violet-500 border-violet-500' : ''}`}
                      style={!active ? { borderColor: 'var(--border-2)' } : {}}>
                      {active && <Check size={9} className="text-white" />}
                    </div>
                    <div>
                      <p className="text-xs font-medium">{opt.label}</p>
                      <p className="text-[10px] opacity-70">{opt.sub}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={goBack}
                className="px-4 py-2.5 rounded-xl border text-sm transition-all"
                style={{ borderColor: 'var(--border-2)', color: 'var(--text-3)' }}>
                Back
              </button>
              <button onClick={finish} disabled={saving}
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                {saving ? 'Saving...' : <><Check size={14} /> Finish</>}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 5: Done ── */}
        {step === 5 && (
          <div className="rounded-2xl border p-8 text-center space-y-5"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto text-3xl">
              🎉
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                Your profile is ready!
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-3)' }}>
                Welcome <span style={{ color: 'var(--text)' }} className="font-semibold">{fullName}</span>!
                AI is ready to find the best matches for you.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-left">
              {[
                { icon: <GraduationCap size={13} className="text-emerald-600" />, label: 'Skills to Teach', value: `${skillsTeach.length} skill${skillsTeach.length !== 1 ? 's' : ''}` },
                { icon: <BookOpen size={13} className="text-blue-600" />, label: 'Skills to Learn', value: `${skillsLearn.length} skill${skillsLearn.length !== 1 ? 's' : ''}` },
              ].map((item, i) => (
                <div key={i} className="rounded-xl border p-3 space-y-1"
                  style={{ background: 'var(--surface-2)', borderColor: 'var(--border-2)' }}>
                  <div className="flex items-center gap-1.5">{item.icon}<span className="text-[10px]" style={{ color: 'var(--text-3)' }}>{item.label}</span></div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{item.value}</p>
                </div>
              ))}
            </div>
            <button onClick={() => router.push('/dashboard')}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2">
              Go to Dashboard <ArrowRight size={15} />
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
