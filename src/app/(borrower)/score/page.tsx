'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ScoreDial from '@/components/borrower/ScoreDial'
import { calculateCreditScore } from '@/lib/scoring'
import { supabase } from '@/lib/supabase'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip
} from 'recharts'

export default function ScorePage() {
  const router = useRouter()
  const [score, setScore] = useState(0)
  const [band, setBand] = useState<'low' | 'medium' | 'high'>('medium')
  const [breakdown, setBreakdown] = useState<Record<string, number>>({})
  const [explanation, setExplanation] = useState('')
  const [loadingAI, setLoadingAI] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'score' | 'ai' | 'details'>('score')

  useEffect(() => {
    const onboarding = JSON.parse(localStorage.getItem('onboarding_data') || '{}')
    const assetDetails = JSON.parse(localStorage.getItem('asset_details') || '{}')

    const result = calculateCreditScore({
      paymentHistory: onboarding.existing_loans > 0 ? 65 : 80,
      collateralValue: parseFloat(assetDetails.estimated_value || '0'),
      loanAmount: parseFloat(onboarding.loan_amount || '1'),
      monthlyIncome: parseFloat(onboarding.monthly_income || '0'),
      existingEMI: parseFloat(onboarding.monthly_emi || '0'),
      avgBankBalance: parseFloat(onboarding.avg_bank_balance || '0'),
      behavioralScore: 70,
    })

    setScore(result.score)
    setBand(result.band)
    setBreakdown(result.breakdown)
    fetchAIExplanation(result.score, result.breakdown, onboarding.loan_amount, result.band)
  }, [])

  async function fetchAIExplanation(score: number, breakdown: Record<string, number>, loanAmount: string, riskBand: string) {
    setLoadingAI(true)
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'score_explanation', data: { score, breakdown, loanAmount: parseFloat(loanAmount), riskBand } })
      })
      const data = await res.json()
      setExplanation(data.message)
    } catch {
      setExplanation('Unable to load AI explanation. Please check your connection.')
    }
    setLoadingAI(false)
  }

  async function submitToBank() {
    setSubmitting(true)
    const onboarding = JSON.parse(localStorage.getItem('onboarding_data') || '{}')
    const photos = JSON.parse(localStorage.getItem('inspection_photos') || '[]')
    const assetDetails = JSON.parse(localStorage.getItem('asset_details') || '{}')

    const { data: user } = await supabase
      .from('users').insert({
        phone: localStorage.getItem('user_phone') || '9999999999',
        full_name: onboarding.full_name,
        aadhaar_last4: onboarding.aadhaar_last4,
        pan: onboarding.pan,
        occupation: onboarding.occupation,
        monthly_income: parseFloat(onboarding.monthly_income),
      }).select().single()

    const fraudFlags = photos.flatMap((p: any) => p.fraudFlags)
    const { data: application } = await supabase
      .from('applications').insert({
        user_id: user?.id,
        loan_amount: parseFloat(onboarding.loan_amount),
        loan_purpose: onboarding.loan_purpose,
        credit_score: score,
        risk_band: band,
        collateral_value: parseFloat(assetDetails.estimated_value || '0'),
        fraud_flags: fraudFlags,
        status: 'pending'
      }).select().single()

    if (application) {
      await supabase.from('assets').insert({
        application_id: application.id,
        asset_type: onboarding.asset_type,
        asset_description: assetDetails.description,
        estimated_value: parseFloat(assetDetails.estimated_value || '0'),
        condition: assetDetails.condition,
        location_lat: photos[0]?.gpsLat,
        location_lng: photos[0]?.gpsLng,
      })
      await supabase.from('ai_reports').insert({ application_id: application.id, score_explanation: explanation })
      if (photos?.length > 0) {
        await supabase.from('documents').insert(photos.map((p: any) => ({
          application_id: application.id,
          doc_type: p.stepId,
          file_url: p.dataUrl,
          gps_lat: p.gpsLat,
          gps_lng: p.gpsLng,
          captured_at: p.capturedAt,
          fraud_flag: p.fraudFlags?.join(', ') || null,
        })))
      }
      localStorage.setItem('application_id', application.id)
    }
    setSubmitting(false)
    router.push('/status')
  }

  const bandConfig = {
    low: { label: 'HIGH RISK', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
    medium: { label: 'MODERATE RISK', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
    high: { label: 'LOW RISK', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  }
  const bandStyle = bandConfig[band]

  const radarData = [
    { subject: 'Payment', value: breakdown.paymentHistory || 0 },
    { subject: 'Collateral', value: breakdown.collateral || 0 },
    { subject: 'Income', value: breakdown.incomeStability || 0 },
    { subject: 'Debt Ratio', value: breakdown.debtToIncome || 0 },
    { subject: 'Behavioral', value: breakdown.behavioral || 0 },
  ]

  const tabs = [
    { key: 'score', label: 'Score Breakdown' },
    { key: 'ai', label: 'AI Analysis' },
    { key: 'details', label: 'Loan Details' },
  ] as const

  return (
    <main className="min-h-screen bg-white">
      {/* Bank Header */}
      <div className="bg-green-700 px-6 py-4">
        <p className="text-white font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>CrediTrust Bank</p>
        <p className="text-green-200 text-xs">Credit Assessment</p>
      </div>

      <div className="max-w-md mx-auto px-6 py-6 space-y-5 pb-36">
        {/* Score + Band */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Your Credit Score</h1>
          {score > 0 && <ScoreDial score={score} />}
          <div className={`inline-flex items-center gap-2 px-4 py-2 border mt-3 ${bandStyle.bg}`} style={{ borderRadius: 4 }}>
            <span className={`text-xs font-bold tracking-wider ${bandStyle.color}`}>{bandStyle.label}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border border-gray-200 overflow-hidden" style={{ borderRadius: 4 }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors border-r last:border-r-0 border-gray-200
                ${activeTab === tab.key
                  ? 'bg-green-700 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Score breakdown */}
        {activeTab === 'score' && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#d1fae5" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Radar dataKey="value" stroke="#15803d" fill="#15803d" fillOpacity={0.25} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 4 }} />
              </RadarChart>
            </ResponsiveContainer>

            <div className="bg-white border border-gray-200 p-4 space-y-4" style={{ borderRadius: 6 }}>
              {Object.entries({
                'Payment History': { value: breakdown.paymentHistory, weight: '35%' },
                'Collateral Strength': { value: breakdown.collateral, weight: '25%' },
                'Income Stability': { value: breakdown.incomeStability, weight: '20%' },
                'Debt-to-Income': { value: breakdown.debtToIncome, weight: '10%' },
                'Behavioral': { value: breakdown.behavioral, weight: '10%' },
              }).map(([label, { value, weight }]) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-800">{label}</span>
                    <span className="text-gray-400 text-xs">{weight} • <strong className="text-gray-700">{Math.round(value || 0)}/100</strong></span>
                  </div>
                  <div className="h-2 bg-gray-100 overflow-hidden" style={{ borderRadius: 2 }}>
                    <div className="h-full bg-green-600 transition-all duration-1000" style={{ width: `${value || 0}%`, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Analysis */}
        {activeTab === 'ai' && (
          <div className="bg-white border border-gray-200 p-5" style={{ borderRadius: 6 }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-green-700 flex items-center justify-center text-white text-xs font-bold" style={{ borderRadius: 4 }}>AI</div>
              <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>AI Credit Analysis</h3>
            </div>
            {loadingAI ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`h-4 animate-pulse bg-gray-100 ${i % 3 === 0 ? 'w-3/4' : 'w-full'}`} style={{ borderRadius: 2 }} />
                ))}
                <p className="text-gray-400 text-xs text-center pt-1">Analyzing your profile...</p>
              </div>
            ) : (
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{explanation}</p>
            )}
          </div>
        )}

        {/* Details */}
        {activeTab === 'details' && (() => {
          const onboarding = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('onboarding_data') || '{}') : {}
          const assetDetails = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('asset_details') || '{}') : {}
          return (
            <div className="bg-white border border-gray-200 overflow-hidden" style={{ borderRadius: 6 }}>
              {[
                { label: 'Loan Requested', value: `₹${parseFloat(onboarding.loan_amount || 0).toLocaleString('en-IN')}` },
                { label: 'Collateral Type', value: onboarding.asset_type },
                { label: 'Asset Condition', value: assetDetails.condition },
                { label: 'Asset Value', value: `₹${parseFloat(assetDetails.estimated_value || 0).toLocaleString('en-IN')}` },
                { label: 'Monthly Income', value: `₹${parseFloat(onboarding.monthly_income || 0).toLocaleString('en-IN')}` },
                { label: 'Risk Classification', value: bandStyle.label },
              ].map((item, i) => (
                <div key={item.label} className={`flex justify-between items-center px-5 py-4 ${i !== 0 ? 'border-t border-gray-100' : ''}`}>
                  <span className="text-gray-500 text-sm">{item.label}</span>
                  <span className="text-gray-900 font-semibold text-sm capitalize">{item.value}</span>
                </div>
              ))}
            </div>
          )
        })()}

        {/* Submit */}
        <div className="space-y-3 pt-2">
          <button
            onClick={submitToBank}
            disabled={submitting || score === 0}
            className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-bold py-5 text-lg transition-colors"
            style={{ borderRadius: 4 }}>
            {submitting ? 'Submitting Application...' : '🏦 Submit to Bank →'}
          </button>
          <p className="text-gray-400 text-xs text-center">
            By submitting, you consent to the bank reviewing your application and uploaded photos.
          </p>
        </div>
      </div>
    </main>
  )
}