import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { type, data } = await req.json()

  let prompt = ''

  if (type === 'score_explanation') {
    prompt = `
You are a helpful loan advisor. A borrower received a credit score of ${data.score}/900 
(Risk: ${data.riskBand}).

Score breakdown:
- Payment History: ${data.breakdown.paymentHistory?.toFixed(0)}/100 (weight: 35%)
- Collateral Strength: ${data.breakdown.collateral?.toFixed(0)}/100 (weight: 25%)
- Income Stability: ${data.breakdown.incomeStability?.toFixed(0)}/100 (weight: 20%)
- Debt-to-Income: ${data.breakdown.debtToIncome?.toFixed(0)}/100 (weight: 10%)
- Behavioral Score: ${data.breakdown.behavioral?.toFixed(0)}/100 (weight: 10%)
Loan requested: ₹${data.loanAmount?.toLocaleString('en-IN')}

In 3 short paragraphs:
1. Explain what this score means for them simply
2. What is their strongest and weakest factor
3. Two specific things they can do to improve their score

Be warm, direct, and helpful. No jargon.
    `
  }

  if (type === 'full_report') {
    prompt = `
Generate a formal collateral assessment report for a loan application.

Borrower: ${data.borrowerName}
Loan Amount: ₹${data.loanAmount?.toLocaleString('en-IN')}
Purpose: ${data.loanPurpose}
Credit Score: ${data.score}/900
Risk Band: ${data.riskBand}

Asset Details:
- Type: ${data.assetType}
- Condition: ${data.condition}
- Estimated Value: ₹${data.assetValue?.toLocaleString('en-IN')}
- Location: ${data.location}

Credit Profile:
- Monthly Income: ₹${data.monthlyIncome?.toLocaleString('en-IN')}
- Existing EMI: ₹${data.existingEMI?.toLocaleString('en-IN')}
- Collateral-to-Loan Ratio: ${data.collateralRatio}%

Fraud Flags: ${data.fraudFlags?.length > 0 ? data.fraudFlags.join(', ') : 'None'}

Write a structured report with these sections:
1. Executive Summary
2. Asset Assessment
3. Credit Analysis  
4. Risk Factors
5. Recommendation (Approve / Reject / Conditional)

Be formal and concise. Use ₹ for currency.
    `
  }

  if (type === 'chat') {
    prompt = data.message
  }

  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  })

  return NextResponse.json({
    message: message.content[0].type === 'text'
      ? message.content[0].text
      : ''
  })
}