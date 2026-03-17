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
    score >= 700 ? '#15803d' :
    score >= 500 ? '#d97706' : '#dc2626'

  // SVG arc
  const radius = 80
  const cx = 100
  const cy = 105
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

  // Position the 300/900 labels at arc endpoints
  const startPt = polarToCartesian(startAngle)
  const endPt = polarToCartesian(endAngle)

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 170" className="w-64 h-52">
        {/* Background arc */}
        <path d={describeArc(startAngle, endAngle)}
          fill="none" stroke="#e5e7eb" strokeWidth="16" strokeLinecap="round" />
        {/* Score arc */}
        <path d={describeArc(startAngle, scoreAngle)}
          fill="none" stroke={color} strokeWidth="16" strokeLinecap="round"
          style={{ transition: 'all 0.05s linear' }} />

        {/* Score number */}
        <text x={cx} y={cy + 8} textAnchor="middle"
          fill="#111827" fontSize="36" fontWeight="bold" fontFamily="monospace">
          {displayed}
        </text>
        <text x={cx} y={cy + 26} textAnchor="middle"
          fill="#6b7280" fontSize="11">
          out of 900
        </text>

        {/* 300 label at arc start */}
        <text
          x={startPt.x + 2}
          y={startPt.y + 16}
          textAnchor="middle"
          fill="#374151"
          fontSize="13"
          fontWeight="600"
        >300</text>

        {/* 900 label at arc end */}
        <text
          x={endPt.x - 2}
          y={endPt.y + 16}
          textAnchor="middle"
          fill="#374151"
          fontSize="13"
          fontWeight="600"
        >900</text>
      </svg>
    </div>
  )
}