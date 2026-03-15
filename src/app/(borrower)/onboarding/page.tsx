'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const STEPS = ['Personal', 'Financial', 'Loan']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    // Personal
    full_name: '',
    aadhaar_last4: '',
    pan: '',
    occupation: '',
    // Financial
    monthly_income: '',
    existing_loans: '',
    monthly_emi: '',
    avg_bank_balance: '',
    // Loan
    loan_amount: '',
    loan_purpose: '',
    asset_type: '',
  })

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function submit() {
    setLoading(true)
    // Save to localStorage for demo flow
    localStorage.setItem('onboarding_data', JSON.stringify(form))
    router.push('/inspection')
    setLoading(false)
  }

  const inputClass = `w-full bg-slate-800 border border-slate-700 rounded-xl 
    px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500`
  
  const labelClass = "text-slate-400 text-xs uppercase tracking-wide font-medium"

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-8">
      <div className="max-w-md mx-auto space-y-6">

        {/* Progress */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-lg">{STEPS[step]}</h2>
            <span className="text-slate-400 text-sm">{step + 1} / {STEPS.length}</span>
          </div>
          <div className="flex gap-2">
            {STEPS.map((_, i) => (
              <div key={i}
                className={`h-1 flex-1 rounded-full transition-colors
                  ${i <= step ? 'bg-blue-500' : 'bg-slate-700'}`}
              />
            ))}
          </div>
        </div>

        {/* Step 0 — Personal */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className={labelClass}>Full Name</label>
              <input className={inputClass} placeholder="As per Aadhaar"
                value={form.full_name} onChange={e => update('full_name', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Last 4 digits of Aadhaar</label>
              <input className={inputClass} placeholder="XXXX" maxLength={4}
                value={form.aadhaar_last4} onChange={e => update('aadhaar_last4', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>PAN Number</label>
              <input className={inputClass} placeholder="ABCDE1234F"
                value={form.pan} onChange={e => update('pan', e.target.value.toUpperCase())} />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Occupation</label>
              <select className={inputClass}
                value={form.occupation} onChange={e => update('occupation', e.target.value)}>
                <option value="">Select occupation</option>
                <option>Salaried Employee</option>
                <option>Self-Employed</option>
                <option>Business Owner</option>
                <option>Farmer</option>
                <option>Freelancer</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 1 — Financial */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-blue-950 border border-blue-800 rounded-xl p-4">
              <p className="text-blue-300 text-sm">
                💡 Your financial details help calculate your credit score accurately.
              </p>
            </div>
            {[
              { label: 'Monthly Income (₹)', field: 'monthly_income', placeholder: '25000' },
              { label: 'Existing Loans Outstanding (₹)', field: 'existing_loans', placeholder: '0' },
              { label: 'Current Monthly EMI (₹)', field: 'monthly_emi', placeholder: '0' },
              { label: 'Average Bank Balance (₹)', field: 'avg_bank_balance', placeholder: '10000' },
            ].map(item => (
              <div key={item.field} className="space-y-1">
                <label className={labelClass}>{item.label}</label>
                <input type="number" className={inputClass} placeholder={item.placeholder}
                  value={form[item.field as keyof typeof form]}
                  onChange={e => update(item.field, e.target.value)} />
              </div>
            ))}
          </div>
        )}

        {/* Step 2 — Loan */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className={labelClass}>Loan Amount Required (₹)</label>
              <input type="number" className={inputClass} placeholder="500000"
                value={form.loan_amount} onChange={e => update('loan_amount', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Loan Purpose</label>
              <select className={inputClass}
                value={form.loan_purpose} onChange={e => update('loan_purpose', e.target.value)}>
                <option value="">Select purpose</option>
                <option>Business Expansion</option>
                <option>Home Renovation</option>
                <option>Agriculture</option>
                <option>Education</option>
                <option>Medical Emergency</option>
                <option>Vehicle Purchase</option>
                <option>Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Collateral Asset Type</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'property', icon: '🏠', label: 'Property' },
                  { value: 'vehicle', icon: '🚗', label: 'Vehicle' },
                  { value: 'machinery', icon: '⚙️', label: 'Machinery' },
                  { value: 'land', icon: '🌾', label: 'Land' },
                ].map(asset => (
                  <button key={asset.value}
                    onClick={() => update('asset_type', asset.value)}
                    className={`p-4 rounded-xl border-2 text-center transition
                      ${form.asset_type === asset.value
                        ? 'border-blue-500 bg-blue-950'
                        : 'border-slate-700 bg-slate-800 hover:border-slate-500'
                      }`}>
                    <div className="text-2xl mb-1">{asset.icon}</div>
                    <div className="text-sm font-medium">{asset.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-4">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 py-4 rounded-xl font-medium transition">
              ← Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 py-4 rounded-xl font-semibold transition">
              Continue →
            </button>
          ) : (
            <button onClick={submit} disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 
                py-4 rounded-xl font-semibold transition">
              {loading ? 'Saving...' : 'Start Inspection →'}
            </button>
          )}
        </div>
      </div>
    </main>
  )
}