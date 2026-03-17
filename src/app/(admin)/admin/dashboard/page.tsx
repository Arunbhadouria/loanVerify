'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Application } from '@/types'

const STATUS_STYLES = {
  pending: { label: 'Pending', cls: 'bg-amber-50 text-amber-800 border border-amber-200' },
  under_review: { label: 'In Review', cls: 'bg-blue-50 text-blue-800 border border-blue-200' },
  approved: { label: 'Approved', cls: 'bg-green-50 text-green-800 border border-green-200' },
  rejected: { label: 'Rejected', cls: 'bg-red-50 text-red-800 border border-red-200' },
  more_info: { label: 'More Info', cls: 'bg-purple-50 text-purple-800 border border-purple-200' },
}

const RISK_TEXT = {
  low: 'text-green-700 font-bold',
  medium: 'text-amber-700 font-bold',
  high: 'text-red-700 font-bold',
}

export default function DashboardPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [newAppAlert, setNewAppAlert] = useState(false)

  async function fetchApplications() {
    const { data } = await supabase
      .from('applications')
      .select(`*, users(full_name, phone, occupation)`)
      .order('created_at', { ascending: false })
    setApplications(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchApplications()
    const channel = supabase
      .channel('new_applications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'applications' }, () => {
        setNewAppAlert(true)
        fetchApplications()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const filtered = applications.filter(app => {
    const matchesFilter = filter === 'all' || app.status === filter
    const userData = app.users
    const user = Array.isArray(userData) ? userData[0] : userData
    const name = user?.full_name?.toLowerCase() || ''
    return matchesFilter && name.includes(search.toLowerCase())
  })

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    flagged: applications.filter(a => (a.fraud_flags?.length || 0) > 0).length,
  }

  return (
    <div className="space-y-6">

      {/* New application alert */}
      {newAppAlert && (
        <div className="bg-green-700 text-white px-5 py-3 flex items-center justify-between" style={{ borderRadius: 4 }}>
          <span className="font-semibold text-sm">🔔 New application received!</span>
          <button onClick={() => setNewAppAlert(false)} className="text-green-200 hover:text-white text-sm underline">Dismiss</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Loan Applications</h1>
          <p className="text-gray-400 text-sm mt-1">Review and process incoming loan applications</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Live
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Applications', value: stats.total, icon: '📋', border: 'border-l-gray-400' },
          { label: 'Pending Review', value: stats.pending, icon: '⏳', border: 'border-l-amber-500' },
          { label: 'Approved', value: stats.approved, icon: '✅', border: 'border-l-green-600' },
          { label: 'Fraud Flags', value: stats.flagged, icon: '🚩', border: 'border-l-red-500' },
        ].map(stat => (
          <div key={stat.label}
            className={`bg-white border border-gray-200 border-l-4 ${stat.border} p-4 shadow-sm`}
            style={{ borderRadius: 4 }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
            </div>
            <p className="text-gray-500 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by borrower name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-white border border-gray-300 px-4 py-2.5 text-gray-900 focus:outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
          style={{ borderRadius: 4 }}
        />
        <div className="flex gap-1.5 flex-wrap">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'under_review', label: 'In Review' },
            { key: 'approved', label: 'Approved' },
            { key: 'rejected', label: 'Rejected' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-2 text-sm font-semibold border transition-colors ${filter === f.key
                ? 'bg-green-700 text-white border-green-700'
                : 'bg-white text-gray-600 border-gray-300 hover:border-green-600 hover:text-green-700'}`}
              style={{ borderRadius: 4 }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-100 animate-pulse border border-gray-200" style={{ borderRadius: 4 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-lg font-semibold text-gray-600">No applications found</p>
          <p className="text-sm mt-1">{filter !== 'all' ? 'Try changing the filter' : 'Applications will appear here in real-time'}</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 overflow-hidden shadow-sm" style={{ borderRadius: 6 }}>
          {/* Table header */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <div className="col-span-4">Borrower</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-2 text-center">Score</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-2 text-right">Date</div>
          </div>

          {/* Rows */}
          {filtered.map((app, idx) => {
            const userData = app.users
            const user = Array.isArray(userData) ? userData[0] : userData
            const fraudCount = app.fraud_flags?.length || 0
            const statusStyle = STATUS_STYLES[app.status as keyof typeof STATUS_STYLES] || STATUS_STYLES.pending
            return (
              <div key={app.id}
                onClick={() => router.push(`/admin/application/${app.id}`)}
                className={`px-6 py-4 grid grid-cols-12 gap-4 items-center cursor-pointer hover:bg-green-50 transition-colors ${idx !== filtered.length - 1 ? 'border-b border-gray-100' : ''}`}>

                {/* Borrower */}
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-green-700 text-white flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ borderRadius: '50%' }}>
                    {user?.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate text-sm">{user?.full_name || 'Unknown'}</p>
                    <p className="text-gray-400 text-xs truncate">{user?.occupation}</p>
                    {fraudCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-red-600 text-xs font-semibold mt-0.5">
                        🚩 {fraudCount} fraud flag{fraudCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <div className="col-span-2 text-right">
                  <p className="font-bold text-gray-900 text-sm">₹{app.loan_amount?.toLocaleString('en-IN')}</p>
                </div>

                {/* Score */}
                <div className="col-span-2 text-center">
                  <p className={`text-sm ${RISK_TEXT[app.risk_band as keyof typeof RISK_TEXT] || 'text-gray-700'}`}>{app.credit_score}</p>
                  <p className="text-xs text-gray-400 capitalize">{app.risk_band}</p>
                </div>

                {/* Status */}
                <div className="col-span-2 flex justify-center">
                  <span className={`px-2.5 py-1 text-xs font-semibold ${statusStyle.cls}`} style={{ borderRadius: 3 }}>
                    {statusStyle.label}
                  </span>
                </div>

                {/* Date */}
                <div className="col-span-2 text-right">
                  <p className="text-gray-500 text-xs">{new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                  <p className="text-gray-400 text-xs">{new Date(app.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}