'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Method = 'phone' | 'email'
type Step = 'method' | 'input' | 'otp'

export default function LoginPage() {
  const router = useRouter()
  const [method, setMethod] = useState<Method>('phone')
  const [step, setStep] = useState<Step>('method')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setInterval(() => setResendCooldown(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [resendCooldown])

  const identifier = method === 'phone' ? phone : email
  const maskedIdentifier = method === 'phone' ? `+91 ${phone}` : email

  /* ── Send OTP ──────────────────────────────────────────── */
  async function sendOTP() {
    setLoading(true)
    setError('')
    try {
      const body = method === 'phone'
        ? { method: 'phone', phone }
        : { method: 'email', email }

      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to send OTP.'); return }
      setStep('otp')
      setResendCooldown(30)
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  /* ── Verify OTP ────────────────────────────────────────── */
  async function handleVerify() {
    setLoading(true)
    setError('')
    try {
      const body = method === 'phone'
        ? { method: 'phone', phone, code: otp }
        : { method: 'email', email, code: otp }

      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok || !data.success) { setError(data.error || 'Verification failed.'); return }

      if (method === 'phone') localStorage.setItem('user_phone', phone)
      else localStorage.setItem('user_email', email)

      router.push('/onboarding')
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  /* ── Helpers ───────────────────────────────────────────── */
  function goBack() {
    setOtp('')
    setError('')
    if (step === 'otp') setStep('input')
    else if (step === 'input') setStep('method')
  }

  const inputValid = method === 'phone' ? phone.length === 10 : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const otpValid = otp.length === 6

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

      <div className="flex-1 flex flex-col justify-center px-6 py-10 max-w-md mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="w-16 h-16 bg-green-50 border-2 border-green-200 flex items-center justify-center mb-6" style={{ borderRadius: 4 }}>
            <span className="text-3xl">{step === 'method' ? '🔐' : method === 'phone' ? '📱' : '📧'}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            {step === 'method' && 'Login to Apply'}
            {step === 'input' && (method === 'phone' ? 'Enter Mobile Number' : 'Enter Email Address')}
            {step === 'otp' && 'Verify Your Identity'}
          </h1>
          <p className="text-gray-500 text-base">
            {step === 'method' && 'Choose your preferred verification method'}
            {step === 'input' && (method === 'phone' ? 'Enter your 10-digit mobile number' : 'We\'ll send a verification code to your email')}
            {step === 'otp' && `OTP sent to ${maskedIdentifier}`}
          </p>
        </div>

        <div className="space-y-4">
          {/* ── Step 1: Method Selection ──────────────────────── */}
          {step === 'method' && (
            <div className="space-y-3">
              {/* Phone card */}
              <button
                onClick={() => { setMethod('phone'); setStep('input'); setError('') }}
                className="w-full text-left border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 px-5 py-5 transition-all group"
                style={{ borderRadius: 6 }}
                id="method-phone"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 flex items-center justify-center shrink-0" style={{ borderRadius: 4 }}>
                    <span className="text-2xl">📱</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-lg group-hover:text-green-700 transition-colors">Phone Number</p>
                    <p className="text-gray-500 text-sm mt-0.5">Demo mode — use OTP <span className="font-mono font-bold text-green-700">123456</span></p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </button>

              {/* Email card */}
              <button
                onClick={() => { setMethod('email'); setStep('input'); setError('') }}
                className="w-full text-left border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 px-5 py-5 transition-all group"
                style={{ borderRadius: 6 }}
                id="method-email"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 flex items-center justify-center shrink-0" style={{ borderRadius: 4 }}>
                    <span className="text-2xl">📧</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-lg group-hover:text-green-700 transition-colors">Email Address</p>
                    <p className="text-gray-500 text-sm mt-0.5">Receive a real OTP to your inbox</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </button>

              {/* Aadhaar note */}
              <div className="bg-amber-50 border border-amber-200 px-4 py-3 mt-2" style={{ borderRadius: 4 }}>
                <p className="text-amber-800 text-xs leading-relaxed">
                  <span className="font-bold">ℹ Note:</span> Phone OTP is in demo mode. Live SMS verification will be available with Aadhaar-based KYC integration.
                </p>
              </div>
            </div>
          )}

          {/* ── Step 2: Input (Phone or Email) ───────────────── */}
          {step === 'input' && (
            <div>
              {method === 'phone' ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
                  <div className="flex">
                    <div className="flex items-center px-4 bg-gray-100 border border-r-0 border-gray-300 text-gray-600 font-medium text-sm" style={{ borderRadius: '4px 0 0 4px' }}>+91</div>
                    <input
                      type="tel" maxLength={10} value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="98765 43210"
                      className="flex-1 border border-gray-300 px-4 py-4 text-gray-900 text-xl tracking-widest focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                      style={{ borderRadius: '0 4px 4px 0', fontFamily: 'monospace' }}
                      onKeyDown={e => e.key === 'Enter' && inputValid && sendOTP()}
                      autoFocus
                      id="input-phone"
                    />
                  </div>
                  {/* Demo info banner */}
                  <div className="bg-green-50 border border-green-200 px-4 py-3 mt-3" style={{ borderRadius: 4 }}>
                    <p className="text-green-800 text-xs">
                      🎯 <span className="font-bold">Demo Mode:</span> No SMS will be sent. Use OTP <span className="font-mono font-bold">123456</span> to verify.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="yourname@example.com"
                    className="w-full border border-gray-300 px-4 py-4 text-gray-900 text-lg focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    style={{ borderRadius: 4 }}
                    onKeyDown={e => e.key === 'Enter' && inputValid && sendOTP()}
                    autoFocus
                    id="input-email"
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: OTP Entry ────────────────────────────── */}
          {step === 'otp' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">One-Time Password (OTP)</label>
              <input
                type="number" maxLength={6} value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="• • • • • •"
                className="w-full border border-gray-300 px-4 py-5 text-gray-900 text-2xl tracking-widest text-center focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                style={{ borderRadius: 4, fontFamily: 'monospace' }}
                onKeyDown={e => e.key === 'Enter' && otpValid && handleVerify()}
                autoFocus
                id="input-otp"
              />
              {method === 'phone' && (
                <div className="bg-green-50 border border-green-200 px-4 py-3 mt-3" style={{ borderRadius: 4 }}>
                  <p className="text-green-800 text-xs">
                    🎯 <span className="font-bold">Demo OTP:</span> Enter <span className="font-mono font-bold">123456</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 px-4 py-3" style={{ borderRadius: 4 }}>
              <p className="text-red-700 text-sm font-medium">⚠ {error}</p>
            </div>
          )}

          {/* Action button */}
          {step !== 'method' && (
            <button
              onClick={step === 'input' ? sendOTP : handleVerify}
              disabled={loading || (step === 'input' && !inputValid) || (step === 'otp' && !otpValid)}
              className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-bold py-5 text-lg transition-colors"
              style={{ borderRadius: 4 }}
              id="btn-action"
            >
              {loading
                ? (step === 'input' ? 'Sending OTP...' : 'Verifying...')
                : (step === 'input' ? 'Send OTP →' : 'Verify & Continue →')}
            </button>
          )}

          {/* Secondary actions */}
          {step === 'input' && (
            <button onClick={goBack}
              className="text-green-700 hover:text-green-800 text-sm font-medium transition-colors"
              id="btn-change-method"
            >
              ← Change verification method
            </button>
          )}

          {step === 'otp' && (
            <div className="flex justify-between items-center pt-1">
              <button onClick={goBack}
                className="text-green-700 hover:text-green-800 text-sm font-medium transition-colors"
                id="btn-change-input"
              >
                ← Change {method === 'phone' ? 'number' : 'email'}
              </button>
              <button onClick={sendOTP} disabled={resendCooldown > 0 || loading}
                className="text-sm font-medium transition-colors disabled:text-gray-400 text-green-700 hover:text-green-800"
                id="btn-resend"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
              </button>
            </div>
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