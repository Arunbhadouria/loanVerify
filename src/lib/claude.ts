export async function getScoreExplanation(
  score: number,
  breakdown: Record<string, number>,
  loanAmount: number,
  riskBand: string
) {
  const response = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'score_explanation',
      data: { score, breakdown, loanAmount, riskBand }
    })
  })
  const data = await response.json()
  return data.message
}

export async function getFullReport(applicationData: any) {
  const response = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'full_report',
      data: applicationData
    })
  })
  const data = await response.json()
  return data.message
}