'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [adminName, setAdminName] = useState('')
  const [adminRole, setAdminRole] = useState('')

  useEffect(() => {
    if (pathname === '/admin/login') return
    const isLoggedIn = localStorage.getItem('admin_logged_in')
    if (!isLoggedIn) router.push('/admin/login')
    setAdminName(localStorage.getItem('admin_name') || '')
    setAdminRole(localStorage.getItem('admin_role') || '')
  }, [pathname])

  if (pathname === '/admin/login') return <>{children}</>

  const navItems = [
    { href: '/admin/dashboard', label: 'Applications', icon: '📋' },
    { href: '/admin/analytics', label: 'Analytics', icon: '📊' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top accent bar */}
      <div className="h-1 bg-green-700 w-full" />

      {/* Top navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-0 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-stretch justify-between">
          {/* Logo */}
          <div className="flex items-center gap-4 py-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-700 flex items-center justify-center flex-shrink-0" style={{ borderRadius: 3 }}>
                <span className="text-white text-sm font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>CT</span>
              </div>
              <div>
                <span className="font-bold text-gray-900 text-base leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>CrediTrust</span>
                <span className="text-gray-400 text-xs ml-1.5">Admin</span>
              </div>
            </div>
          </div>

          {/* Nav links */}
          <div className="flex items-stretch gap-1">
            {navItems.map(item => (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-colors
                  ${pathname === item.href
                    ? 'border-green-700 text-green-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'}`}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* User info */}
          <div className="flex items-center gap-3 py-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 leading-none">{adminName}</p>
              <p className="text-gray-400 text-xs mt-0.5">{adminRole}</p>
            </div>
            <div className="w-9 h-9 bg-green-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ borderRadius: '50%' }}>
              {adminName.charAt(0)}
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('admin_logged_in')
                router.push('/admin/login')
              }}
              className="text-gray-400 hover:text-red-600 text-sm font-medium transition-colors px-2 py-1 border border-transparent hover:border-red-200 hover:bg-red-50"
              style={{ borderRadius: 4 }}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}