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
                    .select('*').eq('application_id', id).single(),
                supabase.from('documents')
                    .select('*').eq('application_id', id),
                supabase.from('ai_reports')
                    .select('*').eq('application_id', id).single(),
                supabase.from('credit_profiles')
                    .select('*').eq('application_id', id).single(),
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
        try {
            const res = await fetch('/api/claude', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'full_report',
                    data: {
                        borrowerName: appData.users?.full_name,
                        loanAmount: appData.loan_amount,
                        loanPurpose: appData.loan_purpose,
                        score: appData.credit_score,
                        riskBand: appData.risk_band,
                        assetType: assetData?.asset_type,
                        condition: assetData?.condition,
                        assetValue: assetData?.estimated_value,
                        location: `${assetData?.location_lat}, ${assetData?.location_lng}`,
                        monthlyIncome: appData.users?.monthly_income,
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
            <div className="text-slate-400 animate-pulse">Loading application...</div>
        </div>
    )

    if (!app) return (
        <div className="text-center py-20 text-slate-500">Application not found</div>
    )

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
                    className="text-slate-400 hover:text-white transition mt-1">
                    ← Back
                </button>
                <button
                    onClick={() => generatePDFReport({
                        borrowerName: app.users?.full_name,
                        phone: app.users?.phone,
                        pan: app.users?.pan,
                        occupation: app.users?.occupation,
                        monthlyIncome: app.users?.monthly_income,
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
                    className="ml-auto bg-slate-800 hover:bg-slate-700 px-4 py-2 
    rounded-xl text-sm font-medium transition flex items-center gap-2">
                    📄 Download PDF
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl font-bold">{app.users?.full_name}</h1>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border capitalize
              ${({
                                pending: 'bg-yellow-950 text-yellow-400 border-yellow-800',
                                under_review: 'bg-blue-950 text-blue-400 border-blue-800',
                                approved: 'bg-green-950 text-green-400 border-green-800',
                                rejected: 'bg-red-950 text-red-400 border-red-800',
                                more_info: 'bg-purple-950 text-purple-400 border-purple-800',
                            } as Record<string, string>)[app.status] || ''}`}>
                            {app.status?.replace('_', ' ')}
                        </span>
                        {(app.fraud_flags?.length || 0) > 0 && (
                            <span className="bg-red-950 text-red-400 border border-red-800 
                px-3 py-1 rounded-full text-xs font-medium">
                                🚩 {app.fraud_flags.length} Fraud Flag(s)
                            </span>
                        )}
                    </div>
                    <p className="text-slate-400 text-sm mt-1">
                        Applied {new Date(app.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'long', year: 'numeric'
                        })} • ID: {app.id.slice(0, 8)}...
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
                        className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span>{stat.icon}</span>
                            <span className="text-slate-400 text-xs">{stat.label}</span>
                        </div>
                        <p className={`text-xl font-bold ${stat.color || 'text-white'}`}>
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-900 rounded-xl p-1 gap-1 overflow-x-auto">
                {([
                    { id: 'overview', label: '👤 Overview' },
                    { id: 'photos', label: '📸 Photos' },
                    { id: 'report', label: '🤖 AI Report' },
                    { id: 'decision', label: '⚖️ Decision' },
                ] as const).map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition
              ${activeTab === tab.id
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-400 hover:text-white'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="grid md:grid-cols-2 gap-6">

                    {/* Borrower info */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                        <h3 className="font-bold text-lg">Borrower Profile</h3>
                        {[
                            { label: 'Full Name', value: app.users?.full_name },
                            { label: 'Phone', value: app.users?.phone },
                            { label: 'Occupation', value: app.users?.occupation },
                            { label: 'Monthly Income', value: `₹${app.users?.monthly_income?.toLocaleString('en-IN')}` },
                            { label: 'PAN', value: app.users?.pan },
                            { label: 'Aadhaar (Last 4)', value: `XXXX-XXXX-${app.users?.aadhaar_last4}` },
                        ].map(item => (
                            <div key={item.label}
                                className="flex justify-between items-center py-2 
                  border-b border-slate-800 last:border-0">
                                <span className="text-slate-400 text-sm">{item.label}</span>
                                <span className="text-white text-sm font-medium">{item.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Asset info */}
                    <div className="space-y-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                            <h3 className="font-bold text-lg">Collateral Asset</h3>
                            {[
                                { label: 'Type', value: asset?.asset_type },
                                { label: 'Description', value: asset?.asset_description },
                                { label: 'Condition', value: asset?.condition },
                                { label: 'Estimated Value', value: `₹${asset?.estimated_value?.toLocaleString('en-IN')}` },
                                { label: 'Location', value: asset?.location_lat ? `${asset.location_lat?.toFixed(4)}, ${asset.location_lng?.toFixed(4)}` : 'Not captured' },
                            ].map(item => (
                                <div key={item.label}
                                    className="flex justify-between items-center py-2 
                    border-b border-slate-800 last:border-0">
                                    <span className="text-slate-400 text-sm">{item.label}</span>
                                    <span className="text-white text-sm font-medium capitalize">{item.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Fraud flags */}
                        {(app.fraud_flags?.length || 0) > 0 && (
                            <div className="bg-red-950 border border-red-800 rounded-2xl p-5">
                                <h3 className="font-bold text-red-400 mb-3">🚩 Fraud Flags Detected</h3>
                                <div className="space-y-2">
                                    {app.fraud_flags.map((flag: string, i: number) => (
                                        <div key={i}
                                            className="flex items-center gap-2 bg-red-900 rounded-lg px-3 py-2">
                                            <span className="text-red-400 text-xs">⚠️</span>
                                            <span className="text-red-300 text-sm">{flag}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Score radar */}
                        {creditProfile && (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                                <h3 className="font-bold mb-3">Score Breakdown</h3>
                                <ResponsiveContainer width="100%" height={180}>
                                    <RadarChart data={radarData}>
                                        <PolarGrid stroke="#334155" />
                                        <PolarAngleAxis dataKey="subject"
                                            tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                        <Radar dataKey="value" stroke="#3b82f6"
                                            fill="#3b82f6" fillOpacity={0.3} />
                                        <Tooltip
                                            contentStyle={{
                                                background: '#1e293b',
                                                border: 'none',
                                                borderRadius: 8
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
                        <div className="text-center py-20 text-slate-500">
                            <div className="text-4xl mb-3">📷</div>
                            <p>No photos uploaded yet</p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {documents.map((doc, i) => (
                                <div key={i}
                                    className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                                    {doc.file_url ? (
                                        <img src={doc.file_url} alt={doc.doc_type}
                                            className="w-full aspect-video object-cover" />
                                    ) : (
                                        <div className="w-full aspect-video bg-slate-800 flex items-center 
                      justify-center text-slate-500 text-sm">
                                            Photo not available
                                        </div>
                                    )}
                                    <div className="p-3 space-y-1">
                                        <p className="text-sm font-medium capitalize">
                                            {doc.doc_type?.replace('_', ' ')}
                                        </p>
                                        {doc.gps_lat && (
                                            <p className="text-slate-400 text-xs">
                                                📍 {doc.gps_lat?.toFixed(4)}, {doc.gps_lng?.toFixed(4)}
                                            </p>
                                        )}
                                        {doc.captured_at && (
                                            <p className="text-slate-400 text-xs">
                                                🕐 {new Date(doc.captured_at).toLocaleString('en-IN')}
                                            </p>
                                        )}
                                        {doc.fraud_flag && (
                                            <p className="text-red-400 text-xs">🚩 {doc.fraud_flag}</p>
                                        )}
                                        {doc.is_verified && (
                                            <p className="text-green-400 text-xs">✅ Verified</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* AI Report Tab */}
            {activeTab === 'report' && (
                <div className="space-y-4">
                    {/* Score explanation */}
                    {aiReport?.score_explanation && (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                            <h3 className="font-bold mb-3 flex items-center gap-2">
                                <span>📊</span> Score Explanation (Borrower View)
                            </h3>
                            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                                {aiReport.score_explanation}
                            </p>
                        </div>
                    )}

                    {/* Full report */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold flex items-center gap-2">
                                <span>🤖</span> Full Assessment Report
                            </h3>
                            {!aiReport?.full_report && !loadingReport && (
                                <button
                                    onClick={() => generateFullReport(app, asset)}
                                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 
                    rounded-lg text-sm font-medium transition">
                                    Generate Report
                                </button>
                            )}
                        </div>

                        {loadingReport ? (
                            <div className="space-y-3 animate-pulse">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i}
                                        className={`h-4 bg-slate-700 rounded ${i % 3 === 0 ? 'w-3/4' : 'w-full'}`}
                                    />
                                ))}
                                <p className="text-slate-400 text-xs text-center pt-2">
                                    🤖 Claude is generating the assessment report...
                                </p>
                            </div>
                        ) : aiReport?.full_report ? (
                            <div className="prose prose-invert prose-sm max-w-none">
                                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                                    {aiReport.full_report}
                                </p>
                            </div>
                        ) : (
                            <p className="text-slate-500 text-sm text-center py-8">
                                Click "Generate Report" to create the AI assessment
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Decision Tab */}
            {activeTab === 'decision' && (
                <div className="max-w-lg space-y-5">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
                        <h3 className="font-bold text-lg">Make a Decision</h3>

                        {/* Decision buttons */}
                        <div className="space-y-2">
                            <label className="text-slate-400 text-xs uppercase tracking-wide">
                                Decision
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { value: 'approved', label: '✅ Approve', desc: 'Loan is approved', color: 'border-green-600 bg-green-950 text-green-400' },
                                    { value: 'rejected', label: '❌ Reject', desc: 'Loan is not approved', color: 'border-red-600 bg-red-950 text-red-400' },
                                    { value: 'more_info', label: '📋 Request More Info', desc: 'Need additional documents', color: 'border-purple-600 bg-purple-950 text-purple-400' },
                                    { value: 'under_review', label: '🔍 Mark Under Review', desc: 'Move to active review', color: 'border-blue-600 bg-blue-950 text-blue-400' },
                                ].map(d => (
                                    <button key={d.value}
                                        onClick={() => setDecision(prev => ({ ...prev, status: d.value }))}
                                        className={`p-4 rounded-xl border-2 text-left transition
                      ${decision.status === d.value
                                                ? d.color
                                                : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500'
                                            }`}>
                                        <p className="font-semibold text-sm">{d.label}</p>
                                        <p className="text-xs opacity-70 mt-0.5">{d.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Approved amount — only show when approving */}
                        {decision.status === 'approved' && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-slate-400 text-xs uppercase tracking-wide">
                                        Approved Amount (₹)
                                    </label>
                                    <input type="number"
                                        value={decision.approved_amount}
                                        onChange={e => setDecision(p => ({
                                            ...p, approved_amount: e.target.value
                                        }))}
                                        placeholder={app.loan_amount?.toString()}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl 
                      px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-slate-400 text-xs uppercase tracking-wide">
                                        Interest Rate (% per annum)
                                    </label>
                                    <input type="number" step="0.1"
                                        value={decision.interest_rate}
                                        onChange={e => setDecision(p => ({
                                            ...p, interest_rate: e.target.value
                                        }))}
                                        placeholder="12.5"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl 
                      px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </>
                        )}

                        {/* Officer notes */}
                        <div className="space-y-1">
                            <label className="text-slate-400 text-xs uppercase tracking-wide">
                                Officer Notes (visible to borrower)
                            </label>
                            <textarea
                                value={decision.officer_notes}
                                onChange={e => setDecision(p => ({ ...p, officer_notes: e.target.value }))}
                                placeholder="Add notes for the borrower..."
                                rows={3}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl 
                  px-4 py-3 text-white placeholder-slate-500 focus:outline-none 
                  focus:border-blue-500 resize-none"
                            />
                        </div>

                        <button
                            onClick={submitDecision}
                            disabled={!decision.status || submittingDecision}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 
                py-4 rounded-xl font-semibold transition">
                            {submittingDecision ? 'Submitting...' : 'Submit Decision →'}
                        </button>

                        <p className="text-slate-500 text-xs text-center">
                            Decision is final and will notify the borrower instantly via realtime update.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}