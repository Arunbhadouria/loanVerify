'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    ResponsiveContainer, Tooltip
} from 'recharts'
import { generatePDFReport } from '@/lib/pdf'

export default function ApplicationDetail() {
    const { id } = useParams()
    const router = useRouter()
    const [app, setApp] = useState<any>(null)
    const [asset, setAsset] = useState<any>(null)
    const [documents, setDocuments] = useState<any[]>([])
    const [aiReport, setAiReport] = useState<any>(null)
    const [creditProfile, setCreditProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [loadingReport, setLoadingReport] = useState(false)
    const [activeTab, setActiveTab] = useState<'overview' | 'photos' | 'report' | 'decision'>('overview')
    const [decision, setDecision] = useState({
        status: '',
        approved_amount: '',
        interest_rate: '',
        officer_notes: '',
    })
    const [submittingDecision, setSubmittingDecision] = useState(false)

    useEffect(() => {
        async function fetchAll() {
            const [appRes, assetRes, docsRes, reportRes, creditRes] = await Promise.all([
                supabase.from('applications')
                    .select('*, users(*)')
                    .eq('id', id).single(),
                supabase.from('assets')
                    .select('*').eq('application_id', id).maybeSingle(),
                supabase.from('documents')
                    .select('*').eq('application_id', id),
                supabase.from('ai_reports')
                    .select('*').eq('application_id', id).maybeSingle(),
                supabase.from('credit_profiles')
                    .select('*').eq('application_id', id).maybeSingle(),
            ])

            setApp(appRes.data)
            setAsset(assetRes.data)
            setDocuments(docsRes.data || [])
            setAiReport(reportRes.data)
            setCreditProfile(creditRes.data)
            setLoading(false)

            // Auto-generate full report if not exists
            if (!reportRes.data?.full_report && appRes.data) {
                generateFullReport(appRes.data, assetRes.data)
            }
        }
        fetchAll()
    }, [id])

    async function generateFullReport(appData: any, assetData: any) {
        setLoadingReport(true)
        const b = Array.isArray(appData.users) ? appData.users[0] : appData.users
        try {
            const res = await fetch('/api/claude', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'full_report',
                    data: {
                        borrowerName: b?.full_name,
                        loanAmount: appData.loan_amount,
                        loanPurpose: appData.loan_purpose,
                        score: appData.credit_score,
                        riskBand: appData.risk_band,
                        assetType: assetData?.asset_type,
                        condition: assetData?.condition,
                        assetValue: assetData?.estimated_value,
                        location: `${assetData?.location_lat}, ${assetData?.location_lng}`,
                        monthlyIncome: b?.monthly_income,
                        existingEMI: 0,
                        collateralRatio: Math.round((assetData?.estimated_value / appData.loan_amount) * 100),
                        fraudFlags: appData.fraud_flags,
                    }
                })
            })
            const data = await res.json()

            // Save report to Supabase
            await supabase.from('ai_reports').upsert({
                application_id: id,
                full_report: data.message,
                score_explanation: aiReport?.score_explanation || ''
            })

            setAiReport((prev: any) => ({ ...prev, full_report: data.message }))
        } catch (e) {
            console.error('Report generation failed:', e)
        }
        setLoadingReport(false)
    }

    async function submitDecision() {
        if (!decision.status) return
        setSubmittingDecision(true)

        await supabase.from('applications').update({
            status: decision.status,
            approved_amount: decision.approved_amount
                ? parseFloat(decision.approved_amount) : null,
            interest_rate: decision.interest_rate
                ? parseFloat(decision.interest_rate) : null,
            officer_notes: decision.officer_notes,
            updated_at: new Date().toISOString(),
        }).eq('id', id)

        setApp((prev: any) => ({ ...prev, status: decision.status }))
        setSubmittingDecision(false)
        setActiveTab('overview')
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 animate-pulse">Loading application...</div>
        </div>
    )

    if (!app) return (
        <div className="text-center py-20 text-gray-500">Application not found</div>
    )

    const borrower = Array.isArray(app.users) ? app.users[0] : app.users

    const radarData = creditProfile ? [
        { subject: 'Payment', value: creditProfile.payment_history_score || 0 },
        { subject: 'Collateral', value: creditProfile.collateral_score || 0 },
        { subject: 'Income', value: creditProfile.income_stability_score || 0 },
        { subject: 'Debt Ratio', value: creditProfile.debt_to_income_score || 0 },
        { subject: 'Behavioral', value: creditProfile.behavioral_score || 0 },
    ] : []

    const scoreColor =
        app.credit_score >= 700 ? 'text-green-400' :
            app.credit_score >= 500 ? 'text-yellow-400' : 'text-red-400'

    return (
        <div className="space-y-6">

            {/* Back + Header */}
            <div className="flex items-start gap-4">
                <button onClick={() => router.push('/admin/dashboard')}
                    className="text-gray-500 hover:text-gray-900 transition mt-1 font-medium text-sm flex items-center gap-1">
                    ← Back
                </button>
                <button
                    onClick={() => generatePDFReport({
                        borrowerName: borrower?.full_name,
                        phone: borrower?.phone,
                        pan: borrower?.pan,
                        occupation: borrower?.occupation,
                        monthlyIncome: borrower?.monthly_income,
                        loanAmount: app.loan_amount,
                        loanPurpose: app.loan_purpose,
                        creditScore: app.credit_score,
                        riskBand: app.risk_band,
                        collateralValue: app.collateral_value,
                        assetType: asset?.asset_type,
                        assetDescription: asset?.asset_description,
                        assetCondition: asset?.condition,
                        fraudFlags: app.fraud_flags || [],
                        aiReport: aiReport?.full_report || '',
                        applicationId: app.id,
                        createdAt: app.created_at,
                    })}
                    className="ml-auto bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-700 px-4 py-2 
    rounded-lg text-sm font-semibold transition flex items-center gap-2">
                    📄 Download PDF
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>{borrower?.full_name}</h1>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize
              ${({
                                pending: 'bg-amber-50 text-amber-800 border-amber-200',
                                under_review: 'bg-blue-50 text-blue-800 border-blue-200',
                                approved: 'bg-green-50 text-green-800 border-green-200',
                                rejected: 'bg-red-50 text-red-800 border-red-200',
                                more_info: 'bg-purple-50 text-purple-800 border-purple-200',
                            } as Record<string, string>)[app.status] || ''}`}>
                            {app.status?.replace('_', ' ')}
                        </span>
                        {(app.fraud_flags?.length || 0) > 0 && (
                            <span className="bg-red-50 text-red-700 border border-red-200 
                px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                🚩 {app.fraud_flags.length} Fraud Flag(s)
                            </span>
                        )}
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                        Applied {new Date(app.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'long', year: 'numeric'
                        })} • ID: <span className="font-mono text-xs">{app.id.slice(0, 8)}</span>
                    </p>
                </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Loan Requested', value: `₹${app.loan_amount?.toLocaleString('en-IN')}`, icon: '💰' },
                    { label: 'Credit Score', value: app.credit_score, icon: '📊', color: scoreColor },
                    { label: 'Collateral Value', value: `₹${app.collateral_value?.toLocaleString('en-IN')}`, icon: '🏠' },
                    { label: 'Risk Band', value: app.risk_band?.toUpperCase(), icon: '⚠️', color: scoreColor },
                ].map(stat => (
                    <div key={stat.label}
                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <span>{stat.icon}</span>
                            <span className="text-gray-500 text-xs font-semibold">{stat.label}</span>
                        </div>
                        <p className={`text-xl font-bold ${stat.color || 'text-gray-900'}`}>
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1 overflow-x-auto border border-gray-200 shadow-inner">
                {([
                    { id: 'overview', label: '👤 Overview' },
                    { id: 'photos', label: '📸 Photos' },
                    { id: 'report', label: '🤖 AI Report' },
                    { id: 'decision', label: '⚖️ Decision' },
                ] as const).map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex-shrink-0 px-5 py-2.5 rounded-lg text-sm font-bold transition-all
              ${activeTab === tab.id
                                ? 'bg-white text-green-800 shadow-sm border border-gray-100'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="grid md:grid-cols-2 gap-6">

                    {/* Borrower info */}
                    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-4">
                        <h3 className="font-bold text-lg text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Borrower Profile</h3>
                        <div className="space-y-1">
                            {[
                                { label: 'Full Name', value: borrower?.full_name },
                                { label: 'Phone', value: borrower?.phone },
                                { label: 'Occupation', value: borrower?.occupation },
                                { label: 'Monthly Income', value: `₹${borrower?.monthly_income?.toLocaleString('en-IN')}` },
                                { label: 'PAN', value: borrower?.pan },
                                { label: 'Aadhaar (Last 4)', value: `XXXX-XXXX-${borrower?.aadhaar_last4}` },
                            ].map(item => (
                                <div key={item.label}
                                    className="flex justify-between items-center py-2.5 
                      border-b border-gray-100 last:border-0">
                                    <span className="text-gray-500 text-sm font-medium">{item.label}</span>
                                    <span className="text-gray-900 text-sm font-bold">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Asset info */}
                    <div className="space-y-4">
                        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-4">
                            <h3 className="font-bold text-lg text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Collateral Asset</h3>
                            <div className="space-y-1">
                                {[
                                    { label: 'Type', value: asset?.asset_type },
                                    { label: 'Description', value: asset?.asset_description },
                                    { label: 'Condition', value: asset?.condition },
                                    { label: 'Estimated Value', value: `₹${asset?.estimated_value?.toLocaleString('en-IN')}` },
                                    { label: 'Location', value: asset?.location_lat ? `${asset.location_lat?.toFixed(4)}, ${asset.location_lng?.toFixed(4)}` : 'Not captured' },
                                ].map(item => (
                                    <div key={item.label}
                                        className="flex justify-between items-center py-2.5 
                        border-b border-gray-100 last:border-0">
                                        <span className="text-gray-500 text-sm font-medium">{item.label}</span>
                                        <span className="text-gray-900 text-sm font-bold capitalize">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Fraud flags */}
                        {(app.fraud_flags?.length || 0) > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-sm">
                                <h3 className="font-bold text-red-700 mb-3 flex items-center gap-2">
                                    <span>🚩</span> Fraud Flags Detected
                                </h3>
                                <div className="space-y-2">
                                    {app.fraud_flags.map((flag: string, i: number) => (
                                        <div key={i}
                                            className="flex items-center gap-2 bg-white border border-red-100 rounded-lg px-3 py-2 shadow-sm">
                                            <span className="text-red-600 text-xs font-bold">⚠️</span>
                                            <span className="text-red-800 text-sm font-medium">{flag}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Score radar */}
                        {creditProfile && (
                            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5">
                                <h3 className="font-bold mb-4 text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Score Breakdown</h3>
                                <ResponsiveContainer width="100%" height={220}>
                                    <RadarChart data={radarData}>
                                        <PolarGrid stroke="#e5e7eb" />
                                        <PolarAngleAxis dataKey="subject"
                                            tick={{ fill: '#6b7280', fontSize: 11 }} />
                                        <Radar dataKey="value" stroke="#15803d"
                                            fill="#15803d" fillOpacity={0.4} />
                                        <Tooltip
                                            contentStyle={{
                                                background: '#ffffff',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: 8,
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                color: '#111827'
                                            }} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Photos Tab */}
            {activeTab === 'photos' && (
                <div className="space-y-4">
                    {documents.length === 0 ? (
                        <div className="text-center py-24 bg-white border border-gray-200 rounded-2xl text-gray-400">
                            <div className="text-5xl mb-4">📷</div>
                            <p className="text-lg font-semibold">No photos uploaded yet</p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {documents.map((doc, i) => (
                                <div key={i}
                                    className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden group">
                                    {doc.file_url ? (
                                        <div className="relative aspect-video overflow-hidden">
                                            <img src={doc.file_url} alt={doc.doc_type}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                        </div>
                                    ) : (
                                        <div className="w-full aspect-video bg-gray-50 flex items-center 
                      justify-center text-gray-400 text-sm italic">
                                            Photo not available
                                        </div>
                                    )}
                                    <div className="p-4 space-y-2">
                                        <p className="text-sm font-bold text-gray-900 capitalize">
                                            {doc.doc_type?.replace('_', ' ')}
                                        </p>
                                        <div className="space-y-1">
                                            {doc.gps_lat && (
                                                <p className="text-gray-500 text-xs flex items-center gap-1">
                                                    📍 {doc.gps_lat?.toFixed(4)}, {doc.gps_lng?.toFixed(4)}
                                                </p>
                                            )}
                                            {doc.captured_at && (
                                                <p className="text-gray-500 text-xs flex items-center gap-1">
                                                    🕐 {new Date(doc.captured_at).toLocaleString('en-IN')}
                                                </p>
                                            )}
                                        </div>
                                        <div className="pt-2 flex flex-wrap gap-1">
                                            {doc.fraud_flag && (
                                                <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded border border-red-200">🚩 {doc.fraud_flag}</span>
                                            )}
                                            {doc.is_verified && (
                                                <span className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded border border-green-200">✅ Verified</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* AI Report Tab */}
            {activeTab === 'report' && (
                <div className="space-y-6">
                    {/* Score explanation */}
                    {aiReport?.score_explanation && (
                        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
                            <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                                <span>📊</span> Score Explanation (Borrower View)
                            </h3>
                            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line p-4 bg-gray-50 rounded-xl border border-gray-100">
                                {aiReport.score_explanation}
                            </p>
                        </div>
                    )}

                    {/* Full report */}
                    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold flex items-center gap-2 text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                                <span>🤖</span> AI Assessment Report
                            </h3>
                            {!aiReport?.full_report && !loadingReport && (
                                <button
                                    onClick={() => generateFullReport(app, asset)}
                                    className="bg-green-700 hover:bg-green-800 text-white px-5 py-2 
                    rounded-lg text-sm font-bold transition shadow-sm">
                                    Generate Full Assessment
                                </button>
                            )}
                        </div>

                        {loadingReport ? (
                            <div className="space-y-4 animate-pulse p-4">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i}
                                        className={`h-4 bg-gray-100 rounded ${i % 3 === 0 ? 'w-3/4' : 'w-full'}`}
                                    />
                                ))}
                                <p className="text-gray-500 text-xs text-center pt-4 font-medium italic">
                                    🤖 Claude is synthesizing the risk assessment...
                                </p>
                            </div>
                        ) : aiReport?.full_report ? (
                            <div className="prose prose-sm max-w-none text-gray-800 p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                                <p className="leading-relaxed whitespace-pre-line">
                                    {aiReport.full_report}
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-300">
                                <p className="text-gray-400 text-sm italic">
                                    Assessment report hasn&apos;t been generated yet for this application.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Decision Tab */}
            {activeTab === 'decision' && (
                <div className="max-w-2xl space-y-6">
                    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8 space-y-6">
                        <h3 className="font-bold text-xl text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Final Credit Decision</h3>

                        {/* Decision buttons */}
                        <div className="space-y-3">
                            <label className="text-gray-500 text-xs font-bold uppercase tracking-widest pl-1">
                                SELECT STATUS
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    { value: 'approved', label: '✅ Approve', desc: 'Loan is approved', color: 'border-green-600 bg-green-50 text-green-800 active:bg-green-100' },
                                    { value: 'rejected', label: '❌ Reject', desc: 'Loan is not approved', color: 'border-red-600 bg-red-50 text-red-800 active:bg-red-100' },
                                    { value: 'more_info', label: '📋 Request More Info', desc: 'Need additional documents', color: 'border-purple-600 bg-purple-50 text-purple-800 active:bg-purple-100' },
                                    { value: 'under_review', label: '🔍 Mark Under Review', desc: 'Continued active review', color: 'border-blue-600 bg-blue-50 text-blue-800 active:bg-blue-100' },
                                ].map(d => (
                                    <button key={d.value}
                                        onClick={() => setDecision(prev => ({ ...prev, status: d.value }))}
                                        className={`p-4 rounded-xl border-2 text-left transition-all
                      ${decision.status === d.value
                                                ? d.color + ' shadow-md'
                                                : 'border-gray-100 bg-gray-50/50 text-gray-600 hover:border-gray-300 hover:bg-white'
                                            }`}>
                                        <p className="font-bold text-sm mb-0.5">{d.label}</p>
                                        <p className="text-[10px] opacity-70 font-medium">{d.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Approved amount — only show when approving */}
                        {decision.status === 'approved' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-300">
                                <div className="space-y-1.5">
                                    <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest pl-1">
                                        APPROVED AMOUNT (₹)
                                    </label>
                                    <input type="number"
                                        value={decision.approved_amount}
                                        onChange={e => setDecision(p => ({
                                            ...p, approved_amount: e.target.value
                                        }))}
                                        placeholder={app.loan_amount?.toString()}
                                        className="w-full bg-white border border-gray-300 rounded-lg 
                      px-4 py-3 text-gray-900 font-bold focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 shadow-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest pl-1">
                                        INTEREST RATE (% p.a.)
                                    </label>
                                    <input type="number" step="0.1"
                                        value={decision.interest_rate}
                                        onChange={e => setDecision(p => ({
                                            ...p, interest_rate: e.target.value
                                        }))}
                                        placeholder="12.5"
                                        className="w-full bg-white border border-gray-300 rounded-lg 
                      px-4 py-3 text-gray-900 font-bold focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 shadow-sm"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Officer notes */}
                        <div className="space-y-1.5">
                            <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest pl-1">
                                OFFICER NOTES (VISIBLE TO BORROWER)
                            </label>
                            <textarea
                                value={decision.officer_notes}
                                onChange={e => setDecision(p => ({ ...p, officer_notes: e.target.value }))}
                                placeholder="Add comments regarding this decision..."
                                rows={4}
                                className="w-full bg-white border border-gray-300 rounded-lg 
                  px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none 
                  focus:border-green-600 focus:ring-1 focus:ring-green-600 resize-none shadow-sm font-medium"
                            />
                        </div>

                        <button
                            onClick={submitDecision}
                            disabled={!decision.status || submittingDecision}
                            className="w-full bg-green-700 text-white hover:bg-green-800 disabled:opacity-50 
                py-4 rounded-xl font-bold text-lg transition-all shadow-lg active:scale-[0.98]">
                            {submittingDecision ? 'Submitting...' : 'Submit Decision →'}
                        </button>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <p className="text-gray-500 text-[11px] text-center font-medium">
                                ℹ️ Submitting this decision will immediately update the borrower&apos;s dashboard and trigger any relevant status change notifications.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}