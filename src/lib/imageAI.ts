import * as tf from '@tensorflow/tfjs'
import * as mobilenet from '@tensorflow-models/mobilenet'

let model: mobilenet.MobileNet | null = null

// Load model once and cache it
export async function loadModel() {
  if (model) return model
  await tf.ready()
  model = await mobilenet.load({
    version: 2,
    alpha: 0.5  // smaller = faster, less accurate but fine for demo
  })
  return model
}

// Asset type mapping — MobileNet labels → our categories
const VEHICLE_KEYWORDS = [
  'car', 'vehicle', 'automobile', 'truck', 'van',
  'cab', 'taxi', 'jeep', 'minivan', 'convertible',
  'sports car', 'race car', 'motor scooter', 'motorcycle'
]

const PROPERTY_KEYWORDS = [
  'building', 'house', 'home', 'apartment', 'residence',
  'shop', 'store', 'office', 'door', 'window', 'wall',
  'architecture', 'construction', 'facade'
]

const MACHINERY_KEYWORDS = [
  'machine', 'engine', 'motor', 'tractor', 'crane',
  'excavator', 'forklift', 'equipment', 'tool',
  'generator', 'pump', 'drill'
]

const LAND_KEYWORDS = [
  'field', 'farm', 'land', 'soil', 'grass', 'crop',
  'agriculture', 'pasture', 'meadow', 'plot', 'terrain'
]

export interface AIVerificationResult {
  detectedType: string        // what AI thinks it is
  expectedType: string        // what user said it is
  confidence: number          // 0-100
  isMatch: boolean            // detected matches expected
  topLabels: string[]         // top 3 predictions
  fraudFlag: string | null    // flag if mismatch
  conditionHint: string       // rough condition estimate
}

export async function verifyAssetPhoto(
  imageElement: HTMLImageElement | HTMLCanvasElement,
  expectedAssetType: string
): Promise<AIVerificationResult> {
  const net = await loadModel()
  const predictions = await net.classify(imageElement, 5)

  const topLabels = predictions.map(p =>
    `${p.className.split(',')[0]} (${Math.round(p.probability * 100)}%)`
  )

  const allLabels = predictions
    .map(p => p.className.toLowerCase())
    .join(' ')

  // Detect what type the AI thinks it is
  let detectedType = 'unknown'
  if (VEHICLE_KEYWORDS.some(k => allLabels.includes(k))) detectedType = 'vehicle'
  else if (PROPERTY_KEYWORDS.some(k => allLabels.includes(k))) detectedType = 'property'
  else if (MACHINERY_KEYWORDS.some(k => allLabels.includes(k))) detectedType = 'machinery'
  else if (LAND_KEYWORDS.some(k => allLabels.includes(k))) detectedType = 'land'

  const confidence = Math.round((predictions[0]?.probability || 0) * 100)
  const isMatch = detectedType === expectedAssetType || detectedType === 'unknown'

  // Condition hint based on confidence
  const conditionHint =
    confidence > 70 ? 'Asset clearly visible — good photo quality' :
    confidence > 40 ? 'Asset partially visible — acceptable quality' :
    'Asset unclear — may affect assessment accuracy'

  const fraudFlag = (!isMatch && detectedType !== 'unknown')
    ? `AI detected ${detectedType} but ${expectedAssetType} was declared`
    : null

  return {
    detectedType,
    expectedType: expectedAssetType,
    confidence,
    isMatch,
    topLabels,
    fraudFlag,
    conditionHint,
  }
}

// Blur detection — blurry photos = low quality = flag
export function detectBlur(canvas: HTMLCanvasElement): {
  isBlurry: boolean
  score: number
} {
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = imageData.data

  // Laplacian variance — standard blur detection algorithm
  let sum = 0
  let sumSq = 0
  const count = pixels.length / 4

  for (let i = 0; i < pixels.length; i += 4) {
    const gray = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]
    sum += gray
    sumSq += gray * gray
  }

  const mean = sum / count
  const variance = sumSq / count - mean * mean
  const score = Math.round(variance)

  return {
    isBlurry: variance < 100,  // threshold — tune as needed
    score,
  }
}

// Darkness detection — too dark = invalid photo
export function detectDarkness(canvas: HTMLCanvasElement): {
  isDark: boolean
  brightness: number
} {
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = imageData.data

  let totalBrightness = 0
  const count = pixels.length / 4

  for (let i = 0; i < pixels.length; i += 4) {
    totalBrightness += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3
  }

  const brightness = Math.round(totalBrightness / count)

  return {
    isDark: brightness < 50,  // 0-255 scale
    brightness,
  }
}