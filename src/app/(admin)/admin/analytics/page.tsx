'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts'

const COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6']

export default function AnalyticsPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('applications')
      .select('*, users(*)')
      .then(({ data }) => {
        setApplications(data || [])
        setLoading(false)
      })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-slate-400 animate-pulse">Loading analytics...</div>
    </div>
  )

  // Derived data
  const statusData = [
    { name: 'Pending', value: applications.filter(a => a.status === 'pending').length },
    { name: 'Approved', value: applications.filter(a => a.status === 'approved').length },
    { name: 'Rejected', value: applications.filter(a => a.status === 'rejected').length },
    { name: 'In Review', value: applications.filter(a => a.status === 'under_review').length },
  ].filter(d => d.value > 0)

  const riskData = [
    { name: 'Low Risk (700+)', value: applications.filter(a => a.credit_score >= 700).length },
    { name: 'Medium (500-699)', value: applications.filter(a => a.credit_score >= 500 && a.credit_score < 700).length },
    { name: 'High Risk (<500)', value: applications.filter(a => a.credit_score < 500).length },
  ]

  const scoreRanges = [
    { range: '300-400', count: applications.filter(a => a.credit_score < 400).length },
    { range: '400-500', count: applications.filter(a => a.credit_score >= 400 && a.credit_score < 500).length },
    { range: '500-600', count: applications.filter(a => a.credit_score >= 500 && a.credit_score < 600).length },
    { range: '600-700', count: applications.filter(a => a.credit_score >= 600 && a.credit_score < 700).length },
    { range: '700-800', count: applications.filter(a => a.credit_score >= 700 && a.credit_score < 800).length },
    { range: '800-900', count: applications.filter(a => a.credit_score >= 800).length },
  ]

  const avgScore = applications.length
    ? Math.round(applications.reduce((s, a) => s + (a.credit_score || 0), 0) / applications.length)
    : 0

  const totalLoanValue = applications.reduce((s, a) => s + (a.loan_amount || 0), 0)
  const approvalRate = applications.length
    ? Math.round((applications.filter(a => a.status === 'approved').length / applications.length) * 100)
    : 0

  const fraudFlagged = applications.filter(a => (a.fraud_flags?.length || 0) > 0).length

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">
          Overview of all loan applications
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Applications', value: applications.length, icon: '📋', color: 'text-white' },
          { label: 'Average Score', value: avgScore, icon: '📊', color: avgScore >= 700 ? 'text-green-400' : avgScore >= 500 ? 'text-yellow-400' : 'text-red-400' },
          { label: 'Approval Rate', value: `${approvalRate}%`, icon: '✅', color: 'text-green-400' },
          { label: 'Fraud Flagged', value: fraudFlagged, icon: '🚩', color: 'text-red-400' },
        ].map(kpi => (
          <div key={kpi.label}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-2xl mb-2">{kpi.icon}</div>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-slate-400 text-sm mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Total loan value */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <p className="text-slate-400 text-sm">Total Loan Value in Pipeline</p>
        <p className="text-3xl font-bold text-blue-400 mt-1">
          ₹{totalLoanValue.toLocaleString('en-IN')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">

        {/* Score distribution bar chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-bold mb-4">Score Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={scoreRanges}>
              <XAxis dataKey="range" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: 'none',
                  borderRadius: 8
                }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status pie chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-bold mb-4">Application Status</h3>
          {statusData.length === 0 ? (
            <div className="flex items-center justify-center h-44 text-slate-500 text-sm">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={80} label>
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => (
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>
                  )} />
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: 'none',
                    borderRadius: 8
                  }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Risk band breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:col-span-2">
          <h3 className="font-bold mb-4">Risk Band Distribution</h3>
          <div className="grid grid-cols-3 gap-4">
            {riskData.map((band, i) => (
              <div key={i}
                className={`rounded-xl p-4 border text-center
                  ${i === 0 ? 'bg-green-950 border-green-800' :
                    i === 1 ? 'bg-yellow-950 border-yellow-800' :
                    'bg-red-950 border-red-800'}`}>
                <p className={`text-3xl font-bold
                  ${i === 0 ? 'text-green-400' :
                    i === 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {band.value}
                </p>
                <p className={`text-xs mt-1
                  ${i === 0 ? 'text-green-400' :
                    i === 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {band.name}
                </p>
              </div>
            ))}
          </div>

          {/* Progress bars */}
          <div className="mt-4 space-y-2">
            {riskData.map((band, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-slate-400 text-xs w-32">{band.name}</span>
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000
                      ${i === 0 ? 'bg-green-500' : i === 1 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{
                      width: `${applications.length
                        ? (band.value / applications.length) * 100 : 0}%`
                    }}
                  />
                </div>
                <span className="text-slate-300 text-xs w-8 text-right">
                  {applications.length
                    ? Math.round((band.value / applications.length) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}