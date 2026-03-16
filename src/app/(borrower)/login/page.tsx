'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function sendOTP() {
    setLoading(true)
    setError('')
    if (phone.length === 10) {
      setStep('otp')
    } else {
      setError('Please enter a valid 10-digit mobile number')
    }
    setLoading(false)
  }

  async function verifyOTP() {
    setLoading(true)
    if (otp === '123456' || otp.length === 6) {
      localStorage.setItem('user_phone', phone)
      router.push('/onboarding')
    } else {
      setError('Incorrect OTP. Please try again.')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Bank Header */}
      <div className="bg-green-700 px-6 py-5 flex items-center gap-3">
        <div className="w-10 h-10 bg-white flex items-center justify-center" style={{ borderRadius: 2 }}>
          <span className="text-green-700 text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>C</span>
        </div>
        <div>
          <p className="text-white font-bold text-lg leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>CrediTrust Bank</p>
          <p className="text-green-200 text-xs mt-0.5">Secure Loan Portal</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-10 max-w-md mx-auto w-full">

        {/* Icon + Title */}
        <div className="mb-8">
          <div className="w-16 h-16 bg-green-50 border-2 border-green-200 flex items-center justify-center mb-6" style={{ borderRadius: 4 }}>
            <span className="text-3xl">📱</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            {step === 'phone' ? 'Login to Apply' : 'Verify Your Number'}
          </h1>
          <p className="text-gray-500 text-base">
            {step === 'phone'
              ? 'Enter your mobile number to get started'
              : `OTP sent to +91 ${phone}`}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {step === 'phone' ? (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
              <div className="flex">
                <div className="flex items-center px-4 bg-gray-100 border border-r-0 border-gray-300 text-gray-600 font-medium text-sm" style={{ borderRadius: '4px 0 0 4px' }}>
                  +91
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="98765 43210"
                  className="flex-1 border border-gray-300 px-4 py-4 text-gray-900 text-xl tracking-widest focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  style={{ borderRadius: '0 4px 4px 0', fontFamily: 'monospace' }}
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">One-Time Password (OTP)</label>
              <input
                type="number"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="• • • • • •"
                className="w-full border border-gray-300 px-4 py-5 text-gray-900 text-2xl tracking-widest text-center focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                style={{ borderRadius: 4, fontFamily: 'monospace' }}
              />
              <p className="text-center text-sm text-gray-400 mt-2">
                Demo OTP: <span className="font-bold text-green-700">123456</span>
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 px-4 py-3" style={{ borderRadius: 4 }}>
              <p className="text-red-700 text-sm font-medium">⚠ {error}</p>
            </div>
          )}

          <button
            onClick={step === 'phone' ? sendOTP : verifyOTP}
            disabled={loading}
            className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-bold py-5 text-lg transition-colors"
            style={{ borderRadius: 4 }}
          >
            {loading ? 'Please wait...' : step === 'phone' ? 'Send OTP →' : 'Verify & Continue →'}
          </button>

          {step === 'otp' && (
            <button
              onClick={() => setStep('phone')}
              className="w-full text-green-700 hover:text-green-800 text-sm font-medium py-2 transition-colors"
            >
              ← Change number
            </button>
          )}
        </div>

        {/* Trust badges */}
        <div className="mt-10 pt-6 border-t border-gray-100 flex justify-center gap-6 text-center">
          {[
            { icon: '🔒', label: 'Bank-Grade Security' },
            { icon: '🇮🇳', label: 'RBI Compliant' },
            { icon: '⚡', label: 'Instant Decision' },
          ].map(b => (
            <div key={b.label}>
              <div className="text-2xl mb-1">{b.icon}</div>
              <p className="text-xs text-gray-400 font-medium">{b.label}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}