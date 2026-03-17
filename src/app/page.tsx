import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowLeftRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div
      className="min-h-screen text-[#1a1028]"
      style={{
        backgroundImage: "url('/skillswap-background.svg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <Image src="/skillswap-logo.svg" alt="SkillSwap" width={32} height={32} />
          <span className="font-bold tracking-tight text-[#2D1B69]">SkillSwap</span>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/login" className="text-sm text-[#6b5b8f] hover:text-[#2D1B69] transition-colors">
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-sm bg-violet-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-violet-500 transition-colors shadow-sm"
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-8 pt-16 pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[480px]">

          {/* Left: Headline */}
          <div>
            <p className="text-violet-600 text-xs font-bold tracking-widest uppercase mb-7">
              Peer-to-peer learning
            </p>
            <h1 className="text-[5rem] font-black leading-[0.92] tracking-tighter mb-8 text-[#1a1028]">
              Teach<br />
              what you<br />
              <em className="not-italic text-violet-600">know.</em>
            </h1>
            <p className="text-[#6b5b8f] text-lg leading-relaxed mb-10 max-w-xs">
              Trade skills directly with other learners. No money, no subscriptions — just genuine exchange.
            </p>
            <div className="flex items-center gap-5">
              <Link
                href="/register"
                className="flex items-center gap-2 bg-violet-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-violet-500 transition-colors shadow-md shadow-violet-500/20"
              >
                Start exchanging
                <ArrowRight size={15} />
              </Link>
              <Link href="/login" className="text-sm text-[#6b5b8f] hover:text-[#2D1B69] transition-colors">
                Have an account →
              </Link>
            </div>
          </div>

          {/* Right: Exchange card visual */}
          <div className="w-full max-w-sm mx-auto lg:mx-0 lg:ml-auto">
            {/* Card A */}
            <div className="bg-white/80 backdrop-blur border border-purple-100 rounded-2xl p-5 mb-2.5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-violet-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
                  M
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1a1028]">Minh</p>
                  <p className="text-xs text-[#9685b8]">Ho Chi Minh City</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">
                  Teaches Python
                </span>
                <span className="text-xs bg-purple-50 text-purple-500 border border-purple-200 px-3 py-1 rounded-full">
                  Wants English
                </span>
              </div>
            </div>

            {/* Match badge */}
            <div className="flex items-center justify-center my-3">
              <div className="flex items-center gap-1.5 bg-violet-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
                <ArrowLeftRight size={11} />
                AI matched
              </div>
            </div>

            {/* Card B */}
            <div className="bg-white/80 backdrop-blur border border-purple-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-rose-400 flex items-center justify-center text-sm font-bold text-white shrink-0">
                  S
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1a1028]">Sarah</p>
                  <p className="text-xs text-[#9685b8]">Toronto</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">
                  Teaches English
                </span>
                <span className="text-xs bg-purple-50 text-purple-500 border border-purple-200 px-3 py-1 rounded-full">
                  Wants Python
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* How it works */}
        <div className="mt-24 border-t border-purple-200/60 pt-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                step: '01',
                title: 'List your skills',
                desc: 'Tell us what you can teach and what you want to learn. AI assesses your real level.',
              },
              {
                step: '02',
                title: 'Get matched',
                desc: 'We find people whose skills perfectly complement yours — no scrolling required.',
              },
              {
                step: '03',
                title: 'Start swapping',
                desc: 'Schedule sessions, track progress, and grow together with your match.',
              },
            ].map((s) => (
              <div key={s.step}>
                <p className="text-violet-500 text-xs font-black tracking-widest mb-4">{s.step}</p>
                <h3 className="text-base font-bold mb-2 text-[#1a1028]">{s.title}</h3>
                <p className="text-sm text-[#6b5b8f] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
