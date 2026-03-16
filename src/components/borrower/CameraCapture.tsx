'use client'
import { useRef, useState, useCallback } from 'react'

interface CaptureStep {
  id: string
  instruction: string
  icon: string
}

interface Props {
  steps: CaptureStep[]
  onComplete: (photos: CapturedPhoto[]) => void
}

export interface CapturedPhoto {
  stepId: string
  dataUrl: string
  gpsLat: number | null
  gpsLng: number | null
  capturedAt: string
  fraudFlags: string[]
}

export default function CameraCapture({ steps, onComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [photos, setPhotos] = useState<CapturedPhoto[]>([])
  const [cameraActive, setCameraActive] = useState(false)
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'getting' | 'got' | 'failed'>('idle')
  const [currentGPS, setCurrentGPS] = useState<{ lat: number; lng: number } | null>(null)
  const [sessionStartTime] = useState(Date.now())

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
    const sessionAge = Date.now() - sessionStartTime
    
    // If photos taken too fast (less than 3 seconds between)
    if (photos.length > 0) {
      const lastPhoto = photos[photos.length - 1]
      const timeDiff = new Date(capturedAt).getTime() - new Date(lastPhoto.capturedAt).getTime()
      if (timeDiff < 3000) flags.push('Photos taken too quickly')
    }

    // GPS missing
    if (gpsStatus !== 'got') flags.push('GPS location unavailable')

    return flags
  }

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)

    // Timestamp watermark
    const capturedAt = new Date().toISOString()
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40)
    ctx.fillStyle = 'white'
    ctx.font = '14px monospace'
    ctx.fillText(
      `${new Date().toLocaleString('en-IN')} | ${currentGPS ? `${currentGPS.lat.toFixed(4)}, ${currentGPS.lng.toFixed(4)}` : 'GPS unavailable'}`,
      10, canvas.height - 14
    )

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    const fraudFlags = detectFraudFlags(capturedAt)

    const photo: CapturedPhoto = {
      stepId: steps[currentStep].id,
      dataUrl,
      gpsLat: currentGPS?.lat ?? null,
      gpsLng: currentGPS?.lng ?? null,
      capturedAt,
      fraudFlags,
    }

    const newPhotos = [...photos, photo]
    setPhotos(newPhotos)

    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1)
    } else {
      // Stop camera
      const stream = videoRef.current?.srcObject as MediaStream
      stream?.getTracks().forEach(t => t.stop())
      setCameraActive(false)
      onComplete(newPhotos)
    }
  }, [currentStep, photos, steps, currentGPS, gpsStatus])

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex gap-2">
        {steps.map((_, i) => (
          <div key={i}
            className={`h-2 flex-1 rounded-full transition-colors
              ${i < photos.length ? 'bg-green-500' :
                i === currentStep ? 'bg-blue-500' : 'bg-slate-700'}`}
          />
        ))}
      </div>

      {/* Current instruction */}
      <div className="bg-slate-800 rounded-xl p-4 text-center">
        <div className="text-3xl mb-2">{steps[currentStep]?.icon}</div>
        <p className="font-semibold">{steps[currentStep]?.instruction}</p>
        <p className="text-slate-400 text-sm mt-1">
          Photo {currentStep + 1} of {steps.length}
        </p>
      </div>

      {/* GPS Status */}
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm
        ${gpsStatus === 'got' ? 'bg-green-950 text-green-400' :
          gpsStatus === 'failed' ? 'bg-red-950 text-red-400' :
          'bg-slate-800 text-slate-400'}`}>
        <span>{gpsStatus === 'got' ? '📍' : gpsStatus === 'failed' ? '⚠️' : '🔄'}</span>
        <span>
          {gpsStatus === 'got' ? `GPS: ${currentGPS?.lat.toFixed(4)}, ${currentGPS?.lng.toFixed(4)}`
            : gpsStatus === 'failed' ? 'GPS unavailable — fraud flag will be raised'
            : gpsStatus === 'getting' ? 'Getting location...'
            : 'GPS not started'}
        </span>
      </div>

      {/* Camera view */}
      <div className={cameraActive ? "relative rounded-xl overflow-hidden bg-black" : "hidden"}>
        <video ref={videoRef} autoPlay playsInline
          className="w-full rounded-xl" />
        <button onClick={capturePhoto}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 
            w-16 h-16 bg-white rounded-full border-4 border-blue-500 
            hover:scale-95 transition shadow-lg" />
        <div className="absolute top-4 right-4 bg-red-500 text-white 
          text-xs px-2 py-1 rounded-full animate-pulse">
          LIVE
        </div>
      </div>

      {!cameraActive && (
        <button onClick={startCamera}
          className="w-full bg-blue-600 hover:bg-blue-700 py-6 rounded-xl 
            font-semibold text-lg transition flex items-center justify-center gap-3">
          <span>📷</span> Start Camera
        </button>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {/* Captured photos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, i) => (
            <div key={i} className="relative">
              <img src={photo.dataUrl} alt={`Photo ${i + 1}`}
                className="w-full aspect-square object-cover rounded-lg" />
              {photo.fraudFlags.length > 0 && (
                <div className="absolute top-1 right-1 bg-red-500 
                  text-white text-xs rounded-full w-5 h-5 
                  flex items-center justify-center">
                  !
                </div>
              )}
              <div className="absolute bottom-1 left-1 bg-green-500 
                text-white text-xs rounded-full w-5 h-5 
                flex items-center justify-center">
                ✓
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}