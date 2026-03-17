'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const msg = error.message === 'Email not confirmed'
        ? 'Email not yet verified. Check your inbox and click the confirmation link.'
        : error.message === 'Invalid login credentials'
          ? 'Incorrect email or password.'
          : error.message
      setError(msg)
      setLoading(false)
    }
    else { router.push('/dashboard'); router.refresh() }
  }

  const handleGoogleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard` },
    })
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: "url('/skillswap-background.svg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <Image src="/skillswap-logo.svg" alt="SkillSwap" width={36} height={36} />
            <span className="text-xl font-bold text-[#2D1B69]">SkillSwap</span>
          </div>
          <p className="text-[#6b5b8f] text-sm">Welcome back!</p>
        </div>

        {/* Card */}
        <div className="bg-white/85 backdrop-blur border border-purple-100 rounded-3xl p-6 shadow-xl shadow-purple-200/40">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#4b3a7a] mb-1.5">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white border border-purple-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-[#1a1028] placeholder-purple-300 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-colors"
                  placeholder="you@example.com" required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4b3a7a] mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white border border-purple-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-[#1a1028] placeholder-purple-300 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-colors"
                  placeholder="••••••••" required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-3 py-2.5 text-xs">
                <AlertCircle size={13} />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-violet-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={15} className="animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-purple-100" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-[#9685b8]">or</span></div>
          </div>

          <button onClick={handleGoogleLogin}
            className="w-full border border-purple-200 hover:border-purple-300 text-[#4b3a7a] hover:bg-purple-50 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <p className="text-center text-xs text-[#9685b8] mt-5">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-violet-600 hover:text-violet-500 font-semibold transition-colors">Sign up now</Link>
        </p>
      </div>
    </div>
  )
}
