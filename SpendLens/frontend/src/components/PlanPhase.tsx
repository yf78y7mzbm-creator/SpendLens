import { useState } from 'react'
import { api } from '../services/api'

interface PlanPhaseProps {
  userId: string
  month: string
}

export default function PlanPhase({ userId, month }: PlanPhaseProps) {
  const [income, setIncome] = useState('')
  const [fixedExpenses, setFixedExpenses] = useState('')
  const [categories, setCategories] = useState([
    { name: 'Food & Dining', amount: '' },
    { name: 'Travel', amount: '' },
    { name: 'Entertainment', amount: '' },
    { name: 'Shopping', amount: '' },
    { name: 'Utilities', amount: '' },
    { name: 'Health & Fitness', amount: '' },
    { name: 'Subscriptions', amount: '' },
  ])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const plannedSurplus =
    (parseFloat(income) || 0) - (parseFloat(fixedExpenses) || 0) - 
    categories.reduce((sum, cat) => sum + (parseFloat(cat.amount) || 0), 0)

  const handleCategoryChange = (index: number, value: string) => {
    const newCategories = [...categories]
    newCategories[index].amount = value
    setCategories(newCategories)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const incomeNum = parseFloat(income)
      const fixedNum = parseFloat(fixedExpenses)

      if (!incomeNum || !fixedNum) {
        setError('Please fill in income and fixed expenses')
        return
      }

      await api.createBudget({
        user_id: userId,
        month,
        planned_income: incomeNum,
        planned_fixed_expenses: fixedNum,
        categories: categories
          .filter(c => c.amount)
          .map(c => ({
            name: c.name,
            planned_amount: parseFloat(c.amount),
          })),
      })

      setSuccess('Budget created successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(`Failed to create budget: ${err}`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Plan Your Month</h2>
        <p className="text-gray-600 mb-6">Set your income target, fixed expenses, and budget caps for spending categories.</p>

        {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}
        {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded">{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* Income & Fixed Expenses */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Monthly Income
              </label>
              <input
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="5000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fixed Monthly Expenses
              </label>
              <input
                type="number"
                value={fixedExpenses}
                onChange={(e) => setFixedExpenses(e.target.value)}
                placeholder="2000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Category Budgets */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget by Category</h3>
            <div className="space-y-3">
              {categories.map((cat, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <label className="flex-1 text-sm font-medium text-gray-700 min-w-32">
                    {cat.name}
                  </label>
                  <input
                    type="number"
                    value={cat.amount}
                    onChange={(e) => handleCategoryChange(idx, e.target.value)}
                    placeholder="0"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md text-right focus:outline-none focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Planned Surplus */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">Planned Surplus</p>
            <p className={`text-3xl font-bold ${plannedSurplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${plannedSurplus.toFixed(2)}
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-medium py-2 rounded-md hover:bg-blue-700 transition"
          >
            Save Plan
          </button>
        </form>
      </div>
    </div>
  )
}
