import { useState, useEffect } from 'react'
import { api } from '../services/api'

interface ReviewPhaseProps {
  month: string
}

type InputMode = 'manual' | 'ai'

const CHATGPT_PROMPT = `Extract expenses from this bank statement. Return ONLY a JSON array with no other text. Each object should have: date (YYYY-MM-DD format), merchant (string), amount (number, positive value).

Example output:
[
  {"date": "2024-12-01", "merchant": "Whole Foods", "amount": 45.99},
  {"date": "2024-12-02", "merchant": "Uber", "amount": 28.50}
]

Here is my bank statement:
[PASTE YOUR BANK STATEMENT HERE]`

export default function ReviewPhase({ month }: ReviewPhaseProps) {
  const [inputMode, setInputMode] = useState<InputMode>('manual')
  const [transactions, setTransactions] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Manual expense entry state
  const [manualDate, setManualDate] = useState('')
  const [manualMerchant, setManualMerchant] = useState('')
  const [manualAmount, setManualAmount] = useState('')
  const [manualCategory, setManualCategory] = useState('')

  // Income entry state
  const [incomeDate, setIncomeDate] = useState('')
  const [incomeSource, setIncomeSource] = useState('')
  const [incomeAmount, setIncomeAmount] = useState('')
  const [incomeError, setIncomeError] = useState('')
  const [incomeSuccess, setIncomeSuccess] = useState('')

  // AI import state
  const [aiJsonInput, setAiJsonInput] = useState('')
  const [promptCopied, setPromptCopied] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const catRes = await api.getCategories()
        setCategories(catRes.data)

        const txnRes = await api.getTransactions(month)
        setTransactions(txnRes.data)
      } catch (err) {
        console.error('Failed to load data:', err)
      }
    }
    loadData()
  }, [month])

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(CHATGPT_PROMPT)
      setPromptCopied(true)
      setTimeout(() => setPromptCopied(false), 2000)
    } catch (err) {
      setError('Failed to copy to clipboard')
    }
  }

  const handleManualAdd = async () => {
    setError('')

    if (!manualDate || !manualMerchant || !manualAmount) {
      setError('Please fill in date, merchant, and amount')
      return
    }

    const amount = parseFloat(manualAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setLoading(true)

    try {
      const csvLine = `${manualDate},${manualMerchant},${amount}`
      await api.uploadTransactions(csvLine)

      const txnRes = await api.getTransactions(month)
      setTransactions(txnRes.data)

      setManualDate('')
      setManualMerchant('')
      setManualAmount('')
      setManualCategory('')
      setSuccess('Expense added!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(`Failed to add expense: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleIncomeAdd = async () => {
    setIncomeError('')

    if (!incomeDate || !incomeSource || !incomeAmount) {
      setIncomeError('Please fill in date, source, and amount')
      return
    }

    const amount = parseFloat(incomeAmount)
    if (isNaN(amount) || amount <= 0) {
      setIncomeError('Please enter a valid amount')
      return
    }

    setLoading(true)

    try {
      // Income is stored as negative amount (accounting convention: negative = income)
      const csvLine = `${incomeDate},${incomeSource},${-amount}`
      await api.uploadTransactions(csvLine)

      const txnRes = await api.getTransactions(month)
      setTransactions(txnRes.data)

      setIncomeDate('')
      setIncomeSource('')
      setIncomeAmount('')
      setIncomeSuccess('Income added!')
      setTimeout(() => setIncomeSuccess(''), 3000)
    } catch (err) {
      setIncomeError(`Failed to add income: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAiImport = async () => {
    if (!aiJsonInput.trim()) {
      setError('Please paste the JSON output from ChatGPT')
      return
    }

    setLoading(true)
    setError('')

    try {
      const parsed = JSON.parse(aiJsonInput)

      if (!Array.isArray(parsed)) {
        setError('Invalid format: expected a JSON array')
        setLoading(false)
        return
      }

      const csvLines = parsed
        .map((item: any) => `${item.date},${item.merchant},${item.amount}`)
        .join('\n')

      await api.uploadTransactions(csvLines)

      const txnRes = await api.getTransactions(month)
      setTransactions(txnRes.data)

      setAiJsonInput('')
      setSuccess(`Imported ${parsed.length} transactions!`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format. Make sure you copied the exact output from ChatGPT.')
      } else {
        setError(`Failed to import: ${err}`)
      }
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

  const handleDeleteTransaction = async (id: string) => {
    try {
      await api.deleteTransaction(id)
      setTransactions(transactions.filter(t => t.id !== id))
    } catch (err) {
      setError(`Failed to delete: ${err}`)
    }
  }

  // Separate expenses (positive) from income (negative)
  const expenses = transactions.filter(t => t.amount > 0)
  const incomeEntries = transactions.filter(t => t.amount < 0)

  return (
    <div className="space-y-8">
      {/* Expenses Section */}
      <div className="border border-gray-700 p-8 bg-black">
        <h2 className="text-3xl font-bold mb-2">Expenses</h2>
        <p className="text-gray-400 mb-8 text-sm">Add your expenses manually or import from your bank statement using AI.</p>

        {error && <div className="mb-6 p-4 border border-red-600 bg-red-900 bg-opacity-20 text-red-400 text-sm">{error}</div>}
        {success && <div className="mb-6 p-4 border border-blue-400 bg-blue-900 bg-opacity-20 text-blue-300 text-sm">{success}</div>}

        {/* Tab Toggle */}
        <div className="flex gap-4 mb-8 border-b border-gray-700">
          <button
            onClick={() => setInputMode('manual')}
            className={`pb-3 text-xs uppercase tracking-widest font-medium border-b-2 transition ${
              inputMode === 'manual'
                ? 'border-blue-400 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Manual Entry
          </button>
          <button
            onClick={() => setInputMode('ai')}
            className={`pb-3 text-xs uppercase tracking-widest font-medium border-b-2 transition ${
              inputMode === 'ai'
                ? 'border-blue-400 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Import via AI
          </button>
        </div>

        {/* Manual Entry Form */}
        {inputMode === 'manual' && (
          <div className="mb-8">
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div>
                <label className="text-xs uppercase tracking-widest text-gray-400 block mb-3">Date</label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full bg-black border border-gray-600 text-white px-4 py-3 focus:border-blue-400 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-gray-400 block mb-3">Merchant</label>
                <input
                  type="text"
                  value={manualMerchant}
                  onChange={(e) => setManualMerchant(e.target.value)}
                  placeholder="e.g. Whole Foods"
                  className="w-full bg-black border border-gray-600 text-white px-4 py-3 focus:border-blue-400 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-gray-400 block mb-3">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-black border border-gray-600 text-white px-4 py-3 focus:border-blue-400 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-gray-400 block mb-3">Category</label>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  className="w-full bg-black border border-gray-600 text-white px-4 py-3 focus:border-blue-400 focus:outline-none transition appearance-none cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
                >
                  <option value="" className="bg-black text-gray-400">Select...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-black text-white">{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <button onClick={handleManualAdd} disabled={loading} className="btn-ghost disabled:opacity-50">
              {loading ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        )}

        {/* AI Import */}
        {inputMode === 'ai' && (
          <div className="mb-8">
            <div className="mb-6">
              <label className="text-xs uppercase tracking-widest text-gray-400 block mb-3">Step 1: Copy this prompt to ChatGPT</label>
              <div className="relative">
                <pre className="w-full p-4 border border-gray-600 bg-gray-900 text-gray-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                  {CHATGPT_PROMPT}
                </pre>
                <button
                  onClick={handleCopyPrompt}
                  className="absolute top-3 right-3 px-3 py-1 text-xs uppercase tracking-widest border border-gray-500 hover:border-blue-400 hover:text-blue-400 transition"
                >
                  {promptCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="mb-6">
              <label className="text-xs uppercase tracking-widest text-gray-400 block mb-3">Step 2: Paste the JSON result from ChatGPT</label>
              <textarea
                value={aiJsonInput}
                onChange={(e) => setAiJsonInput(e.target.value)}
                placeholder='[{"date": "2024-12-01", "merchant": "Whole Foods", "amount": 45.99}]'
                className="w-full h-40 px-4 py-3 border border-gray-600 bg-black text-white font-mono text-sm focus:border-blue-400 focus:outline-none transition"
              />
            </div>
            <button onClick={handleAiImport} disabled={loading} className="btn-ghost disabled:opacity-50">
              {loading ? 'Importing...' : 'Import Transactions'}
            </button>
          </div>
        )}

        {/* Expenses List */}
        {expenses.length > 0 && (
          <div className="border-t border-gray-700 pt-8 mt-8">
            <h3 className="text-lg font-bold uppercase tracking-wide mb-6">Expenses for {month}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Merchant</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-400"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {expenses.map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-900 transition">
                      <td className="px-4 py-3 text-sm text-gray-200">{new Date(txn.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-200">{txn.merchant}</td>
                      <td className="px-4 py-3 text-sm font-medium text-red-400">${txn.amount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm">
                        <select
                          value={txn.category_id || ''}
                          onChange={(e) => handleTransactionUpdate(txn.id, { category_id: e.target.value || null })}
                          className="px-2 py-1 border border-gray-600 bg-black text-white text-sm focus:border-blue-400 focus:outline-none appearance-none cursor-pointer pr-6"
                          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 4px center', backgroundSize: '14px' }}
                        >
                          <option value="" className="bg-black">Uncategorized</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id} className="bg-black">{cat.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <select
                          value={txn.is_one_off ? 'one_off' : 'recurring'}
                          onChange={(e) => handleTransactionUpdate(txn.id, { is_one_off: e.target.value === 'one_off', is_recurring: e.target.value === 'recurring' })}
                          className="px-2 py-1 border border-gray-600 bg-black text-white text-sm focus:border-blue-400 focus:outline-none appearance-none cursor-pointer pr-6"
                          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 4px center', backgroundSize: '14px' }}
                        >
                          <option value="recurring" className="bg-black">Recurring</option>
                          <option value="one_off" className="bg-black">One-Off</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleDeleteTransaction(txn.id)}
                          className="text-red-400 hover:text-red-300 text-xs uppercase tracking-widest"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Income Section */}
      <div className="border border-gray-700 p-8 bg-black">
        <h2 className="text-3xl font-bold mb-2">Income</h2>
        <p className="text-gray-400 mb-8 text-sm">Record your income for this month.</p>

        {incomeError && <div className="mb-6 p-4 border border-red-600 bg-red-900 bg-opacity-20 text-red-400 text-sm">{incomeError}</div>}
        {incomeSuccess && <div className="mb-6 p-4 border border-blue-400 bg-blue-900 bg-opacity-20 text-blue-300 text-sm">{incomeSuccess}</div>}

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-400 block mb-3">Date</label>
            <input
              type="date"
              value={incomeDate}
              onChange={(e) => setIncomeDate(e.target.value)}
              className="w-full bg-black border border-gray-600 text-white px-4 py-3 focus:border-blue-400 focus:outline-none transition"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-400 block mb-3">Source</label>
            <input
              type="text"
              value={incomeSource}
              onChange={(e) => setIncomeSource(e.target.value)}
              placeholder="e.g. Salary, Freelance"
              className="w-full bg-black border border-gray-600 text-white px-4 py-3 focus:border-blue-400 focus:outline-none transition"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-400 block mb-3">Amount</label>
            <input
              type="number"
              step="0.01"
              value={incomeAmount}
              onChange={(e) => setIncomeAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-black border border-gray-600 text-white px-4 py-3 focus:border-blue-400 focus:outline-none transition"
            />
          </div>
        </div>
        <button onClick={handleIncomeAdd} disabled={loading} className="btn-ghost disabled:opacity-50">
          {loading ? 'Adding...' : 'Add Income'}
        </button>

        {/* Income List */}
        {incomeEntries.length > 0 && (
          <div className="border-t border-gray-700 pt-8 mt-8">
            <h3 className="text-lg font-bold uppercase tracking-wide mb-6">Income for {month}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-400"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {incomeEntries.map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-900 transition">
                      <td className="px-4 py-3 text-sm text-gray-200">{new Date(txn.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-200">{txn.merchant}</td>
                      <td className="px-4 py-3 text-sm font-medium text-green-400">${Math.abs(txn.amount).toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleDeleteTransaction(txn.id)}
                          className="text-red-400 hover:text-red-300 text-xs uppercase tracking-widest"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
