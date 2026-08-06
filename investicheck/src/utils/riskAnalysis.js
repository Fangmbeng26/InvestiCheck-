const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:4000'

/**
 * @param {object} formData - values collected on CheckInvestment.jsx
 * @returns {Promise<{
 *   score: number,
 *   level: 'low' | 'medium' | 'high',
 *   levelLabel: string,
 *   negativeIndicators: string[],
 *   positiveIndicators: string[],
 *   insufficientDataNotes: string[],
 * }>} 
 * @throws if request fails
 */
export async function analyzeInvestment(formData) {
  const response = await fetch(`${API_URL}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.message || `Analysis request failed (${response.status})`)
  }

  const data = await response.json()
  return data.result
}

  
 