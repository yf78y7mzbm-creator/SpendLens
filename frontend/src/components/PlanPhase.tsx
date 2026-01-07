import { useState, useEffect } from 'react'
import { api } from '../services/api'

interface PlanPhaseProps {
  month: string
}

const DEFAULT_CATEGORIES = [
  'Food & Dining',
  'Travel',
  'Entertainment',
  'Shopping',
  'Utilities',
  'Health & Fitness',
  'Subscriptions',
]

export default function PlanPhase({ month }: PlanPhaseProps) {
  const [income, setIncome] = useState('')
  const [fixedExpenses, setFixedExpenses] = useState('')
  const [categories, setCategories] = useState(
    DEFAULT_CATEGORIES.map(name => ({ name, amount: '' }))
  )
  const [debtPayment, setDebtPayment] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)

  // Load existing budget data
  useEffect(() => {
    const loadBudget = async () => {
      try {
        const res = await api.getBudget(month)
        if (res.data) {
          setIncome(res.data.planned_income?.toString() || '')
          setFixedExpenses(res.data.planned_fixed_expenses?.toString() || '')

          // Map existing categories to form state
          const existingCategories = res.data.categories || []
          const updatedCategories = DEFAULT_CATEGORIES.map(name => {
            const existing = existingCategories.find((c: any) => c.name === name)
            return { name, amount: existing?.planned_amount?.toString() || '' }
          })
          setCategories(updatedCategories)

          // Check for debt payment category
          const debtCat = existingCategories.find((c: any) => c.name === 'Debt Payments')
          if (debtCat) {
            setDebtPayment(debtCat.planned_amount)
          }
        }
      } catch (err) {
        // No existing budget, that's fine
      } finally {
        setLoading(false)
      }
    }

    loadBudget()
  }, [month])

  const plannedSurplus =
    (parseFloat(income) || 0) - (parseFloat(fixedExpenses) || 0) -
    categories.reduce((sum, cat) => sum + (parseFloat(cat.amount) || 0), 0) -
    (debtPayment || 0)

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

      // Build categories array, preserving debt payment if it exists
      const budgetCategories = categories
        .filter(c => c.amount)
        .map(c => ({
          name: c.name,
          planned_amount: parseFloat(c.amount),
        }))

      // Preserve the Debt Payments category if it was set from DebtPhase
      if (debtPayment !== null) {
        budgetCategories.push({
          name: 'Debt Payments',
          planned_amount: debtPayment,
        })
      }

      await api.createBudget({
        month,
        planned_income: incomeNum,
        planned_fixed_expenses: fixedNum,
        categories: budgetCategories,
      })

      setSuccess('Budget created successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(`Failed to create budget: ${err}`)
    }
  }

  if (loading) {
    return <div className="text-center text-gray-400 text-sm uppercase tracking-widest">Loading...</div>
  }

  return (
    <div>
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
              {debtPayment !== null && (
                <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                  <label className="text-sm text-red-400 min-w-40">
                    Debt Payments
                    <span className="text-xs text-gray-500 ml-2">(from Debt Planner)</span>
                  </label>
                  <span className="w-32 text-right text-red-400 font-medium px-4 py-2">
                    ${debtPayment.toFixed(2)}
                  </span>
                </div>
              )}
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
