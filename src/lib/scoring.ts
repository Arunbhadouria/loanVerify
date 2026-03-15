export interface ScoringInput {
  paymentHistory: number      // 0-100
  collateralValue: number     // asset value
  loanAmount: number          // requested amount
  monthlyIncome: number
  existingEMI: number
  avgBankBalance: number
  behavioralScore: number     // 0-100
}

export function calculateCreditScore(input: ScoringInput): {
  score: number
  band: 'low' | 'medium' | 'high'
  breakdown: Record<string, number>
} {
  const weights = {
    paymentHistory: 0.35,
    collateral: 0.25,
    incomeStability: 0.20,
    debtToIncome: 0.10,
    behavioral: 0.10,
  }

  // Collateral-to-loan ratio score
  const collateralRatio = Math.min(
    (input.collateralValue / input.loanAmount) * 100, 100
  )

  // Income stability score
  const incomeScore = Math.min(
    (input.avgBankBalance / input.monthlyIncome) * 50, 100
  )

  // Debt-to-income score (lower EMI/income = better)
  const dtiRatio = input.existingEMI / input.monthlyIncome
  const dtiScore = Math.max(0, 100 - dtiRatio * 200)

  const breakdown = {
    paymentHistory: input.paymentHistory,
    collateral: collateralRatio,
    incomeStability: incomeScore,
    debtToIncome: dtiScore,
    behavioral: input.behavioralScore,
  }

  // Weighted score mapped to 300-900 range
  const rawScore =
    breakdown.paymentHistory * weights.paymentHistory +
    breakdown.collateral * weights.collateral +
    breakdown.incomeStability * weights.incomeStability +
    breakdown.debtToIncome * weights.debtToIncome +
    breakdown.behavioral * weights.behavioral

  const score = Math.round(300 + (rawScore / 100) * 600)

  const band =
    score >= 700 ? 'low' :
    score >= 500 ? 'medium' : 'high'

  return { score, band, breakdown }
}