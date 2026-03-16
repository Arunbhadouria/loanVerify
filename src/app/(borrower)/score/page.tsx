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

  async function fetchAIExplanation(
    score: number, breakdown: Record<string, number>,
    loanAmount: string, riskBand: string
  ) {
    setLoadingAI(true)
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'score_explanation',
          data: { score, breakdown, loanAmount: parseFloat(loanAmount), riskBand }
        })
      })
      const data = await res.json()
      setExplanation(data.message)
    } catch (e) {
      setExplanation('Unable to load AI explanation. Please check your connection.')
    }
    setLoadingAI(false)
  }

  async function submitToBank() {
    setSubmitting(true)
    const onboarding = JSON.parse(localStorage.getItem('onboarding_data') || '{}')
    const photos = JSON.parse(localStorage.getItem('inspection_photos') || '[]')
    const assetDetails = JSON.parse(localStorage.getItem('asset_details') || '{}')

    // Save to Supabase
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
  
        await supabase.from('ai_reports').insert({
          application_id: application.id,
          score_explanation: explanation,
        })
  
        if (photos && photos.length > 0) {
          const documentInserts = photos.map((p: any) => ({
            application_id: application.id,
            doc_type: p.stepId,
            file_url: p.dataUrl,
            gps_lat: p.gpsLat,
            gps_lng: p.gpsLng,
            captured_at: p.capturedAt,
            fraud_flag: p.fraudFlags?.join(', ') || null,
          }))
          await supabase.from('documents').insert(documentInserts)
        }
  
        localStorage.setItem('application_id', application.id)
      }

    setSubmitting(false)
    router.push('/status')
  }

  const radarData = [
    { subject: 'Payment History', value: breakdown.paymentHistory || 0 },
    { subject: 'Collateral', value: breakdown.collateral || 0 },
    { subject: 'Income', value: breakdown.incomeStability || 0 },
    { subject: 'Debt Ratio', value: breakdown.debtToIncome || 0 },
    { subject: 'Behavioral', value: breakdown.behavioral || 0 },
  ]

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-8">
      <div className="max-w-md mx-auto space-y-6">

        <h2 className="text-2xl font-bold text-center">Your Credit Score</h2>

        {score > 0 && <ScoreDial score={score} />}

        {/* Tabs */}
        <div className="flex bg-slate-900 rounded-xl p-1 gap-1">
          {(['score', 'ai', 'details'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition capitalize
                ${activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'}`}>
              {tab === 'ai' ? '🤖 AI Analysis' : tab === 'score' ? '📊 Breakdown' : '📋 Details'}
            </button>
          ))}
        </div>

        {/* Score breakdown */}
        {activeTab === 'score' && (
          <div className="space-y-3">
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Radar name="Score" dataKey="value" stroke="#3b82f6"
                  fill="#3b82f6" fillOpacity={0.3} />
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }} />
              </RadarChart>
            </ResponsiveContainer>

            {Object.entries({
              'Payment History': { value: breakdown.paymentHistory, weight: '35%' },
              'Collateral Strength': { value: breakdown.collateral, weight: '25%' },
              'Income Stability': { value: breakdown.incomeStability, weight: '20%' },
              'Debt-to-Income': { value: breakdown.debtToIncome, weight: '10%' },
              'Behavioral': { value: breakdown.behavioral, weight: '10%' },
            }).map(([label, { value, weight }]) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">{label}</span>
                  <span className="text-slate-500">{weight} • {Math.round(value || 0)}/100</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                    style={{ width: `${value || 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI Analysis */}
        {activeTab === 'ai' && (
          <div className="bg-slate-900 rounded-2xl p-5">
            {loadingAI ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-3/4" />
                <div className="h-4 bg-slate-700 rounded w-full" />
                <div className="h-4 bg-slate-700 rounded w-5/6" />
                <div className="h-4 bg-slate-700 rounded w-full" />
                <div className="h-4 bg-slate-700 rounded w-2/3" />
                <p className="text-slate-400 text-xs text-center pt-2">
                  🤖 AI is analyzing your profile...
                </p>
              </div>
            ) : (
              <div className="prose prose-invert prose-sm max-w-none">
                <p className="text-slate-300 leading-relaxed whitespace-pre-line text-sm">
                  {explanation}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Details */}
        {activeTab === 'details' && (() => {
          const onboarding = typeof window !== 'undefined'
            ? JSON.parse(localStorage.getItem('onboarding_data') || '{}')
            : {}
          const assetDetails = typeof window !== 'undefined'
            ? JSON.parse(localStorage.getItem('asset_details') || '{}')
            : {}
          return (
            <div className="space-y-3">
              {[
                { label: 'Loan Requested', value: `₹${parseFloat(onboarding.loan_amount || 0).toLocaleString('en-IN')}` },
                { label: 'Asset Type', value: onboarding.asset_type },
                { label: 'Asset Condition', value: assetDetails.condition },
                { label: 'Asset Value', value: `₹${parseFloat(assetDetails.estimated_value || 0).toLocaleString('en-IN')}` },
                { label: 'Monthly Income', value: `₹${parseFloat(onboarding.monthly_income || 0).toLocaleString('en-IN')}` },
                { label: 'Risk Band', value: band.toUpperCase() },
              ].map(item => (
                <div key={item.label}
                  className="flex justify-between items-center bg-slate-900 rounded-xl px-4 py-3">
                  <span className="text-slate-400 text-sm">{item.label}</span>
                  <span className="text-white font-medium text-sm capitalize">{item.value}</span>
                </div>
              ))}
            </div>
          )
        })()}

        {/* Submit */}
        <button onClick={submitToBank} disabled={submitting || score === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 
            py-4 rounded-xl font-semibold text-lg transition">
          {submitting ? 'Submitting...' : '🏦 Submit to Bank →'}
        </button>

        <p className="text-slate-500 text-xs text-center">
          By submitting, you consent to the bank reviewing your application and photos.
        </p>
      </div>
    </main>
  )
}