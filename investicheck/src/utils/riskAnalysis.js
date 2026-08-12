import api from '../Services/api.js'

const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:4000'


export async function analyzeInvestment(formData) {
  const response = await api.post('/api/analysis', {
    platformName: formData.platformName,
    website: formData.website,
    answers: formData.answers,
  })
  return response.data
}

  
 