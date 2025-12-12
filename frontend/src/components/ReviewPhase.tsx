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
    <div className="max-w-4xl">
      {/* CSV Upload Section */}
      <div className="border border-gray-700 p-8 bg-black mb-8">
        <h2 className="text-3xl font-bold mb-2">Monthly Review</h2>
        <p className="text-gray-400 mb-8 text-sm">Upload your bank statement CSV to review and categorize transactions.</p>

        {error && <div className="mb-6 p-4 border border-red-600 bg-red-900 bg-opacity-20 text-red-400 text-sm">{error}</div>}
        {success && <div className="mb-6 p-4 border border-blue-400 bg-blue-900 bg-opacity-20 text-blue-300 text-sm">{success}</div>}

        <div className="mb-6">
          <label className="text-xs uppercase tracking-widest text-gray-400 block mb-3">
            Paste CSV Data (Date, Merchant, Amount)
          </label>
          <textarea
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            placeholder="2024-12-01,Whole Foods,45.99&#10;2024-12-02,Uber,28.50"
            className="w-full h-32 px-4 py-3 border border-gray-600 bg-black text-white font-mono text-sm focus:border-blue-400 focus:outline-none transition"
          />
        </div>

        <button
          onClick={handleCSVUpload}
          disabled={loading}
          className="btn-ghost disabled:opacity-50"
        >
          {loading ? 'Uploading...' : 'Upload Transactions'}
        </button>
      </div>

      {/* Transactions List */}
      {transactions.length > 0 && (
        <div className="border border-gray-700 overflow-hidden bg-black">
          <div className="px-8 py-6 border-b border-gray-700">
            <h3 className="text-lg font-bold uppercase tracking-wide">
              Transactions for {month}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700 bg-black">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Date</th>
                  <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Merchant</th>
                  <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Amount</th>
                  <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Category</th>
                  <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-900 transition">
                    <td className="px-8 py-4 text-sm text-gray-200">
                      {new Date(txn.date).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-4 text-sm text-gray-200">{txn.merchant}</td>
                    <td className="px-8 py-4 text-sm font-medium text-blue-400">
                      ${txn.amount.toFixed(2)}
                    </td>
                    <td className="px-8 py-4 text-sm">
                      <select
                        value={txn.category_id || ''}
                        onChange={(e) =>
                          handleTransactionUpdate(txn.id, {
                            category_id: e.target.value || null,
                          })
                        }
                        className="px-3 py-1 border border-gray-600 bg-black text-white text-sm focus:border-blue-400 focus:outline-none"
                      >
                        <option value="">Uncategorized</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-8 py-4 text-sm">
                      <select
                        value={txn.is_one_off ? 'one_off' : 'recurring'}
                        onChange={(e) =>
                          handleTransactionUpdate(txn.id, {
                            is_one_off: e.target.value === 'one_off',
                            is_recurring: e.target.value === 'recurring',
                          })
                        }
                        className="px-3 py-1 border border-gray-600 bg-black text-white text-sm focus:border-blue-400 focus:outline-none"
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
