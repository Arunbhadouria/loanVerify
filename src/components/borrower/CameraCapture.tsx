'use client'
import { useRef, useState, useCallback } from 'react'
import { verifyAssetPhoto, detectBlur, detectDarkness, AIVerificationResult } from '@/lib/imageAI'

interface CaptureStep {
  id: string
  instruction: string
  icon: string
}

interface Props {
  steps: CaptureStep[]
  onComplete: (photos: CapturedPhoto[]) => void
  assetType: string
}

export interface CapturedPhoto {
  stepId: string
  dataUrl: string
  gpsLat: number | null
  gpsLng: number | null
  capturedAt: string
  fraudFlags: string[]
}

export default function CameraCapture({ steps, onComplete, assetType }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [photos, setPhotos] = useState<CapturedPhoto[]>([])
  const [cameraActive, setCameraActive] = useState(false)
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'getting' | 'got' | 'failed'>('idle')
  const [currentGPS, setCurrentGPS] = useState<{ lat: number; lng: number } | null>(null)
  const [sessionStartTime] = useState(Date.now())
  const [aiResults, setAiResults] = useState<Record<string, AIVerificationResult>>({})
  const [verifying, setVerifying] = useState(false)
  const [modelLoading, setModelLoading] = useState(false)

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
      }
      getGPS()
    } catch (err) {
      alert('Camera access denied. Please allow camera permission.')
      console.error('Camera error:', err)
      return
    }

    try {
      setModelLoading(true)
      const { loadModel } = await import('@/lib/imageAI')
      await loadModel()
    } catch (err) {
      console.error('AI model loading error:', err)
      alert('Note: AI verification model failed to load. You can still capture photos, but AI verification will be skipped.')
    } finally {
      setModelLoading(false)
    }
  }

  function getGPS() {
    setGpsStatus('getting')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentGPS({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGpsStatus('got')
      },
      () => setGpsStatus('failed'),
      { timeout: 10000 }
    )
  }

  function detectFraudFlags(capturedAt: string): string[] {
    const flags: string[] = []

    if (photos.length > 0) {
      const lastPhoto = photos[photos.length - 1]
      const timeDiff = new Date(capturedAt).getTime() - new Date(lastPhoto.capturedAt).getTime()
      if (timeDiff < 3000) flags.push('Photos taken too quickly')
    }

    if (gpsStatus !== 'got') flags.push('GPS location unavailable')

    return flags
  }

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return
    setVerifying(true)

    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)

    const capturedAt = new Date().toISOString()

    // Timestamp watermark
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40)
    ctx.fillStyle = 'white'
    ctx.font = '14px monospace'
    ctx.fillText(
      `${new Date().toLocaleString('en-IN')} | ${currentGPS
        ? `${currentGPS.lat.toFixed(4)}, ${currentGPS.lng.toFixed(4)}`
        : 'GPS unavailable'}`,
      10, canvas.height - 14
    )

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    const fraudFlags = detectFraudFlags(capturedAt)

    const { isBlurry, score: blurScore } = detectBlur(canvas)
    if (isBlurry) fraudFlags.push(`Photo too blurry (score: ${blurScore})`)

    const { isDark, brightness } = detectDarkness(canvas)
    if (isDark) fraudFlags.push(`Photo too dark (brightness: ${brightness}/255)`)

    try {
      const img = new Image()
      img.src = dataUrl
      await new Promise(r => { img.onload = r })
      const aiResult = await verifyAssetPhoto(img, assetType)

      if (aiResult.fraudFlag) fraudFlags.push(aiResult.fraudFlag)

      setAiResults(prev => ({
        ...prev,
        [steps[currentStep].id]: aiResult
      }))
    } catch (e) {
      console.error('AI verification failed:', e)
    }

    const photo: CapturedPhoto = {
      stepId: steps[currentStep].id,
      dataUrl,
      gpsLat: currentGPS?.lat ?? null,
      gpsLng: currentGPS?.lng ?? null,
      capturedAt,
      fraudFlags,
    }

    setVerifying(false)
    const newPhotos = [...photos, photo]
    setPhotos(newPhotos)

    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1)
    } else {
      const stream = videoRef.current?.srcObject as MediaStream
      stream?.getTracks().forEach(t => t.stop())
      setCameraActive(false)
      onComplete(newPhotos)
    }
  }, [currentStep, photos, steps, currentGPS, gpsStatus, assetType])

  return (
    <div className="space-y-4">

      {/* Step progress indicator */}
      <div className="flex gap-1.5">
        {steps.map((_, i) => (
          <div key={i}
            className="h-1.5 flex-1 transition-colors"
            style={{
              borderRadius: 2,
              background: i < photos.length ? '#15803d' : i === currentStep ? '#16a34a' : '#e5e7eb'
            }}
          />
        ))}
      </div>

      {/* Current instruction */}
      <div className="bg-gray-50 border border-gray-200 p-4 text-center" style={{ borderRadius: 6 }}>
        <div className="text-3xl mb-2">{steps[currentStep]?.icon}</div>
        <p className="font-semibold text-gray-900">{steps[currentStep]?.instruction}</p>
        <p className="text-gray-400 text-sm mt-1">Photo {currentStep + 1} of {steps.length}</p>
      </div>

      {/* GPS Status */}
      <div className={`flex items-center gap-2 px-4 py-2 text-sm border ${
        gpsStatus === 'got'
          ? 'bg-green-50 border-green-200 text-green-800'
          : gpsStatus === 'failed'
          ? 'bg-red-50 border-red-200 text-red-700'
          : 'bg-gray-50 border-gray-200 text-gray-500'
      }`} style={{ borderRadius: 4 }}>
        <span>
          {gpsStatus === 'got' ? '📍' : gpsStatus === 'failed' ? '⚠️' : '🔄'}
        </span>
        <span>
          {gpsStatus === 'got'
            ? `GPS: ${currentGPS?.lat.toFixed(4)}, ${currentGPS?.lng.toFixed(4)}`
            : gpsStatus === 'failed' ? 'GPS unavailable — fraud flag will be raised'
            : gpsStatus === 'getting' ? 'Getting location...'
            : 'GPS not started'}
        </span>
      </div>

      {/* Model loading */}
      {modelLoading && (
        <div className="bg-green-50 border border-green-200 px-4 py-3 flex items-center gap-2" style={{ borderRadius: 4 }}>
          <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-green-800 text-sm">Loading AI verification model...</p>
        </div>
      )}

      {/* Verifying */}
      {verifying && (
        <div className="bg-gray-50 border border-gray-200 px-4 py-3 flex items-center gap-2" style={{ borderRadius: 4 }}>
          <div className="w-4 h-4 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 text-sm">Running AI verification...</p>
        </div>
      )}

      {/* Camera view */}
      <div className={`relative overflow-hidden bg-black ${cameraActive ? 'block' : 'hidden'}`} style={{ borderRadius: 6 }}>
        <video ref={videoRef} autoPlay playsInline className="w-full" />
        <button
          onClick={capturePhoto}
          disabled={verifying}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full border-4 border-green-700 hover:scale-95 disabled:opacity-50 transition shadow-lg"
        />
        <div className="absolute top-4 right-4 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
          LIVE
        </div>
      </div>

      {/* Start Camera button */}
      {!cameraActive && photos.length === 0 && !modelLoading && (
        <button
          onClick={startCamera}
          className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-5 text-base transition-colors flex items-center justify-center gap-3"
          style={{ borderRadius: 4 }}
        >
          <span>📷</span> Start Camera
        </button>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {/* Captured photos thumbnail grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, i) => (
            <div key={i} className="relative">
              <img src={photo.dataUrl} alt={`Photo ${i + 1}`}
                className="w-full aspect-square object-cover" style={{ borderRadius: 4 }} />
              {photo.fraudFlags.length > 0 && (
                <div className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  !
                </div>
              )}
              <div className="absolute bottom-1 left-1 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                ✓
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Verification Results */}
      {Object.keys(aiResults).length > 0 && (
        <div className="space-y-2">
          <p className="text-gray-500 text-xs uppercase tracking-wide font-semibold">🤖 AI Verification Results</p>
          {Object.entries(aiResults).map(([stepId, result]) => (
            <div key={stepId}
              className={`p-3 border text-sm ${
                result.isMatch
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
              style={{ borderRadius: 4 }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`font-semibold text-sm ${result.isMatch ? 'text-green-700' : 'text-red-700'}`}>
                  {result.isMatch ? '✅ Verified' : '⚠️ Mismatch'} — {stepId}
                </span>
                <span className="text-gray-400 text-xs">{result.confidence}% confident</span>
              </div>
              <p className="text-gray-500 text-xs">{result.conditionHint}</p>
              {result.fraudFlag && (
                <p className="text-red-600 text-xs mt-1">🚩 {result.fraudFlag}</p>
              )}
              <p className="text-gray-400 text-xs mt-1">Detected: {result.topLabels[0]}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}