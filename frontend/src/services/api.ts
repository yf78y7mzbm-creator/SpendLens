import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE,
})

// Add JWT token to all requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle 401 errors (token expired)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

export const api = {
  // Auth
  register: (email: string, password: string, name?: string) =>
    axiosInstance.post('/auth/register', { email, password, name }),
  login: (email: string, password: string) =>
    axiosInstance.post('/auth/login', { email, password }),
  getMe: () =>
    axiosInstance.get('/auth/me'),

  // Budgets (no userId needed - comes from token)
  createBudget: (data: any) =>
    axiosInstance.post('/budgets', data),
  getBudget: (month: string) =>
    axiosInstance.get(`/budgets/${month}`),

  // Transactions (no userId needed - comes from token)
  uploadTransactions: (csvData: string) =>
    axiosInstance.post('/transactions/upload', { csv_data: csvData }),
  getTransactions: (month: string) =>
    axiosInstance.get(`/transactions/${month}`),
  updateTransaction: (id: string, data: any) =>
    axiosInstance.patch(`/transactions/${id}`, data),
  deleteTransaction: (id: string) =>
    axiosInstance.delete(`/transactions/${id}`),

  // Categories
  getCategories: () =>
    axiosInstance.get('/categories'),
  createCategory: (data: any) =>
    axiosInstance.post('/categories', data),

  // Debts
  getDebts: () =>
    axiosInstance.get('/debts'),
  createDebt: (data: any) =>
    axiosInstance.post('/debts', data),
  updateDebt: (id: string, data: any) =>
    axiosInstance.patch(`/debts/${id}`, data),
  deleteDebt: (id: string) =>
    axiosInstance.delete(`/debts/${id}`),
  getDebtPlan: () =>
    axiosInstance.get('/debts/plan'),
  saveDebtPlan: (data: any) =>
    axiosInstance.post('/debts/plan', data),
}
