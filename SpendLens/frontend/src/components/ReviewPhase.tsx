import { useState, useEffect } from 'react'
import { api } from '../services/api'

interface ReviewPhaseProps {
  userId: string
  month: string
}

export default function ReviewPhase({ userId, month }: ReviewPhaseProps) {
  const [csvData, setCsvData] = useState('')
  const [transactions, setTransactions] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const catRes = await api.getCategories()
        setCategories(catRes.data)

        const txnRes = await api.getTransactions(userId, month)
        setTransactions(txnRes.data)
      } catch (err) {
        console.error('Failed to load data:', err)
      }
    }
    loadData()
  }, [userId, month])

  const handleCSVUpload = async () => {
    if (!csvData.trim()) {
      setError('Please paste CSV data')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.uploadTransactions(userId, csvData)
      const txnRes = await api.getTransactions(userId, month)
      setTransactions(txnRes.data)
      setCsvData('')
      setSuccess('Transactions imported successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(`Failed to upload: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleTransactionUpdate = async (id: string, updates: any) => {
    try {
      await api.updateTransaction(id, updates)
      setTransactions(
        transactions.map(t =>
          t.id === id ? { ...t, ...updates } : t
        )
      )
    } catch (err) {
      setError(`Failed to update: ${err}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* CSV Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Monthly Review</h2>
        <p className="text-gray-600 mb-6">Upload your bank statement CSV to review and categorize transactions.</p>

        {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}
        {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded">{success}</div>}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Paste CSV Data (Date, Merchant, Amount)
          </label>
          <textarea
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            placeholder="2024-12-01,Whole Foods,45.99&#10;2024-12-02,Uber,28.50"
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleCSVUpload}
          disabled={loading}
          className="bg-blue-600 text-white font-medium px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Uploading...' : 'Upload Transactions'}
        </button>
      </div>

      {/* Transactions List */}
      {transactions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Transactions for {month}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Merchant</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(txn.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{txn.merchant}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      ${txn.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <select
                        value={txn.category_id || ''}
                        onChange={(e) =>
                          handleTransactionUpdate(txn.id, {
                            category_id: e.target.value || null,
                          })
                        }
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="">Uncategorized</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <select
                        value={txn.is_one_off ? 'one_off' : 'recurring'}
                        onChange={(e) =>
                          handleTransactionUpdate(txn.id, {
                            is_one_off: e.target.value === 'one_off',
                            is_recurring: e.target.value === 'recurring',
                          })
                        }
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="recurring">Recurring</option>
                        <option value="one_off">One-Off</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
