import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true,
})

export const fetchSubscriptions = async () => {
  const response = await api.get('/subscriptions')
  return response.data
}