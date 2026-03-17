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

  // Collateral-to-loan ratio score — guard against zero loan amount
  const safeLoanAmount = Math.max(input.loanAmount, 1)
  const collateralRatio = Math.min(
    (input.collateralValue / safeLoanAmount) * 100, 100
  )

  // Income stability score — guard against zero income
  const safeIncome = Math.max(input.monthlyIncome, 1)
  const incomeScore = input.monthlyIncome === 0
    ? 0  // no income = zero score
    : Math.min((input.avgBankBalance / safeIncome) * 50, 100)

  // Debt-to-income score — guard against zero income
  const dtiRatio = input.monthlyIncome === 0
    ? 1  // treat as 100% debt ratio (worst case) if no income
    : input.existingEMI / safeIncome
  const dtiScore = Math.max(0, 100 - dtiRatio * 200)

  const breakdown = {
    paymentHistory: Math.min(Math.max(input.paymentHistory, 0), 100),
    collateral:     Math.min(Math.max(collateralRatio, 0), 100),
    incomeStability: Math.min(Math.max(incomeScore, 0), 100),
    debtToIncome:   Math.min(Math.max(dtiScore, 0), 100),
    behavioral:     Math.min(Math.max(input.behavioralScore, 0), 100),
  }

  // Weighted score mapped to 300-900 range
  const rawScore =
    breakdown.paymentHistory * weights.paymentHistory +
    breakdown.collateral     * weights.collateral +
    breakdown.incomeStability * weights.incomeStability +
    breakdown.debtToIncome   * weights.debtToIncome +
    breakdown.behavioral     * weights.behavioral

  const score = Math.round(300 + (rawScore / 100) * 600)

  // band: 'high' = high credit score (LOW RISK), 'low' = low credit score (HIGH RISK)
  const band =
    score >= 700 ? 'high' :
    score >= 500 ? 'medium' : 'low'

  return { score, band, breakdown }
}