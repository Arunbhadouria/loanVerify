'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function login() {
    setLoading(true)
    setError('')
    
    // Demo credentials — replace with real Supabase auth in production
    if (email === 'officer@bank.com' && password === 'demo1234') {
      localStorage.setItem('admin_logged_in', 'true')
      localStorage.setItem('admin_name', 'Rajesh Kumar')
      localStorage.setItem('admin_role', 'Senior Officer')
      router.push('/admin/dashboard')
    } else {
      setError('Invalid credentials. Demo: officer@bank.com / demo1234')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="max-w-sm w-full space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center 
            justify-center mx-auto text-2xl font-bold">
            🏦
          </div>
          <div>
            <h2 className="text-2xl font-bold">Bank Officer Portal</h2>
            <p className="text-slate-400 text-sm mt-1">LoanVerify Admin Dashboard</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-slate-900 rounded-2xl p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-slate-400 text-xs uppercase tracking-wide">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="officer@bank.com"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl 
                px-4 py-3 text-white placeholder-slate-500 focus:outline-none 
                focus:border-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 text-xs uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && login()}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl 
                px-4 py-3 text-white placeholder-slate-500 focus:outline-none 
                focus:border-blue-500"
            />
          </div>

          {error && (
            <div className="bg-red-950 border border-red-800 rounded-xl p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="bg-slate-800 rounded-xl p-3">
            <p className="text-slate-500 text-xs">
              Demo credentials:<br />
              📧 officer@bank.com<br />
              🔑 demo1234
            </p>
          </div>

          <button
            onClick={login}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 
              py-4 rounded-xl font-semibold transition">
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </div>
      </div>
    </main>
  )
}