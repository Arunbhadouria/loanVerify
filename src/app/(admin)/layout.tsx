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
    { href: '/admin/dashboard', icon: '📋', label: 'Applications' },
    { href: '/admin/analytics', icon: '📊', label: 'Analytics' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top navbar */}
      <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏦</span>
              <span className="font-bold text-lg">LoanVerify</span>
              <span className="text-slate-600 text-sm ml-2">Admin</span>
            </div>
            <div className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm 
                    font-medium transition
                    ${pathname === item.href
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{adminName}</p>
              <p className="text-slate-400 text-xs">{adminRole}</p>
            </div>
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center 
              justify-center text-sm font-bold">
              {adminName.charAt(0)}
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('admin_logged_in')
                router.push('/admin/login')
              }}
              className="text-slate-400 hover:text-white text-sm transition">
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