'use client'
import { useEffect, useState } from 'react'

interface Props {
  score: number
  animated?: boolean
}

export default function ScoreDial({ score, animated = true }: Props) {
  const [displayed, setDisplayed] = useState(animated ? 300 : score)

  useEffect(() => {
    if (!animated) return
    const duration = 1500
    const steps = 60
    const increment = (score - 300) / steps
    let current = 300
    const timer = setInterval(() => {
      current += increment
      if (current >= score) {
        setDisplayed(score)
        clearInterval(timer)
      } else {
        setDisplayed(Math.round(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [score, animated])

  const color =
    score >= 700 ? '#22c55e' :
    score >= 500 ? '#f59e0b' : '#ef4444'

  const band =
    score >= 700 ? 'Low Risk' :
    score >= 500 ? 'Medium Risk' : 'High Risk'

  // SVG arc
  const radius = 80
  const cx = 100
  const cy = 100
  const startAngle = -210
  const endAngle = 30
  const totalAngle = endAngle - startAngle
  const scoreAngle = startAngle + ((displayed - 300) / 600) * totalAngle

  function polarToCartesian(angle: number) {
    const rad = (angle * Math.PI) / 180
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad)
    }
  }

  function describeArc(start: number, end: number) {
    const s = polarToCartesian(start)
    const e = polarToCartesian(end)
    const largeArc = end - start > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`
  }

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 160" className="w-64 h-48">
        {/* Background arc */}
        <path d={describeArc(startAngle, endAngle)}
          fill="none" stroke="#1e293b" strokeWidth="16" strokeLinecap="round" />
        {/* Score arc */}
        <path d={describeArc(startAngle, scoreAngle)}
          fill="none" stroke={color} strokeWidth="16" strokeLinecap="round"
          style={{ transition: 'all 0.05s linear' }} />
        {/* Score text */}
        <text x={cx} y={cy + 10} textAnchor="middle"
          fill="white" fontSize="32" fontWeight="bold" fontFamily="monospace">
          {displayed}
        </text>
        <text x={cx} y={cy + 30} textAnchor="middle"
          fill="#94a3b8" fontSize="11">
          out of 900
        </text>
        {/* Labels */}
        <text x="25" y="140" fill="#94a3b8" fontSize="10">300</text>
        <text x="165" y="140" fill="#94a3b8" fontSize="10">900</text>
      </svg>

      <div className={`px-6 py-2 rounded-full text-sm font-bold
        ${score >= 700 ? 'bg-green-950 text-green-400' :
          score >= 500 ? 'bg-amber-950 text-amber-400' :
          'bg-red-950 text-red-400'}`}>
        {band}
      </div>
    </div>
  )
}