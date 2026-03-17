import { NextRequest, NextResponse } from 'next/server'
import { generateOTP, saveOTP, DEMO_OTP } from '@/lib/otp'
import { sendOTPEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { method, phone, email } = await req.json()

    /* ── Phone path (demo) ─────────────────────────────────── */
    if (method === 'phone') {
      if (!phone || !/^\d{10}$/.test(phone)) {
        return NextResponse.json({ error: 'Please enter a valid 10-digit mobile number.' }, { status: 400 })
      }

      // Store the fixed demo OTP so verify still works through the normal flow
      saveOTP(phone, DEMO_OTP)

      console.log(`[OTP] Demo code stored for phone ${phone}: ${DEMO_OTP}`)
      return NextResponse.json({ success: true, demo: true })
    }

    /* ── Email path (real) ─────────────────────────────────── */
    if (method === 'email') {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
      }

      const code = generateOTP()
      saveOTP(email, code)

      try {
        await sendOTPEmail(email, code)
      } catch (emailErr) {
        console.error('Email send error:', emailErr)
        return NextResponse.json({ error: 'Failed to send verification email. Please try again.' }, { status: 502 })
      }

      console.log(`[OTP] Code sent to email ${email}`)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid verification method.' }, { status: 400 })
  } catch (err) {
    console.error('OTP send error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
