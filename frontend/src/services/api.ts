import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'

export const api = {
  // Budgets
  createBudget: (data: any) =>
    axios.post(`${API_BASE}/budgets`, data),
  getBudget: (userId: string, month: string) =>
    axios.get(`${API_BASE}/budgets/${userId}/${month}`),

  // Transactions
  uploadTransactions: (userId: string, csvData: string) =>
    axios.post(`${API_BASE}/transactions/upload`, { user_id: userId, csv_data: csvData }),
  getTransactions: (userId: string, month: string) =>
    axios.get(`${API_BASE}/transactions/${userId}/${month}`),
  updateTransaction: (id: string, data: any) =>
    axios.patch(`${API_BASE}/transactions/${id}`, data),

  // Categories
  getCategories: () =>
    axios.get(`${API_BASE}/categories`),
  createCategory: (data: any) =>
    axios.post(`${API_BASE}/categories`, data),
}
