'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Application } from '@/types'

const STATUS_COLORS = {
  pending: 'bg-yellow-950 text-yellow-400 border-yellow-800',
  under_review: 'bg-blue-950 text-blue-400 border-blue-800',
  approved: 'bg-green-950 text-green-400 border-green-800',
  rejected: 'bg-red-950 text-red-400 border-red-800',
  more_info: 'bg-purple-950 text-purple-400 border-purple-800',
}

const RISK_COLORS = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-red-400',
}

export default function DashboardPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [newAppAlert, setNewAppAlert] = useState(false)

  async function fetchApplications() {
    const { data,error } = await supabase
      .from('applications')
      .select(`*, users(full_name, phone, occupation)`)
      .order('created_at', { ascending: false })

      console.log('Applications:', data)  // add this
  console.log('Error:', error) 

    setApplications(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchApplications()

    // Realtime — new applications appear live
    const channel = supabase
      .channel('new_applications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'applications'
      }, () => {
        setNewAppAlert(true)
        fetchApplications()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const filtered = applications.filter(app => {
    const matchesFilter = filter === 'all' || app.status === filter
    const name = (app as any).users?.full_name?.toLowerCase() || ''
    const matchesSearch = name.includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // Stats
  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    flagged: applications.filter(a => (a.fraud_flags?.length || 0) > 0).length,
  }

  return (
    <div className="space-y-6">

      {/* New app alert */}
      {newAppAlert && (
        <div className="bg-blue-600 rounded-xl p-4 flex items-center justify-between animate-pulse">
          <p className="font-semibold">🔔 New application received!</p>
          <button onClick={() => setNewAppAlert(false)}
            className="text-blue-200 hover:text-white text-sm">
            Dismiss
          </button>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Loan Applications</h1>
          <p className="text-slate-400 text-sm mt-1">
            Review and process incoming applications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-slate-400 text-sm">Live</span>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: '📋', color: 'text-white' },
          { label: 'Pending Review', value: stats.pending, icon: '⏳', color: 'text-yellow-400' },
          { label: 'Approved', value: stats.approved, icon: '✅', color: 'text-green-400' },
          { label: 'Fraud Flags', value: stats.flagged, icon: '🚩', color: 'text-red-400' },
        ].map(stat => (
          <div key={stat.label}
            className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{stat.icon}</span>
              <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
            </div>
            <p className="text-slate-400 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl 
            px-4 py-3 text-white placeholder-slate-500 focus:outline-none 
            focus:border-blue-500"
        />
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'under_review', 'approved', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition capitalize
                ${filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'}`}>
              {f === 'under_review' ? 'In Review' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Applications table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i}
              className="h-20 bg-slate-900 rounded-xl animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-lg font-medium">No applications found</p>
          <p className="text-sm mt-1">
            {filter !== 'all' ? 'Try changing the filter' : 'Applications will appear here in real-time'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => {
            const user = (app as any).users
            const fraudCount = app.fraud_flags?.length || 0
            return (
              <div key={app.id}
                onClick={() => router.push(`/admin/application/${app.id}`)}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 
                  hover:border-blue-500 cursor-pointer transition group">
                <div className="flex items-start justify-between gap-4">

                  {/* Left — borrower info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center 
                      justify-center font-bold text-sm flex-shrink-0">
                      {user?.full_name?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold group-hover:text-blue-400 transition">
                        {user?.full_name || 'Unknown'}
                      </p>
                      <p className="text-slate-400 text-sm">
                        {user?.occupation} • {user?.phone}
                      </p>
                      <p className="text-slate-500 text-xs mt-1">
                        {new Date(app.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Right — stats */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium 
                      border capitalize ${STATUS_COLORS[app.status as keyof typeof STATUS_COLORS]}`}>
                      {app.status?.replace('_', ' ')}
                    </span>
                    <p className="text-white font-bold">
                      ₹{app.loan_amount?.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Bottom bar */}
                <div className="flex items-center gap-4 mt-4 pt-4 
                  border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs">Score</span>
                    <span className={`font-bold text-sm 
                      ${RISK_COLORS[app.risk_band as keyof typeof RISK_COLORS]}`}>
                      {app.credit_score}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs">Risk</span>
                    <span className={`text-xs font-medium capitalize 
                      ${RISK_COLORS[app.risk_band as keyof typeof RISK_COLORS]}`}>
                      {app.risk_band}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs">Collateral</span>
                    <span className="text-white text-xs font-medium">
                      ₹{app.collateral_value?.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {fraudCount > 0 && (
                    <div className="ml-auto flex items-center gap-1 
                      bg-red-950 text-red-400 px-3 py-1 rounded-full">
                      <span>🚩</span>
                      <span className="text-xs font-medium">
                        {fraudCount} fraud flag{fraudCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}