'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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
    // For demo — skip real OTP, just proceed
    // In production: use Supabase phone auth
    if (phone.length === 10) {
      setStep('otp')
    } else {
      setError('Enter a valid 10-digit number')
    }
    setLoading(false)
  }

  async function verifyOTP() {
    setLoading(true)
    // Demo: any 6-digit OTP works
    if (otp === '123456' || otp.length === 6) {
      // Store phone in localStorage for demo
      localStorage.setItem('user_phone', phone)
      router.push('/onboarding')
    } else {
      setError('Invalid OTP. Use 123456 for demo.')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="max-w-sm w-full space-y-8">
        
        <div className="text-center space-y-2">
          <div className="text-4xl">📱</div>
          <h2 className="text-2xl font-bold">
            {step === 'phone' ? 'Enter your phone' : 'Verify OTP'}
          </h2>
          <p className="text-slate-400 text-sm">
            {step === 'phone'
              ? 'We\'ll send a verification code'
              : `Sent to +91 ${phone}`}
          </p>
        </div>

        <div className="space-y-4">
          {step === 'phone' ? (
            <div className="flex">
              <span className="bg-slate-800 border border-slate-700 border-r-0 
                px-4 py-4 rounded-l-xl text-slate-400 text-sm flex items-center">
                +91
              </span>
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="98765 43210"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-r-xl 
                  px-4 py-4 text-white placeholder-slate-500 focus:outline-none 
                  focus:border-blue-500 text-lg tracking-widest"
              />
            </div>
          ) : (
            <input
              type="number"
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl 
                px-4 py-4 text-white placeholder-slate-500 focus:outline-none 
                focus:border-blue-500 text-lg tracking-widest text-center"
            />
          )}

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          {step === 'otp' && (
            <p className="text-slate-500 text-xs text-center">
              Demo OTP: <span className="text-blue-400 font-mono">123456</span>
            </p>
          )}

          <button
            onClick={step === 'phone' ? sendOTP : verifyOTP}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 
              font-semibold py-4 rounded-xl transition text-white">
            {loading ? 'Please wait...' : step === 'phone' ? 'Send OTP →' : 'Verify & Continue →'}
          </button>

          {step === 'otp' && (
            <button onClick={() => setStep('phone')}
              className="w-full text-slate-400 hover:text-white text-sm transition">
              ← Change number
            </button>
          )}
        </div>
      </div>
    </main>
  )
}