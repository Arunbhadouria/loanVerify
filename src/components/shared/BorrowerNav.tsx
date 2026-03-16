'use client'
import { usePathname } from 'next/navigation'

const STEPS = [
  { href: '/onboarding', label: 'Profile', num: 1 },
  { href: '/inspection', label: 'Photos', num: 2 },
  { href: '/score', label: 'Score', num: 3 },
  { href: '/status', label: 'Status', num: 4 },
]

export default function BorrowerNav() {
  const pathname = usePathname()
  const currentIndex = STEPS.findIndex(s => pathname.includes(s.href))

  if (pathname === '/' || pathname === '/login') return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-green-600 px-4 py-3 z-40 shadow-lg">
      <div className="flex justify-around max-w-md mx-auto">
        {STEPS.map((step, i) => {
          const isDone = i < currentIndex
          const isCurrent = i === currentIndex
          return (
            <div key={step.href} className="flex flex-col items-center gap-1 min-w-0">
              <div className={`w-10 h-10 flex items-center justify-center text-sm font-bold transition-all
                ${isDone
                  ? 'bg-green-600 text-white'
                  : isCurrent
                  ? 'bg-green-700 text-white shadow-md shadow-green-200'
                  : 'bg-gray-100 text-gray-400 border border-gray-200'}`}
                style={{ borderRadius: 4 }}
              >
                {isDone ? '✓' : step.num}
              </div>
              <span className={`text-xs font-medium truncate
                ${isCurrent
                  ? 'text-green-700'
                  : isDone
                  ? 'text-green-500'
                  : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="max-w-md mx-auto mt-2 h-1 bg-gray-100 overflow-hidden" style={{ borderRadius: 2 }}>
        <div
          className="h-full bg-green-600 transition-all duration-500"
          style={{ width: `${currentIndex >= 0 ? ((currentIndex) / (STEPS.length - 1)) * 100 : 0}%` }}
        />
      </div>
    </div>
  )
}