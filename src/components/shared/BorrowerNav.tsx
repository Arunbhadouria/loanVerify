'use client'
import { usePathname } from 'next/navigation'

const STEPS = [
  { href: '/login', icon: '🔐', label: 'Login' },
  { href: '/onboarding', icon: '📋', label: 'Profile' },
  { href: '/inspection', icon: '📸', label: 'Inspect' },
  { href: '/score', icon: '📊', label: 'Score' },
  { href: '/status', icon: '✅', label: 'Status' },
]

export default function BorrowerNav() {
  const pathname = usePathname()
  const currentIndex = STEPS.findIndex(s => pathname.includes(s.href))

  if (pathname === '/' || pathname === '/login') return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t 
      border-slate-800 px-4 py-3 z-40">
      <div className="flex justify-around max-w-md mx-auto">
        {STEPS.filter(s => s.href !== '/login').map((step, i) => {
          const realIndex = i + 1 // offset because we removed login
          const isDone = realIndex < currentIndex
          const isCurrent = realIndex === currentIndex
          return (
            <div key={step.href} className="flex flex-col items-center gap-1">
              <div className={`w-9 h-9 rounded-full flex items-center 
                justify-center text-sm transition
                ${isDone
                  ? 'bg-green-600 text-white'
                  : isCurrent
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-500'}`}>
                {isDone ? '✓' : step.icon}
              </div>
              <span className={`text-xs
                ${isCurrent
                  ? 'text-white font-medium'
                  : isDone
                  ? 'text-green-400'
                  : 'text-slate-500'}`}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}