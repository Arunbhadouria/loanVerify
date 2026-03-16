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

  const inputClass = `w-full bg-slate-800 border border-slate-700 rounded-xl 
    px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500`

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-8">
      <div className="max-w-md mx-auto space-y-6">

        {/* Intro */}
        {phase === 'intro' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="text-5xl">📸</div>
              <h2 className="text-2xl font-bold">Asset Inspection</h2>
              <p className="text-slate-400 text-sm">
                We need a few photos of your {assetType} to assess its value.
                This replaces a physical field visit.
              </p>
            </div>

            <div className="bg-slate-900 rounded-2xl p-5 space-y-3">
              <p className="font-semibold text-sm">What to expect:</p>
              {photoSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xl">{step.icon}</span>
                  <span className="text-slate-300 text-sm">{step.instruction}</span>
                </div>
              ))}
            </div>

            <div className="bg-amber-950 border border-amber-800 rounded-xl p-4">
              <p className="text-amber-300 text-sm">
                ⚠️ <strong>Important:</strong> Photos are GPS-tagged and timestamped.
                Submitting fake or old photos will flag your application for fraud.
              </p>
            </div>

            <button onClick={() => setPhase('details')}
              className="w-full bg-blue-600 hover:bg-blue-700 py-4 
                rounded-xl font-semibold transition">
              Start Inspection →
            </button>
          </div>
        )}

        {/* Asset details */}
        {phase === 'details' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Asset Details</h2>
              <p className="text-slate-400 text-sm mt-1">Tell us about your {assetType}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-slate-400 text-xs uppercase tracking-wide">
                  Description
                </label>
                <input className={inputClass}
                  placeholder={assetType === 'vehicle' ? 'e.g. 2019 Maruti Swift Dzire White' : 'Describe the asset'}
                  value={assetDetails.description}
                  onChange={e => setAssetDetails(p => ({ ...p, description: e.target.value }))} />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 text-xs uppercase tracking-wide">
                  Your Estimated Value (₹)
                </label>
                <input type="number" className={inputClass} placeholder="350000"
                  value={assetDetails.estimated_value}
                  onChange={e => setAssetDetails(p => ({ ...p, estimated_value: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 text-xs uppercase tracking-wide">
                  Current Condition
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'excellent', label: '⭐ Excellent', desc: 'Like new' },
                    { value: 'good', label: '✅ Good', desc: 'Minor wear' },
                    { value: 'fair', label: '🔶 Fair', desc: 'Visible wear' },
                    { value: 'poor', label: '⚠️ Poor', desc: 'Needs repair' },
                  ].map(c => (
                    <button key={c.value}
                      onClick={() => setAssetDetails(p => ({ ...p, condition: c.value }))}
                      className={`p-3 rounded-xl border-2 text-left transition
                        ${assetDetails.condition === c.value
                          ? 'border-blue-500 bg-blue-950'
                          : 'border-slate-700 bg-slate-800'}`}>
                      <p className="font-medium text-sm">{c.label}</p>
                      <p className="text-slate-400 text-xs">{c.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setPhase('intro')}
                className="flex-1 bg-slate-800 hover:bg-slate-700 py-4 rounded-xl transition">
                ← Back
              </button>
              <button
                onClick={() => setPhase('camera')}
                disabled={!assetDetails.description || !assetDetails.estimated_value || !assetDetails.condition}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 
                  py-4 rounded-xl font-semibold transition">
                Take Photos →
              </button>
            </div>
          </div>
        )}

        {/* Camera phase */}
        {phase === 'camera' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">Photo Capture</h2>
              <p className="text-slate-400 text-sm mt-1">
                Follow each instruction carefully
              </p>
            </div>
            <CameraCapture
              steps={photoSteps}
              onComplete={handlePhotosComplete}
              assetType={assetType}   // add this
            />
          </div>
        )}

        {/* Done */}
        {phase === 'done' && (
          <div className="space-y-6 text-center">
            <div className="text-6xl">✅</div>
            <div>
              <h2 className="text-2xl font-bold">Inspection Complete!</h2>
              <p className="text-slate-400 mt-2">
                {photos.length} photos captured with GPS verification
              </p>
            </div>

            {/* Fraud summary */}
            {photos.some(p => p.fraudFlags.length > 0) ? (
              <div className="bg-red-950 border border-red-800 rounded-xl p-4 text-left">
                <p className="text-red-400 font-semibold text-sm mb-2">⚠️ Fraud Flags Detected</p>
                {photos.filter(p => p.fraudFlags.length > 0).map((p, i) => (
                  <p key={i} className="text-red-300 text-xs">• {p.fraudFlags.join(', ')}</p>
                ))}
                <p className="text-red-400 text-xs mt-2">
                  These will be visible to the bank officer.
                </p>
              </div>
            ) : (
              <div className="bg-green-950 border border-green-800 rounded-xl p-4">
                <p className="text-green-400 text-sm">✅ All photos verified — no fraud flags</p>
              </div>
            )}

            {/* Photo grid */}
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, i) => (
                <img key={i} src={photo.dataUrl} alt={`Photo ${i + 1}`}
                  className="w-full aspect-square object-cover rounded-lg" />
              ))}
            </div>

            <button onClick={() => router.push('/score')}
              className="w-full bg-green-600 hover:bg-green-700 py-4 
                rounded-xl font-semibold transition text-lg">
              Calculate My Score →
            </button>
          </div>
        )}
      </div>
    </main>
  )
}