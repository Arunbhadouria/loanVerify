import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Top green banner */}
      <div className="bg-green-700 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white flex items-center justify-center flex-shrink-0" style={{ borderRadius: 3 }}>
            <span className="text-green-700 text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>C</span>
          </div>
          <div>
            <p className="text-white font-bold text-xl leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>CrediTrust Bank</p>
            <p className="text-green-200 text-xs mt-0.5">Instant Collateral Loan Assessment</p>
          </div>
        </div>
        <Link href="/admin/login"
          className="text-green-200 hover:text-white text-sm font-medium transition-colors border border-green-500 hover:border-white px-3 py-1.5"
          style={{ borderRadius: 3 }}>
          Officer Login
        </Link>
      </div>

      {/* Hero */}
      <div className="bg-green-50 border-b border-green-100 px-6 py-12 text-center">
        <p className="text-green-700 text-xs font-bold uppercase tracking-widest mb-3">Powered by AI</p>
        <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
          Get Your Loan Approved<br />in Minutes
        </h1>
        <p className="text-gray-500 text-base max-w-xs mx-auto">
          No field officer. No paperwork. Just a few photos from your phone.
        </p>
      </div>

      {/* Steps */}
      <div className="flex-1 px-6 py-8 max-w-md mx-auto w-full">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">How it works</p>
        <div className="space-y-0 border border-gray-200 overflow-hidden" style={{ borderRadius: 6 }}>
          {[
            { num: '1', icon: '📋', title: 'Fill Your Profile', desc: 'Basic personal and income details — takes 2 minutes' },
            { num: '2', icon: '📸', title: 'Photograph Your Asset', desc: 'Take photos of your collateral from your phone' },
            { num: '3', icon: '🤖', title: 'Get Your Credit Score', desc: 'AI evaluates your profile and gives an instant score' },
            { num: '4', icon: '✅', title: 'Bank Decides in Hours', desc: 'Our officer reviews and sends you a decision' },
          ].map((step, i) => (
            <div key={i} className={`flex items-center gap-4 px-5 py-4 bg-white ${i !== 3 ? 'border-b border-gray-100' : ''}`}>
              <div className="w-8 h-8 bg-green-700 text-white flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ borderRadius: 4 }}>
                {step.num}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">{step.title}</p>
                <p className="text-gray-400 text-xs mt-0.5">{step.desc}</p>
              </div>
              <span className="text-xl">{step.icon}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-8 space-y-3">
          <Link href="/login"
            className="block w-full bg-green-700 hover:bg-green-800 text-white font-bold py-5 text-lg text-center transition-colors"
            style={{ borderRadius: 4 }}>
            Apply for Loan →
          </Link>

          {/* Trust line */}
          <div className="flex justify-center gap-6 pt-2">
            {[
              { icon: '🔒', label: 'Secure' },
              { icon: '🇮🇳', label: 'RBI Compliant' },
              { icon: '⚡', label: 'Instant Decision' },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-1.5 text-xs text-gray-400">
                <span>{b.icon}</span>
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-6 py-4 text-center">
        <p className="text-xs text-gray-400">© 2025 CrediTrust Bank. All rights reserved.</p>
      </div>
    </main>
  )
}