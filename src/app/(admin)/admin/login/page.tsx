'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function login() {
    setLoading(true)
    setError('')
    if (email === 'officer@bank.com' && password === 'demo1234') {
      localStorage.setItem('admin_logged_in', 'true')
      localStorage.setItem('admin_name', 'Rajesh Kumar')
      localStorage.setItem('admin_role', 'Senior Loan Officer')
      router.push('/admin/dashboard')
    } else {
      setError('Invalid credentials. Please try again.')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top accent bar */}
      <div className="h-1.5 bg-green-700 w-full" />

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Logo + Title */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-700 mb-5" style={{ borderRadius: 4 }}>
              <span className="text-white text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>CT</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
              Officer Portal
            </h1>
            <p className="text-gray-500 text-sm mt-2">CrediTrust Bank — Loan Management System</p>
          </div>

          {/* Login Card */}
          <div className="bg-white border border-gray-200 p-8 shadow-sm" style={{ borderRadius: 6 }}>
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Sign in to continue</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="officer@bank.com"
                  className="w-full border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-colors"
                  style={{ borderRadius: 4 }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={e => e.key === 'Enter' && login()}
                  className="w-full border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-colors"
                  style={{ borderRadius: 4 }}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 px-4 py-3" style={{ borderRadius: 4 }}>
                  <p className="text-red-700 text-sm font-medium">⚠ {error}</p>
                </div>
              )}

              <button
                onClick={login}
                disabled={loading}
                className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-bold py-3.5 text-base transition-colors"
                style={{ borderRadius: 4 }}
              >
                {loading ? 'Signing in...' : 'Sign In →'}
              </button>
            </div>

            {/* Demo credentials */}
            <div className="mt-6 bg-green-50 border border-green-200 px-4 py-3" style={{ borderRadius: 4 }}>
              <p className="text-green-800 text-xs font-semibold mb-1">Demo Credentials</p>
              <p className="text-green-700 text-sm font-mono">officer@bank.com / demo1234</p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-6">
            © 2025 CrediTrust Bank. Authorized personnel only.
          </p>
        </div>
      </div>
    </main>
  )
}