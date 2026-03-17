import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendOTPEmail(to: string, code: string) {
  await transporter.sendMail({
    from: `"CrediTrust Bank" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Your CrediTrust Verification Code',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background: #15803d; color: #fff; font-size: 24px; font-weight: bold; width: 48px; height: 48px; line-height: 48px; border-radius: 4px; font-family: 'Playfair Display', serif;">C</div>
          <h2 style="margin: 12px 0 4px; color: #111827; font-family: 'Playfair Display', serif;">CrediTrust Bank</h2>
          <p style="color: #6b7280; font-size: 14px; margin: 0;">Secure Loan Portal</p>
        </div>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">Your one-time verification code is:</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="display: inline-block; background: #f0fdf4; border: 2px solid #86efac; padding: 16px 32px; font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #15803d; border-radius: 8px; font-family: monospace;">${code}</span>
        </div>
        <p style="color: #6b7280; font-size: 13px; line-height: 1.5;">This code will expire in <strong>10 minutes</strong>. Do not share this code with anyone.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  })
}
