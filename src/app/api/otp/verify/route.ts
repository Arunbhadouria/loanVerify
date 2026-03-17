import { NextRequest, NextResponse } from 'next/server'
import { verifyOTP } from '@/lib/otp'

export async function POST(req: NextRequest) {
  try {
    const { method, phone, email, code } = await req.json()

    const identifier = method === 'email' ? email : phone

    if (!identifier || !code) {
      return NextResponse.json({ error: 'Identifier and OTP code are required.' }, { status: 400 })
    }

    const result = verifyOTP(identifier, code)

    if (result === 'ok') return NextResponse.json({ success: true })

    const messages: Record<string, string> = {
      expired:          'OTP has expired. Please request a new one.',
      wrong:            'Incorrect OTP. Please try again.',
      too_many_attempts:'Too many incorrect attempts. Please request a new OTP.',
    }

    return NextResponse.json({ success: false, error: messages[result] }, { status: 400 })
  } catch (err) {
    console.error('OTP verify error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
