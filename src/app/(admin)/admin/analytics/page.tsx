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
      <div className="text-gray-500 animate-pulse">Loading analytics...</div>
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

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Analytics</h1>
        <p className="text-gray-500 text-sm">
          Overview of all loan applications
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Applications', value: applications.length, icon: '📋', border: 'border-l-gray-400', color: 'text-gray-900' },
          { label: 'Average Score', value: avgScore, icon: '📊', border: avgScore >= 700 ? 'border-l-green-600' : avgScore >= 500 ? 'border-l-amber-500' : 'border-l-red-500', color: avgScore >= 700 ? 'text-green-700' : avgScore >= 500 ? 'text-amber-700' : 'text-red-700' },
          { label: 'Approval Rate', value: `${approvalRate}%`, icon: '✅', border: 'border-l-green-600', color: 'text-green-700' },
          { label: 'Fraud Flagged', value: fraudFlagged, icon: '🚩', border: 'border-l-red-500', color: 'text-red-700' },
        ].map(kpi => (
          <div key={kpi.label}
            className={`bg-white border border-gray-200 border-l-4 ${kpi.border} p-5 shadow-sm`}
            style={{ borderRadius: 4 }}>
            <div className="text-2xl mb-2">{kpi.icon}</div>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-gray-500 text-sm mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Total loan value */}
      <div className="bg-white border border-gray-200 border-l-4 border-l-green-700 p-5 shadow-sm" style={{ borderRadius: 4 }}>
        <p className="text-gray-500 text-sm">Total Loan Value in Pipeline</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">
          ₹{totalLoanValue.toLocaleString('en-IN')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">

        {/* Score distribution bar chart */}
        <div className="bg-white border border-gray-200 p-6 shadow-sm" style={{ borderRadius: 8 }}>
          <h3 className="font-bold text-gray-900 mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Score Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={scoreRanges}>
              <XAxis dataKey="range" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#e5e7eb' }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#e5e7eb' }} />
              <Tooltip
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }} />
              <Bar dataKey="count" fill="#15803d" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status pie chart */}
        <div className="bg-white border border-gray-200 p-6 shadow-sm" style={{ borderRadius: 8 }}>
          <h3 className="font-bold text-gray-900 mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Application Status</h3>
          {statusData.length === 0 ? (
            <div className="flex items-center justify-center h-56 text-gray-400 text-sm italic">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={80} label>
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => (
                    <span style={{ color: '#4b5563', fontSize: 12, fontWeight: 500 }}>{value}</span>
                  )} />
                <Tooltip
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Risk band breakdown */}
        <div className="bg-white border border-gray-200 p-6 shadow-sm md:col-span-2" style={{ borderRadius: 8 }}>
          <h3 className="font-bold text-gray-900 mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Risk Band Distribution</h3>
          <div className="grid grid-cols-3 gap-4">
            {riskData.map((band, i) => (
              <div key={i}
                className={`rounded-lg p-5 border text-center shadow-sm
                  ${i === 0 ? 'bg-green-50 border-green-200' :
                    i === 1 ? 'bg-amber-50 border-amber-200' :
                    'bg-red-50 border-red-200'}`}>
                <p className={`text-4xl font-bold mb-1
                  ${i === 0 ? 'text-green-700' :
                    i === 1 ? 'text-amber-700' : 'text-red-700'}`}>
                  {band.value}
                </p>
                <p className={`text-sm font-semibold
                  ${i === 0 ? 'text-green-800' :
                    i === 1 ? 'text-amber-800' : 'text-red-800'}`}>
                  {band.name}
                </p>
              </div>
            ))}
          </div>

          {/* Progress bars */}
          <div className="mt-8 space-y-4">
            {riskData.map((band, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-gray-600 font-medium text-xs w-32">{band.name}</span>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                  <div
                    className={`h-full rounded-full transition-all duration-1000
                      ${i === 0 ? 'bg-green-600' : i === 1 ? 'bg-amber-500' : 'bg-red-600'}`}
                    style={{
                      width: `${applications.length
                        ? (band.value / applications.length) * 100 : 0}%`
                    }}
                  />
                </div>
                <span className="text-gray-700 font-bold text-xs w-10 text-right">
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