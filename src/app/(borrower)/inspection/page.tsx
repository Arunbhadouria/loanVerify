'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CameraCapture, { CapturedPhoto } from '@/components/borrower/CameraCapture'

const PHOTO_STEPS = {
  vehicle: [
    { id: 'front', instruction: 'Take a photo of the FRONT of the vehicle', icon: '🚗' },
    { id: 'rear', instruction: 'Take a photo of the REAR of the vehicle', icon: '🔙' },
    { id: 'left', instruction: 'Take a photo of the LEFT SIDE', icon: '◀️' },
    { id: 'right', instruction: 'Take a photo of the RIGHT SIDE', icon: '▶️' },
    { id: 'odometer', instruction: 'Take a photo of the ODOMETER / DASHBOARD', icon: '⏱️' },
  ],
  property: [
    { id: 'front', instruction: 'Take a photo of the FRONT of the property', icon: '🏠' },
    { id: 'interior', instruction: 'Take a photo of the MAIN INTERIOR', icon: '🛋️' },
    { id: 'exterior_left', instruction: 'Take a photo of the LEFT EXTERIOR', icon: '◀️' },
    { id: 'document', instruction: 'Take a photo of the PROPERTY DOCUMENT', icon: '📄' },
  ],
  machinery: [
    { id: 'front', instruction: 'Take a photo of the FRONT of the machine', icon: '⚙️' },
    { id: 'brand', instruction: 'Take a photo of the BRAND / MODEL PLATE', icon: '🏷️' },
    { id: 'condition', instruction: 'Take a photo showing overall CONDITION', icon: '🔍' },
  ],
  land: [
    { id: 'wide', instruction: 'Take a WIDE SHOT of the land', icon: '🌾' },
    { id: 'boundary', instruction: 'Take a photo of the BOUNDARY MARKER', icon: '📍' },
    { id: 'document', instruction: 'Take a photo of the LAND DOCUMENT', icon: '📄' },
  ],
}

