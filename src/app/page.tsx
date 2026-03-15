import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-8">
        
        {/* Logo */}
        <div className="space-y-2">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto text-3xl">
            🏦
          </div>
          <h1 className="text-3xl font-bold">LoanVerify</h1>
          <p className="text-slate-400 text-sm">
            Get your loan approved in minutes. No field officer. No paperwork.
          </p>
        </div>

        {/* Steps */}
        <div className="bg-slate-900 rounded-2xl p-6 space-y-4 text-left">
          {[
            { icon: '📋', title: 'Fill your profile', desc: 'Basic details + income info' },
            { icon: '📸', title: 'Inspect your asset', desc: 'Photo walkthrough from your phone' },
            { icon: '⚡', title: 'Get instant score', desc: 'AI-powered credit assessment' },
            { icon: '✅', title: 'Bank decides fast', desc: 'Officer reviews and approves' },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-xl">{step.icon}</span>
              <div>
                <p className="font-medium text-sm">{step.title}</p>
                <p className="text-slate-500 text-xs">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <Link href="/login"
            className="block w-full bg-blue-600 hover:bg-blue-700 
            text-white font-semibold py-4 rounded-xl text-center transition">
            Apply for Loan →
          </Link>
          <Link href="/admin/login"
            className="block w-full text-slate-400 hover:text-white 
            text-sm text-center transition">
            Bank Officer Login
          </Link>
        </div>
      </div>
    </main>
  )
}