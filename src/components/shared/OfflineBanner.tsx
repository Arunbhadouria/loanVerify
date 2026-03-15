'use client'
import { useEffect, useState } from 'react'

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)
  const [showSaved, setShowSaved] = useState(false)

  useEffect(() => {
    function handleOffline() {
      setIsOffline(true)
      setShowSaved(true)
      setTimeout(() => setShowSaved(false), 3000)
    }
    function handleOnline() {
      setIsOffline(false)
    }

    setIsOffline(!navigator.onLine)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!isOffline && !showSaved) return null

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 text-center text-sm
      font-medium flex items-center justify-center gap-2 transition-all
      ${isOffline
        ? 'bg-amber-500 text-amber-950'
        : 'bg-green-500 text-green-950'}`}>
      {isOffline ? (
        <>
          <span>📴</span>
          <span>You're offline — data is saved locally and will sync when reconnected</span>
        </>
      ) : (
        <>
          <span>✅</span>
          <span>Back online — syncing your data...</span>
        </>
      )}
    </div>
  )
}