export default function InspectionPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<'intro' | 'details' | 'camera' | 'done'>('intro')
  const [assetDetails, setAssetDetails] = useState({
    description: '',
    estimated_value: '',
    condition: '',
  })
  const [photos, setPhotos] = useState<CapturedPhoto[]>([])

  const onboardingData = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('onboarding_data') || '{}')
    : {}

  const assetType = onboardingData.asset_type || 'vehicle'
  const photoSteps = PHOTO_STEPS[assetType as keyof typeof PHOTO_STEPS] || PHOTO_STEPS.vehicle

  function handlePhotosComplete(capturedPhotos: CapturedPhoto[]) {
    setPhotos(capturedPhotos)
    localStorage.setItem('inspection_photos', JSON.stringify(capturedPhotos))
    localStorage.setItem('asset_details', JSON.stringify(assetDetails))
    setPhase('done')
  }

  const inputClass = `w-full border border-gray-300 px-4 py-4 text-gray-900 text-base focus:outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100 transition-colors bg-white`
  const labelClass = 'block text-sm font-semibold text-gray-700 mb-2'

  return (
    <main className="min-h-screen bg-white">
      {/* Bank Header */}
      <div className="bg-green-700 px-6 py-4">
        <p className="text-white font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>CrediTrust Bank</p>
        <p className="text-green-200 text-xs">Asset Inspection</p>
      </div>

      <div className="max-w-md mx-auto px-6 py-8 space-y-6 pb-32">

        {/* Intro */}
        {phase === 'intro' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="text-5xl">📸</div>
              <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                Asset Inspection
              </h1>
              <p className="text-gray-500 text-sm">
                We need a few photos of your {assetType} to assess its value.
                This replaces a physical field visit.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-5 space-y-3" style={{ borderRadius: 6 }}>
              <p className="font-semibold text-sm text-gray-700">What to expect:</p>
              {photoSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xl">{step.icon}</span>
                  <span className="text-gray-600 text-sm">{step.instruction}</span>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 px-4 py-3" style={{ borderRadius: 4 }}>
              <p className="text-amber-800 text-sm">
                ⚠️ <strong>Important:</strong> Photos are GPS-tagged and timestamped.
                Submitting fake or old photos will flag your application for fraud.
              </p>
            </div>

            <button
              onClick={() => setPhase('details')}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-4 text-base transition-colors"
              style={{ borderRadius: 4 }}
            >
              Start Inspection →
            </button>
          </div>
        )}

        {/* Asset details */}
        {phase === 'details' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                Asset Details
              </h2>
              <p className="text-gray-500 text-sm mt-1">Tell us about your {assetType}</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className={labelClass}>Description</label>
                <input
                  className={inputClass}
                  style={{ borderRadius: 4 }}
                  placeholder={assetType === 'vehicle' ? 'e.g. 2019 Maruti Swift Dzire White' : 'Describe the asset'}
                  value={assetDetails.description}
                  onChange={e => setAssetDetails(p => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div>
                <label className={labelClass}>Your Estimated Value</label>
                <div className="flex">
                  <span className="flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 text-gray-500 font-semibold text-sm" style={{ borderRadius: '4px 0 0 4px' }}>₹</span>
                  <input
                    type="number"
                    className="flex-1 border border-gray-300 px-4 py-4 text-gray-900 focus:outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
                    style={{ borderRadius: '0 4px 4px 0' }}
                    placeholder="350000"
                    value={assetDetails.estimated_value}
                    onChange={e => setAssetDetails(p => ({ ...p, estimated_value: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Current Condition</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'excellent', label: '⭐ Excellent', desc: 'Like new' },
                    { value: 'good', label: '✅ Good', desc: 'Minor wear' },
                    { value: 'fair', label: '🔶 Fair', desc: 'Visible wear' },
                    { value: 'poor', label: '⚠️ Poor', desc: 'Needs repair' },
                  ].map(c => (
                    <button
                      key={c.value}
                      onClick={() => setAssetDetails(p => ({ ...p, condition: c.value }))}
                      className={`p-4 border-2 text-left transition-all ${
                        assetDetails.condition === c.value
                          ? 'border-green-700 bg-green-50'
                          : 'border-gray-200 bg-white hover:border-green-300'
                      }`}
                      style={{ borderRadius: 4 }}
                    >
                      <p className="font-semibold text-sm text-gray-900">{c.label}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{c.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPhase('intro')}
                className="flex-1 bg-white border-2 border-gray-300 hover:border-green-700 text-gray-700 py-4 font-semibold text-base transition-colors"
                style={{ borderRadius: 4 }}
              >
                ← Back
              </button>
              <button
                onClick={() => setPhase('camera')}
                disabled={!assetDetails.description || !assetDetails.estimated_value || !assetDetails.condition}
                className="flex-1 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white py-4 font-bold text-base transition-colors"
                style={{ borderRadius: 4 }}
              >
                Take Photos →
              </button>
            </div>
          </div>
        )}

        {/* Camera phase */}
        {phase === 'camera' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                Photo Capture
              </h2>
              <p className="text-gray-500 text-sm mt-1">Follow each instruction carefully</p>
            </div>
            <CameraCapture
              steps={photoSteps}
              onComplete={handlePhotosComplete}
              assetType={assetType}
            />
          </div>
        )}

        {/* Done */}
        {phase === 'done' && (
          <div className="space-y-6 text-center">
            <div className="text-6xl">✅</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                Inspection Complete!
              </h2>
              <p className="text-gray-500 mt-2">{photos.length} photos captured with GPS verification</p>
            </div>

            {/* Fraud summary */}
            {photos.some(p => p.fraudFlags.length > 0) ? (
              <div className="bg-red-50 border border-red-200 p-4 text-left" style={{ borderRadius: 4 }}>
                <p className="text-red-700 font-semibold text-sm mb-2">⚠️ Fraud Flags Detected</p>
                {photos.filter(p => p.fraudFlags.length > 0).map((p, i) => (
                  <p key={i} className="text-red-600 text-xs">• {p.fraudFlags.join(', ')}</p>
                ))}
                <p className="text-red-500 text-xs mt-2">These will be visible to the bank officer.</p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 px-4 py-3" style={{ borderRadius: 4 }}>
                <p className="text-green-800 text-sm font-medium">✅ All photos verified — no fraud flags</p>
              </div>
            )}

            {/* Photo grid */}
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, i) => (
                <img
                  key={i}
                  src={photo.dataUrl}
                  alt={`Photo ${i + 1}`}
                  className="w-full aspect-square object-cover"
                  style={{ borderRadius: 4 }}
                />
              ))}
            </div>

            <button
              onClick={() => router.push('/score')}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-5 text-lg transition-colors"
              style={{ borderRadius: 4 }}
            >
              Calculate My Score →
            </button>
          </div>
        )}
      </div>
    </main>
  )
}