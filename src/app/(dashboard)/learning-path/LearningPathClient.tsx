'use client'

import { useState } from 'react'
import { Loader2, RefreshCw, Target, BookOpen, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'
import { LearningPath, Skill, SkillLevel } from '@/lib/types'

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

const inputStyle = { background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text)' }

interface LearningPathClientProps {
  initialPaths: LearningPath[]
  skillsLearn: Skill[]
}

export default function LearningPathClient({ initialPaths, skillsLearn }: LearningPathClientProps) {
  const [paths, setPaths] = useState<LearningPath[]>(initialPaths)
  const [activePathId, setActivePathId] = useState(initialPaths[0]?.id ?? null)
  const [selectedSkill, setSelectedSkill] = useState(skillsLearn[0]?.name ?? '')
  const [targetLevel, setTargetLevel] = useState<SkillLevel>('advanced')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const activePath = paths.find(p => p.id === activePathId)
  const completedCount = activePath?.milestones.filter(m => m.completed).length ?? 0
  const totalCount = activePath?.milestones.length ?? 0
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const generatePath = async () => {
    if (!selectedSkill) return
    setGenerating(true)
    setError('')
    const skill = skillsLearn.find(s => s.name === selectedSkill)
    const currentLevel = skill?.level ?? 'beginner'
    try {
      const res = await fetch('/api/ai/learning-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillName: selectedSkill, currentLevel, targetLevel }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      if (data.path) {
        const exists = paths.find(p => p.skill_name === data.path.skill_name)
        if (exists) {
          setPaths(prev => prev.map(p => p.skill_name === data.path.skill_name ? data.path : p))
        } else {
          setPaths(prev => [data.path, ...prev])
        }
        setActivePathId(data.path.id)
      }
    } catch {
      setError('An error occurred while creating the learning path. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const toggleMilestone = async (pathId: string, index: number) => {
    const path = paths.find(p => p.id === pathId)
    if (!path) return
    const updatedMilestones = path.milestones.map((m, i) =>
      i === index ? { ...m, completed: !m.completed } : m
    )
    setPaths(prev => prev.map(p => p.id === pathId ? { ...p, milestones: updatedMilestones } : p))
    await fetch('/api/ai/learning-path', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pathId, milestones: updatedMilestones }),
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Learning Path</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>AI creates a personalized learning path based on your skills</p>
        </div>
      </div>

      {/* Empty state */}
      {paths.length === 0 && !generating && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Generate panel */}
          <div className="rounded-xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                <Sparkles size={14} className="text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Create your first learning path</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>AI will create a 4-week plan for you</p>
              </div>
            </div>
            <GenerateForm
              skillsLearn={skillsLearn}
              selectedSkill={selectedSkill}
              setSelectedSkill={setSelectedSkill}
              targetLevel={targetLevel}
              setTargetLevel={setTargetLevel}
              generating={generating}
              error={error}
              onGenerate={generatePath}
            />
          </div>

          {/* Illustration / tips */}
          <div className="rounded-xl border p-6 flex flex-col justify-center"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <BookOpen size={32} className="mb-4" style={{ color: 'var(--text-3)' }} />
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-2)' }}>Your learning path will include</p>
            <div className="space-y-2.5">
              {[
                'Specific goals for each week',
                '6–8 measurable milestones',
                'Progress tracking',
                'Regenerate anytime',
              ].map((tip, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-bold text-violet-600">{i + 1}</span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Has paths */}
      {(paths.length > 0 || generating) && (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">

          {/* Left: sidebar */}
          <div className="space-y-4">
            {/* Generate form */}
            <div className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-3)' }}>
                Generate new path
              </p>
              <GenerateForm
                skillsLearn={skillsLearn}
                selectedSkill={selectedSkill}
                setSelectedSkill={setSelectedSkill}
                targetLevel={targetLevel}
                setTargetLevel={setTargetLevel}
                generating={generating}
                error={error}
                onGenerate={generatePath}
              />
            </div>

            {/* Path list */}
            {paths.length > 0 && (
              <div className="rounded-xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-3)' }}>
                  Your paths
                </p>
                <div className="space-y-1.5">
                  {paths.map(path => {
                    const done = path.milestones.filter(m => m.completed).length
                    const total = path.milestones.length
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0
                    const active = path.id === activePathId
                    return (
                      <button key={path.id} onClick={() => setActivePathId(path.id)}
                        className="w-full text-left px-3 py-2.5 rounded-lg border transition-all"
                        style={{
                          background: active ? '#ede9fe' : 'var(--surface-2)',
                          borderColor: active ? '#7c3aed' : 'var(--border-2)',
                        }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs font-medium truncate" style={{ color: active ? '#5b21b6' : 'var(--text-2)' }}>
                            {path.skill_name}
                          </p>
                          <span className="text-[10px] flex-shrink-0 ml-2" style={{ color: active ? '#6d28d9' : 'var(--text-3)' }}>
                            {pct}%
                          </span>
                        </div>
                        <div className="w-full h-1 rounded-full" style={{ background: active ? '#7c3aed40' : 'var(--border-2)' }}>
                          <div className="h-1 rounded-full transition-all"
                            style={{ width: `${pct}%`, background: active ? '#7c3aed' : '#7c3aed' }} />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: active path detail */}
          <div>
            {generating && !activePath && (
              <div className="rounded-xl border p-16 text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <Loader2 size={24} className="animate-spin mx-auto mb-3 text-violet-600" />
                <p className="text-sm" style={{ color: 'var(--text-3)' }}>AI is generating your learning path...</p>
              </div>
            )}

            {activePath && (
              <div className="space-y-4">
                {/* Path header */}
                <div className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>
                        {activePath.skill_name}
                      </h2>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-1 rounded-lg border" style={{ borderColor: 'var(--border-2)', color: 'var(--text-3)' }}>
                          {LEVEL_LABELS[activePath.current_level]}
                        </span>
                        <ArrowRight size={11} style={{ color: 'var(--text-3)' }} />
                        <span className="px-2 py-1 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-600">
                          {LEVEL_LABELS[activePath.target_level]}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => { setSelectedSkill(activePath.skill_name); generatePath() }}
                      disabled={generating}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all hover:border-violet-500/30 disabled:opacity-40"
                      style={{ borderColor: 'var(--border-2)', color: 'var(--text-3)', background: 'var(--surface-2)' }}>
                      <RefreshCw size={11} className={generating ? 'animate-spin' : ''} /> Regenerate
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs" style={{ color: 'var(--text-3)' }}>Overall progress</span>
                      <span className="text-xs font-semibold" style={{ color: progress === 100 ? '#059669' : 'var(--accent-fg)' }}>
                        {completedCount}/{totalCount} milestone
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ background: 'var(--surface-2)' }}>
                      <div className="h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%`, background: progress === 100 ? '#10b981' : '#7c3aed' }} />
                    </div>
                  </div>
                </div>

                {/* Weekly goal */}
                <div className="rounded-xl p-4 border"
                  style={{ borderColor: '#7c3aed30', background: '#7c3aed08' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={13} className="text-violet-600" />
                    <p className="text-[10px] font-bold text-violet-600 uppercase tracking-widest">This week&apos;s goal</p>
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{activePath.weekly_goal}</p>
                </div>

                {/* Milestones */}
                <div className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Milestones</h3>
                    {progress === 100 && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                        <CheckCircle2 size={13} /> Completed!
                      </div>
                    )}
                  </div>

                  {activePath.milestones.length === 0 ? (
                    <p className="text-xs text-center py-6" style={{ color: 'var(--text-3)' }}>
                      No milestones yet — try regenerating the path
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activePath.milestones.map((milestone, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => toggleMilestone(activePath.id, i)}
                          className="flex items-start gap-3 p-3 rounded-lg border text-left transition-all hover:border-violet-500/20"
                          style={{
                            background: milestone.completed ? '#ecfdf5' : 'var(--surface-2)',
                            borderColor: milestone.completed ? '#16a34a30' : 'var(--border-2)',
                          }}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border flex-shrink-0 mt-0.5 transition-all ${milestone.completed ? 'bg-emerald-600 border-emerald-600' : ''}`}
                            style={!milestone.completed ? { borderColor: 'var(--border-2)' } : {}}>
                            {milestone.completed && (
                              <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <span className={`text-xs leading-relaxed transition-colors ${milestone.completed ? 'line-through' : ''}`}
                            style={{ color: milestone.completed ? '#16a34a' : 'var(--text-2)' }}>
                            {milestone.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Generate form extracted ── */
function GenerateForm({ skillsLearn, selectedSkill, setSelectedSkill, targetLevel, setTargetLevel, generating, error, onGenerate }: {
  skillsLearn: Skill[]
  selectedSkill: string
  setSelectedSkill: (v: string) => void
  targetLevel: SkillLevel
  setTargetLevel: (v: SkillLevel) => void
  generating: boolean
  error: string
  onGenerate: () => void
}) {
  return (
    <div className="space-y-2.5">
      <select value={selectedSkill} onChange={e => setSelectedSkill(e.target.value)}
        className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
        style={inputStyle}>
        <option value="">Select a skill to learn...</option>
        {skillsLearn.map((s, i) => <option key={i} value={s.name}>{s.name}</option>)}
      </select>
      <select value={targetLevel} onChange={e => setTargetLevel(e.target.value as SkillLevel)}
        className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
        style={inputStyle}>
        <option value="intermediate">Target: Intermediate</option>
        <option value="advanced">Target: Advanced</option>
      </select>
      <button onClick={onGenerate} disabled={generating || !selectedSkill}
        className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40">
        {generating
          ? <><Loader2 size={13} className="animate-spin" /> Generating...</>
          : <><Sparkles size={13} /> Generate path</>}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
