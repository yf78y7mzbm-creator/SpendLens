import { useState, useEffect } from 'react'
import { api } from '../services/api'

interface DashboardPhaseProps {
  userId: string
  month: string
}

export default function DashboardPhase({ userId, month }: DashboardPhaseProps) {
  const [budget, setBudget] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const [budgetRes, txnRes, catRes] = await Promise.all([
          api.getBudget(userId, month),
          api.getTransactions(userId, month),
          api.getCategories(),
        ])

        setBudget(budgetRes.data)
        setTransactions(txnRes.data)
        setCategories(catRes.data)
      } catch (err) {
        setError(`Failed to load data: ${err}`)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userId, month])

  if (loading) {
    return <div className="text-center text-gray-600">Loading...</div>
  }

  if (error) {
    return <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>
  }

  if (!budget || transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600">No data available. Complete the Plan and Review phases first.</p>
      </div>
    )
  }

  // Calculate actuals
  const actualIncome = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)

  const actualExpenses = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const actualSurplus = actualIncome - actualExpenses

  // Category breakdown
  const categorySpending = categories.map((cat) => {
    const spending = transactions
      .filter(t => t.category_id === cat.id && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    return { ...cat, actual: spending }
  })

  // One-off vs recurring
  const oneOffAmount = transactions
    .filter(t => t.is_one_off && t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const recurringAmount = transactions
    .filter(t => t.is_recurring && t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const normalizedExpenses = actualExpenses - oneOffAmount

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-600 mb-1">Planned Surplus</p>
          <p className="text-3xl font-bold text-blue-600">
            ${budget.planned_surplus.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-600 mb-1">Actual Surplus</p>
          <p className={`text-3xl font-bold ${actualSurplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${actualSurplus.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-600 mb-1">Variance</p>
          <p className={`text-3xl font-bold ${actualSurplus >= budget.planned_surplus ? 'text-green-600' : 'text-red-600'}`}>
            ${(actualSurplus - budget.planned_surplus).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-600 mb-1">Normalized Expenses</p>
          <p className="text-3xl font-bold text-purple-600">
            ${normalizedExpenses.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            (Excludes {oneOffAmount > 0 ? `$${oneOffAmount.toFixed(2)}` : '$0'} one-off)
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
        <div className="space-y-4">
          {categorySpending.filter(c => c.actual > 0).map((cat) => {
            const plannedCat = budget.categories?.find((bc: any) => bc.category_id === cat.id)
            const planned = plannedCat?.planned_amount || 0
            const variance = planned - cat.actual

            return (
              <div key={cat.id}>
                <div className="flex justify-between mb-2">
                  <p className="font-medium text-gray-900">{cat.name}</p>
                  <p className={`text-sm font-semibold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {variance >= 0 ? '+' : ''} ${variance.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full"
                      style={{
                        width: `${Math.min(100, (cat.actual / (planned || 1)) * 100)}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-gray-600 w-32 text-right">
                    ${cat.actual.toFixed(2)} / ${planned.toFixed(2)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* One-off vs Recurring */}
      {(oneOffAmount > 0 || recurringAmount > 0) && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">${actualExpenses.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Recurring</p>
              <p className="text-2xl font-bold text-orange-600">${recurringAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">One-Off</p>
              <p className="text-2xl font-bold text-red-600">${oneOffAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
