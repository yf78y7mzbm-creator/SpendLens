import { useState, useEffect } from 'react'
import { api } from '../services/api'
import InvestmentProjectionChart from './InvestmentProjectionChart'

interface DashboardPhaseProps {
  month: string
}

export default function DashboardPhase({ month }: DashboardPhaseProps) {
  const [budget, setBudget] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const [budgetRes, txnRes, catRes] = await Promise.all([
          api.getBudget(month),
          api.getTransactions(month),
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
  }, [month])

  if (loading) {
    return <div className="text-center text-gray-400 text-sm uppercase tracking-widest">Loading...</div>
  }

  if (error) {
    return <div className="p-6 border border-red-600 bg-red-900 bg-opacity-20 text-red-400 text-sm">{error}</div>
  }

  if (!budget || transactions.length === 0) {
    return (
      <div className="border border-gray-700 p-8 bg-black text-center">
        <p className="text-gray-400 text-sm">No data available. Complete the Plan and Review phases first.</p>
      </div>
    )
  }

  // Calculate actuals (positive = expenses, negative = income)
  const actualIncome = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const actualExpenses = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)

  const actualSurplus = actualIncome - actualExpenses

  // Category breakdown (expenses are positive amounts)
  const categorySpending = categories.map((cat) => {
    const spending = transactions
      .filter(t => t.category_id === cat.id && t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)
    return { ...cat, actual: spending }
  })

  // One-off vs recurring (expenses are positive amounts)
  const oneOffAmount = transactions
    .filter(t => t.is_one_off && t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)

  const recurringAmount = transactions
    .filter(t => t.is_recurring && t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)

  const normalizedExpenses = actualExpenses - oneOffAmount

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border border-gray-700 p-6 bg-black">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Planned Surplus</p>
          <p className="text-4xl font-bold text-blue-400">
            ${budget.planned_surplus.toFixed(2)}
          </p>
        </div>
        <div className="border border-gray-700 p-6 bg-black">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Actual Surplus</p>
          <p className={`text-4xl font-bold ${actualSurplus >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            ${actualSurplus.toFixed(2)}
          </p>
        </div>
        <div className="border border-gray-700 p-6 bg-black">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Variance</p>
          <p className={`text-4xl font-bold ${actualSurplus >= budget.planned_surplus ? 'text-blue-400' : 'text-red-400'}`}>
            ${(actualSurplus - budget.planned_surplus).toFixed(2)}
          </p>
        </div>
        <div className="border border-gray-700 p-6 bg-black">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Normalized Expenses</p>
          <p className="text-4xl font-bold text-blue-400">
            ${normalizedExpenses.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            (Excludes {oneOffAmount > 0 ? `$${oneOffAmount.toFixed(2)}` : '$0'} one-off)
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="border border-gray-700 p-8 bg-black">
        <h3 className="text-lg font-bold mb-8 uppercase tracking-wide">Spending by Category</h3>
        <div className="space-y-6 border-t border-gray-700 pt-6">
          {categorySpending.filter(c => c.actual > 0).map((cat) => {
            const plannedCat = budget.categories?.find((bc: any) => bc.category_id === cat.id)
            const planned = plannedCat?.planned_amount || 0
            const variance = planned - cat.actual

            return (
              <div key={cat.id}>
                <div className="flex justify-between items-end mb-3">
                  <p className="font-medium text-white">{cat.name}</p>
                  <p className={`text-sm font-semibold ${variance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                    {variance >= 0 ? '+' : ''} ${variance.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex-1 bg-gray-800 h-2 border border-gray-700">
                    <div
                      className="bg-blue-400 h-full"
                      style={{
                        width: `${Math.min(100, (cat.actual / (planned || 1)) * 100)}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-gray-300 w-40 text-right text-xs">
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
        <div className="border border-gray-700 p-8 bg-black">
          <h3 className="text-lg font-bold mb-8 uppercase tracking-wide">Expense Breakdown</h3>
          <div className="grid grid-cols-3 gap-6 border-t border-gray-700 pt-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Total Expenses</p>
              <p className="text-3xl font-bold text-white">${actualExpenses.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Recurring</p>
              <p className="text-3xl font-bold text-blue-400">${recurringAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">One-Off</p>
              <p className="text-3xl font-bold text-blue-400">${oneOffAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Investment Projection */}
      <InvestmentProjectionChart monthlySurplus={actualSurplus} />
    </div>
  )
}
