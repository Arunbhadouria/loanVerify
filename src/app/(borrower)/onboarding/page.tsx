'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STEPS = ['Personal Info', 'Financial Details', 'Loan Details']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    full_name: '',
    aadhaar_last4: '',
    pan: '',
    occupation: '',
    monthly_income: '',
    existing_loans: '',
    monthly_emi: '',
    avg_bank_balance: '',
    loan_amount: '',
    loan_purpose: '',
    asset_type: '',
  })

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function submit() {
    setLoading(true)
    localStorage.setItem('onboarding_data', JSON.stringify(form))
    router.push('/inspection')
    setLoading(false)
  }

  const inputClass = `w-full border border-gray-300 px-4 py-4 text-gray-900 text-base focus:outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100 transition-colors bg-white`
  const labelClass = "block text-sm font-semibold text-gray-700 mb-2"

  return (
    <main className="min-h-screen bg-white">
      {/* Bank Header */}
      <div className="bg-green-700 px-6 py-4">
        <p className="text-white font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>CrediTrust Bank</p>
        <p className="text-green-200 text-xs">Loan Application</p>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-gray-900 text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
              {STEPS[step]}
            </h2>
            <span className="text-sm text-gray-400 font-medium">Step {step + 1} of {STEPS.length}</span>
          </div>
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className="h-1.5 flex-1 transition-colors" style={{ borderRadius: 2, background: i <= step ? '#15803d' : '#e5e7eb' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-md mx-auto px-6 py-8 space-y-5 pb-32">

        {/* Step 0 — Personal */}
        {step === 0 && (
          <div className="space-y-5">
            <div className="bg-green-50 border border-green-200 px-4 py-3" style={{ borderRadius: 4 }}>
              <p className="text-green-800 text-sm font-medium">ℹ Please fill in your details exactly as on your Aadhaar card</p>
            </div>
            <div>
              <label className={labelClass}>Full Name</label>
              <input className={inputClass} style={{ borderRadius: 4 }} placeholder="As per Aadhaar"
                value={form.full_name} onChange={e => update('full_name', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Last 4 Digits of Aadhaar</label>
              <input className={inputClass} style={{ borderRadius: 4 }} placeholder="XXXX" maxLength={4}
                value={form.aadhaar_last4} onChange={e => update('aadhaar_last4', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>PAN Number</label>
              <input className={inputClass} style={{ borderRadius: 4, fontFamily: 'monospace', letterSpacing: '0.1em' }}
                placeholder="ABCDE1234F"
                value={form.pan} onChange={e => update('pan', e.target.value.toUpperCase())} />
            </div>
            <div>
              <label className={labelClass}>Occupation</label>
              <select className={inputClass} style={{ borderRadius: 4 }}
                value={form.occupation} onChange={e => update('occupation', e.target.value)}>
                <option value="">Select your occupation</option>
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
          <div className="space-y-5">
            <div className="bg-green-50 border border-green-200 px-4 py-3" style={{ borderRadius: 4 }}>
              <p className="text-green-800 text-sm font-medium">💡 Your income details help us calculate the best loan offer for you</p>
            </div>
            {[
              { label: 'Monthly Income (₹)', field: 'monthly_income', placeholder: '25,000' },
              { label: 'Existing Loan Balance (₹)', field: 'existing_loans', placeholder: '0' },
              { label: 'Current Monthly EMI (₹)', field: 'monthly_emi', placeholder: '0' },
              { label: 'Average Bank Balance (₹)', field: 'avg_bank_balance', placeholder: '10,000' },
            ].map(item => (
              <div key={item.field}>
                <label className={labelClass}>{item.label}</label>
                <div className="flex">
                  <span className="flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 text-gray-500 font-semibold text-sm" style={{ borderRadius: '4px 0 0 4px' }}>₹</span>
                  <input type="number" placeholder={item.placeholder}
                    className="flex-1 border border-gray-300 px-4 py-4 text-gray-900 focus:outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
                    style={{ borderRadius: '0 4px 4px 0' }}
                    value={form[item.field as keyof typeof form]}
                    onChange={e => update(item.field, e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 2 — Loan */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Loan Amount Required (₹)</label>
              <div className="flex">
                <span className="flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 text-gray-500 font-semibold text-sm" style={{ borderRadius: '4px 0 0 4px' }}>₹</span>
                <input type="number" placeholder="5,00,000"
                  className="flex-1 border border-gray-300 px-4 py-4 text-gray-900 text-lg font-semibold focus:outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
                  style={{ borderRadius: '0 4px 4px 0' }}
                  value={form.loan_amount} onChange={e => update('loan_amount', e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Purpose of Loan</label>
              <select className={inputClass} style={{ borderRadius: 4 }}
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
            <div>
              <label className={labelClass}>Collateral Asset Type</label>
              <p className="text-gray-500 text-sm mb-3">What will you offer as security for this loan?</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'property', icon: '🏠', label: 'Property', sub: 'House / Flat' },
                  { value: 'vehicle', icon: '🚗', label: 'Vehicle', sub: 'Car / Bike' },
                  { value: 'machinery', icon: '⚙️', label: 'Machinery', sub: 'Farm / Industrial' },
                  { value: 'land', icon: '🌾', label: 'Land', sub: 'Agricultural' },
                ].map(asset => (
                  <button key={asset.value}
                    onClick={() => update('asset_type', asset.value)}
                    className={`p-4 border-2 text-left transition-all ${form.asset_type === asset.value
                      ? 'border-green-700 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-green-300'}`}
                    style={{ borderRadius: 4 }}>
                    <div className="text-2xl mb-2">{asset.icon}</div>
                    <div className="text-sm font-bold text-gray-900">{asset.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{asset.sub}</div>
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
              className="flex-1 bg-white border-2 border-gray-300 hover:border-green-700 text-gray-700 py-4 font-semibold text-base transition-colors"
              style={{ borderRadius: 4 }}>
              ← Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)}
              className="flex-1 bg-green-700 hover:bg-green-800 text-white py-4 font-bold text-base transition-colors"
              style={{ borderRadius: 4 }}>
              Continue →
            </button>
          ) : (
            <button onClick={submit} disabled={loading}
              className="flex-1 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white py-4 font-bold text-base transition-colors"
              style={{ borderRadius: 4 }}>
              {loading ? 'Saving...' : 'Start Photo Inspection →'}
            </button>
          )}
        </div>
      </div>
    </main>
  )
}