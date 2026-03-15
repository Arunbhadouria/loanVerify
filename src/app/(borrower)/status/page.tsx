'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function StatusPage() {
  const [status, setStatus] = useState<string>('pending')
  const [approvedAmount, setApprovedAmount] = useState<number | null>(null)
  const [officerNotes, setOfficerNotes] = useState<string>('')

  useEffect(() => {
    const applicationId = localStorage.getItem('application_id')
    if (!applicationId) return

    // Initial fetch
    supabase.from('applications')
      .select('status, approved_amount, officer_notes, interest_rate')
      .eq('id', applicationId)
      .single()
      .then(({ data }) => {
        if (data) {
          setStatus(data.status)
          setApprovedAmount(data.approved_amount)
          setOfficerNotes(data.officer_notes)
        }
      })

    // Realtime subscription
    const channel = supabase
      .channel('application_status')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'applications',
        filter: `id=eq.${applicationId}`
      }, (payload) => {
        setStatus(payload.new.status)
        setApprovedAmount(payload.new.approved_amount)
        setOfficerNotes(payload.new.officer_notes)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const statusConfig = {
    pending: {
      icon: '⏳', color: 'text-yellow-400', bg: 'bg-yellow-950 border-yellow-800',
      title: 'Under Review', desc: 'A bank officer is reviewing your application.'
    },
    under_review: {
      icon: '🔍', color: 'text-blue-400', bg: 'bg-blue-950 border-blue-800',
      title: 'Being Reviewed', desc: 'Officer is actively reviewing your file.'
    },
    approved: {
      icon: '🎉', color: 'text-green-400', bg: 'bg-green-950 border-green-800',
      title: 'Approved!', desc: `Your loan has been approved.`
    },
    rejected: {
      icon: '❌', color: 'text-red-400', bg: 'bg-red-950 border-red-800',
      title: 'Not Approved', desc: 'Your application was not approved at this time.'
    },
    more_info: {
      icon: '📋', color: 'text-purple-400', bg: 'bg-purple-950 border-purple-800',
      title: 'More Info Needed', desc: 'The officer needs additional information.'
    },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-8 
      flex items-center justify-center">
      <div className="max-w-sm w-full space-y-6 text-center">

        <div className="text-7xl animate-bounce">{config.icon}</div>

        <div className={`border rounded-2xl p-6 ${config.bg}`}>
          <h2 className={`text-2xl font-bold ${config.color}`}>{config.title}</h2>
          <p className="text-slate-300 text-sm mt-2">{config.desc}</p>

          {status === 'approved' && approvedAmount && (
            <div className="mt-4 p-4 bg-green-900 rounded-xl">
              <p className="text-green-300 text-xs uppercase tracking-wide">Approved Amount</p>
              <p className="text-3xl font-bold text-green-400 mt-1">
                ₹{approvedAmount.toLocaleString('en-IN')}
              </p>
            </div>
          )}

          {officerNotes && (
            <div className="mt-4 text-left bg-slate-900 rounded-xl p-4">
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">
                Officer Notes
              </p>
              <p className="text-slate-300 text-sm">{officerNotes}</p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-slate-900 rounded-2xl p-4 text-left space-y-3">
          {[
            { label: 'Application Submitted', done: true },
            { label: 'Documents Verified', done: ['under_review', 'approved', 'rejected'].includes(status) },
            { label: 'Credit Assessment', done: ['approved', 'rejected'].includes(status) },
            { label: 'Final Decision', done: ['approved', 'rejected'].includes(status) },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs
                ${item.done ? 'bg-green-500' : 'bg-slate-700'}`}>
                {item.done ? '✓' : ''}
              </div>
              <span className={`text-sm ${item.done ? 'text-white' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <p className="text-slate-500 text-xs">
          This page updates automatically. No need to refresh.
        </p>
      </div>
    </main>
  )
}