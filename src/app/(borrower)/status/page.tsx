'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function StatusPage() {
  const [status, setStatus] = useState<string>('pending')
  const [approvedAmount, setApprovedAmount] = useState<number | null>(null)
  const [interestRate, setInterestRate] = useState<number | null>(null)
  const [officerNotes, setOfficerNotes] = useState<string>('')

  useEffect(() => {
    const applicationId = localStorage.getItem('application_id')
    if (!applicationId) return

    supabase.from('applications')
      .select('status, approved_amount, officer_notes, interest_rate')
      .eq('id', applicationId)
      .single()
      .then(({ data }) => {
        if (data) {
          setStatus(data.status)
          setApprovedAmount(data.approved_amount)
          setInterestRate(data.interest_rate)
          setOfficerNotes(data.officer_notes)
        }
      })

    const channel = supabase
      .channel('application_status')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'applications',
        filter: `id=eq.${applicationId}`
      }, (payload) => {
        setStatus(payload.new.status)
        setApprovedAmount(payload.new.approved_amount)
        setInterestRate(payload.new.interest_rate)
        setOfficerNotes(payload.new.officer_notes)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const statusConfig = {
    pending: {
      icon: '⏳',
      iconBg: 'bg-amber-50 border-amber-200',
      title: 'Application Submitted',
      desc: 'Your application is in the queue. A bank officer will review it shortly.',
      accentColor: 'border-l-amber-500',
      textColor: 'text-amber-700',
      bg: 'bg-amber-50 border-amber-200',
    },
    under_review: {
      icon: '🔍',
      iconBg: 'bg-blue-50 border-blue-200',
      title: 'Under Active Review',
      desc: 'An officer is actively reviewing your file right now.',
      accentColor: 'border-l-blue-500',
      textColor: 'text-blue-700',
      bg: 'bg-blue-50 border-blue-200',
    },
    approved: {
      icon: '✅',
      iconBg: 'bg-green-50 border-green-200',
      title: 'Loan Approved!',
      desc: 'Congratulations! Your loan has been approved.',
      accentColor: 'border-l-green-600',
      textColor: 'text-green-700',
      bg: 'bg-green-50 border-green-200',
    },
    rejected: {
      icon: '❌',
      iconBg: 'bg-red-50 border-red-200',
      title: 'Application Not Approved',
      desc: 'Unfortunately your application was not approved at this time.',
      accentColor: 'border-l-red-500',
      textColor: 'text-red-700',
      bg: 'bg-red-50 border-red-200',
    },
    more_info: {
      icon: '📋',
      iconBg: 'bg-purple-50 border-purple-200',
      title: 'More Information Required',
      desc: 'The bank officer needs additional documents from you.',
      accentColor: 'border-l-purple-500',
      textColor: 'text-purple-700',
      bg: 'bg-purple-50 border-purple-200',
    },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

  const timeline = [
    { label: 'Application Submitted', done: true },
    { label: 'Documents Verified', done: ['under_review', 'approved', 'rejected'].includes(status) },
    { label: 'Credit Assessment', done: ['approved', 'rejected'].includes(status) },
    { label: 'Final Decision', done: ['approved', 'rejected'].includes(status) },
  ]

  return (
    <main className="min-h-screen bg-white">
      {/* Bank Header */}
      <div className="bg-green-700 px-6 py-4">
        <p className="text-white font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>CrediTrust Bank</p>
        <p className="text-green-200 text-xs">Application Status</p>
      </div>

      <div className="max-w-md mx-auto px-6 py-8 space-y-6 pb-32">

        {/* Status Icon */}
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-20 h-20 border-2 text-4xl mx-auto mb-4 ${config.iconBg}`} style={{ borderRadius: 8 }}>
            {config.icon}
          </div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
            {config.title}
          </h1>
          <p className="text-gray-500 text-sm mt-2">{config.desc}</p>
        </div>

        {/* Approval details */}
        {status === 'approved' && approvedAmount && (
          <div className="bg-green-700 text-white p-6 text-center" style={{ borderRadius: 6 }}>
            <p className="text-green-200 text-sm font-semibold uppercase tracking-wide mb-1">Sanctioned Amount</p>
            <p className="text-4xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
              ₹{approvedAmount.toLocaleString('en-IN')}
            </p>
            {interestRate && (
              <p className="text-green-200 text-sm mt-2">Interest: {interestRate}% per annum</p>
            )}
          </div>
        )}

        {/* Officer notes */}
        {officerNotes && (
          <div className="bg-gray-50 border border-gray-200 px-5 py-4 border-l-4 border-l-green-600" style={{ borderRadius: 4 }}>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">Officer's Note</p>
            <p className="text-gray-800 text-sm leading-relaxed">{officerNotes}</p>
          </div>
        )}

        {/* Progress timeline */}
        <div className="bg-white border border-gray-200 p-5" style={{ borderRadius: 6 }}>
          <h3 className="font-bold text-gray-900 mb-4 text-base" style={{ fontFamily: "'Playfair Display', serif" }}>Application Progress</h3>
          <div className="space-y-4">
            {timeline.map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={`w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0
                  ${item.done ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}
                  style={{ borderRadius: '50%' }}>
                  {item.done ? '✓' : i + 1}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${item.done ? 'text-gray-900' : 'text-gray-400'}`}>{item.label}</p>
                  {i < timeline.length - 1 && (
                    <div className={`mt-3 ml-[-24px] pl-[38px] h-px ${item.done ? 'bg-green-200' : 'bg-gray-100'}`} />
                  )}
                </div>
                {item.done && <span className="text-green-600 text-xs font-semibold">Done</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Auto-update notice */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-gray-400 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            This page updates automatically — no need to refresh
          </div>
        </div>
      </div>
    </main>
  )
}