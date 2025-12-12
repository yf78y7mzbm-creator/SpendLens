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
    <div className="max-w-4xl">
      <div className="border border-gray-700 p-8 bg-black">
        <h2 className="text-3xl font-bold mb-2">Plan Your Month</h2>
        <p className="text-gray-400 mb-8 text-sm">Set your income target, fixed expenses, and budget caps for spending categories.</p>

        {error && <div className="mb-6 p-4 border border-red-600 bg-red-900 bg-opacity-20 text-red-400 text-sm">{error}</div>}
        {success && <div className="mb-6 p-4 border border-blue-400 bg-blue-900 bg-opacity-20 text-blue-300 text-sm">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Income & Fixed Expenses */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400 block mb-3">
                Expected Monthly Income
              </label>
              <input
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="5000"
                className="w-full bg-black border border-gray-600 text-white px-4 py-3 text-lg focus:border-blue-400 focus:outline-none transition"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400 block mb-3">
                Fixed Monthly Expenses
              </label>
              <input
                type="number"
                value={fixedExpenses}
                onChange={(e) => setFixedExpenses(e.target.value)}
                placeholder="2000"
                className="w-full bg-black border border-gray-600 text-white px-4 py-3 text-lg focus:border-blue-400 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Category Budgets */}
          <div>
            <h3 className="text-lg font-bold mb-6 uppercase tracking-wide">Budget by Category</h3>
            <div className="space-y-4 border-t border-gray-700 pt-6">
              {categories.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between pb-4 border-b border-gray-800">
                  <label className="text-sm text-gray-300 min-w-40">
                    {cat.name}
                  </label>
                  <input
                    type="number"
                    value={cat.amount}
                    onChange={(e) => handleCategoryChange(idx, e.target.value)}
                    placeholder="0"
                    className="w-32 bg-black border border-gray-600 text-white px-4 py-2 text-right focus:border-blue-400 focus:outline-none transition"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Planned Surplus */}
          <div className="border border-blue-400 p-6 mt-8">
            <p className="text-xs uppercase tracking-widest text-blue-300 mb-2">Planned Surplus</p>
            <p className={`text-4xl font-bold ${plannedSurplus >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
              ${plannedSurplus.toFixed(2)}
            </p>
          </div>

          <button
            type="submit"
            className="btn-ghost w-full mt-8 justify-center"
          >
            Save Plan
          </button>
        </form>
      </div>
    </div>
  )
}
