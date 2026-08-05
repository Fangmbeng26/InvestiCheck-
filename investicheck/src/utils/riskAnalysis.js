// This is a SIMULATION, not a real risk-analysis algorithm. It turns the
// answers from the CheckInvestment form into a plausible-looking score and
// indicator list, purely so the RiskResult and Report pages have something
// realistic to display. The real scoring engine is a separate future task.

/**
 * @param {object} formData - the values collected on CheckInvestment.jsx
 * @returns {{
 *   score: number,
 *   level: 'low' | 'moderate' | 'high',
 *   levelLabel: string,
 *   negativeIndicators: string[],
 *   positiveIndicators: string[],
 * }}
 */
export function analyzeInvestment(formData = {}) {
  let score = 20 // baseline risk every platform starts with

  const negativeIndicators = []
  const positiveIndicators = []

  if (formData.guaranteedProfits === 'Yes') {
    score += 30
    negativeIndicators.push('Guaranteed returns detected')
  }

  if (formData.referralRequired === 'Yes') {
    score += 15
    negativeIndicators.push('Referral-based model')
  }

  if (!formData.companyName || !formData.companyName.trim()) {
    score += 15
    negativeIndicators.push('Company registration not verified')
  } else {
    positiveIndicators.push('Company name provided')
  }

  const promisedReturn = Number(formData.promisedReturn)
  if (!Number.isNaN(promisedReturn) && promisedReturn > 20) {
    score += 10
    negativeIndicators.push('Promises unusually high returns')
  } else if (!Number.isNaN(promisedReturn) && promisedReturn > 0) {
    positiveIndicators.push('Promised return within a plausible range')
  }

  if (!formData.country) {
    score += 10
    negativeIndicators.push('No verifiable country of operation')
  }

  if (formData.websiteUrl && formData.websiteUrl.startsWith('https://')) {
    positiveIndicators.push('HTTPS security detected')
  }

  // A placeholder "site age" flag, always shown, since real domain-age
  // checking requires a backend lookup that doesn't exist yet.
  negativeIndicators.push('Website age could not be verified')

  // Never leave the list empty even if every answer looked favorable.
  if (negativeIndicators.length === 0) {
    negativeIndicators.push('Limited information available for full verification')
  }

  score = Math.min(100, Math.max(0, score))

  let level = 'low'
  let levelLabel = 'Low Risk'
  if (score >= 70) {
    level = 'high'
    levelLabel = 'High Risk'
  } else if (score >= 40) {
    level = 'moderate'
    levelLabel = 'Moderate Risk'
  }

  return { score, level, levelLabel, negativeIndicators, positiveIndicators }
}
