/**
 * Server-side in-memory OTP store.
 * Codes expire after 10 minutes and are single-use.
 * Works with any identifier (phone number or email address).
 */

interface OTPRecord {
  code: string
  expiresAt: number
  attempts: number
}

const store = new Map<string, OTPRecord>()
const OTP_TTL_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 5

/** Fixed demo OTP for phone-based verification */
export const DEMO_OTP = '123456'

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function saveOTP(identifier: string, code: string) {
  store.set(identifier, { code, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 })
}

export type VerifyResult = 'ok' | 'expired' | 'wrong' | 'too_many_attempts'

export function verifyOTP(identifier: string, code: string): VerifyResult {
  const record = store.get(identifier)
  if (!record) return 'expired'
  if (Date.now() > record.expiresAt) { store.delete(identifier); return 'expired' }
  if (record.attempts >= MAX_ATTEMPTS) return 'too_many_attempts'
  record.attempts++
  if (record.code !== code) return 'wrong'
  store.delete(identifier)
  return 'ok'
}
