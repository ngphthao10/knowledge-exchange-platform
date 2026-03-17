'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Mail, Lock, User, Loader2, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const inputCls = "w-full bg-white border border-purple-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-[#1a1028] placeholder-purple-300 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-colors"

const bgStyle = {
  backgroundImage: "url('/skillswap-background.svg')",
  backgroundSize: 'cover' as const,
  backgroundPosition: 'center' as const,
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [done, setDone] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    })
    setLoading(false)
    if (error) {
      setError(error.message === 'User already registered'
        ? 'This email is already registered. Try signing in?'
        : error.message)
    } else {
      setDone(true)
    }
  }

  const resendEmail = async () => {
    setResending(true)
    const supabase = createClient()
    await supabase.auth.resend({ type: 'signup', email })
    setResending(false)
    setResent(true)
    setTimeout(() => setResent(false), 5000)
  }

  // ── Verify-email screen ──
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={bgStyle}>
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center gap-2.5 mb-8">
            <Image src="/skillswap-logo.svg" alt="SkillSwap" width={36} height={36} />
            <span className="text-xl font-bold text-[#2D1B69]">SkillSwap</span>
          </div>

          <div className="bg-white/85 backdrop-blur border border-purple-100 rounded-3xl p-8 shadow-xl shadow-purple-200/40 space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-violet-100 border border-violet-200 flex items-center justify-center mx-auto">
              <Mail size={28} className="text-violet-600" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#1a1028] mb-2">Check your email</h2>
              <p className="text-sm text-[#6b5b8f] leading-relaxed">
                We sent a verification link to
              </p>
              <p className="text-sm font-semibold text-violet-600 mt-1">{email}</p>
            </div>

            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-left space-y-2">
              {[
                'Open your email and click the verification link',
                'The link is valid for 24 hours',
                'After verifying, you will be directed to set up your profile',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-xs text-[#6b5b8f]">{step}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {resent ? (
                <div className="flex items-center justify-center gap-2 text-emerald-600 text-xs py-2">
                  <CheckCircle2 size={14} />
                  Email resent!
                </div>
              ) : (
                <button onClick={resendEmail} disabled={resending}
                  className="w-full border border-purple-200 hover:border-purple-300 text-[#4b3a7a] hover:bg-purple-50 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {resending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  Resend email
                </button>
              )}

              <Link href="/login"
                className="block w-full text-center text-xs text-[#9685b8] hover:text-[#6b5b8f] transition-colors py-1">
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Register form ──
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={bgStyle}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <Image src="/skillswap-logo.svg" alt="SkillSwap" width={36} height={36} />
            <span className="text-xl font-bold text-[#2D1B69]">SkillSwap</span>
          </div>
          <p className="text-[#6b5b8f] text-sm">Create a new account</p>
        </div>

        <div className="bg-white/85 backdrop-blur border border-purple-100 rounded-3xl p-6 shadow-xl shadow-purple-200/40">
          <form onSubmit={handleRegister} className="space-y-4">
            {[
              { label: 'Full name',        icon: User, value: fullName,        setter: setFullName,        type: 'text',     placeholder: 'John Smith' },
              { label: 'Email',            icon: Mail, value: email,           setter: setEmail,           type: 'email',    placeholder: 'you@example.com' },
              { label: 'Password',         icon: Lock, value: password,        setter: setPassword,        type: 'password', placeholder: 'Minimum 6 characters' },
              { label: 'Confirm password', icon: Lock, value: confirmPassword, setter: setConfirmPassword, type: 'password', placeholder: '••••••••' },
            ].map(field => (
              <div key={field.label}>
                <label className="block text-xs font-semibold text-[#4b3a7a] mb-1.5">{field.label}</label>
                <div className="relative">
                  <field.icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                  <input type={field.type} value={field.value}
                    onChange={e => field.setter(e.target.value)}
                    className={inputCls} placeholder={field.placeholder} required />
                </div>
              </div>
            ))}

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-3 py-2.5 text-xs">
                <AlertCircle size={13} />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-violet-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={15} className="animate-spin" /> Creating...</> : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#9685b8] mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-violet-600 hover:text-violet-500 font-semibold transition-colors">Sign In</Link>
        </p>
      </div>
    </div>
  )
}
