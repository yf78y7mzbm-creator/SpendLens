import { useState, useEffect } from 'react'
import { api } from '../services/api'

interface DebtPhaseProps {
  month: string
}

interface Debt {
  id: string
  name: string
  balance: number
  interest_rate: number
  min_payment: number
}

interface PaymentAllocation {
  debt: Debt
  payment: number
  newBalance: number
}

interface PayoffInfo {
  monthsToPayoff: number
  payoffDate: string
  totalInterest: number
}

type Strategy = 'avalanche' | 'snowball'

export default function DebtPhase({ month }: DebtPhaseProps) {
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [debtName, setDebtName] = useState('')
  const [debtBalance, setDebtBalance] = useState('')
  const [debtInterestRate, setDebtInterestRate] = useState('')
  const [debtMinPayment, setDebtMinPayment] = useState('')

  // Plan state
  const [strategy, setStrategy] = useState<Strategy>('avalanche')
  const [monthlyPayment, setMonthlyPayment] = useState('')
  const [allocations, setAllocations] = useState<PaymentAllocation[]>([])
  const [payoffInfo, setPayoffInfo] = useState<PayoffInfo | null>(null)

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editBalance, setEditBalance] = useState('')
  const [editInterestRate, setEditInterestRate] = useState('')
  const [editMinPayment, setEditMinPayment] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [debtsRes, planRes] = await Promise.all([
        api.getDebts(),
        api.getDebtPlan()
      ])
      setDebts(debtsRes.data)
      if (planRes.data) {
        setStrategy(planRes.data.strategy)
        setMonthlyPayment(planRes.data.monthly_payment.toString())
      }
    } catch (err) {
      setError(`Failed to load data: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDebt = async () => {
    if (!debtName || !debtBalance || !debtMinPayment) {
      setError('Please fill in name, balance, and minimum payment')
      return
    }

    const balance = parseFloat(debtBalance)
    const minPayment = parseFloat(debtMinPayment)
    const interestRate = parseFloat(debtInterestRate) || 0

    if (isNaN(balance) || balance <= 0) {
      setError('Please enter a valid balance')
      return
    }

    if (isNaN(minPayment) || minPayment <= 0) {
      setError('Please enter a valid minimum payment')
      return
    }

    try {
      setError('')
      const res = await api.createDebt({
        name: debtName,
        balance,
        interest_rate: interestRate,
        min_payment: minPayment
      })
      setDebts([...debts, res.data])
      setDebtName('')
      setDebtBalance('')
      setDebtInterestRate('')
      setDebtMinPayment('')
      setSuccess('Debt added!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(`Failed to add debt: ${err}`)
    }
  }

  const handleDeleteDebt = async (id: string) => {
    try {
      await api.deleteDebt(id)
      setDebts(debts.filter(d => d.id !== id))
      setSuccess('Debt deleted!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(`Failed to delete debt: ${err}`)
    }
  }

  const startEditing = (debt: Debt) => {
    setEditingId(debt.id)
    setEditName(debt.name)
    setEditBalance(debt.balance.toString())
    setEditInterestRate(debt.interest_rate.toString())
    setEditMinPayment(debt.min_payment.toString())
  }

  const handleUpdateDebt = async () => {
    if (!editingId) return

    try {
      const res = await api.updateDebt(editingId, {
        name: editName,
        balance: parseFloat(editBalance),
        interest_rate: parseFloat(editInterestRate) || 0,
        min_payment: parseFloat(editMinPayment)
      })
      setDebts(debts.map(d => d.id === editingId ? res.data : d))
      setEditingId(null)
      setSuccess('Debt updated!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(`Failed to update debt: ${err}`)
    }
  }

  const calculatePayments = () => {
    if (debts.length === 0) {
      setError('Add at least one debt first')
      return
    }

    const payment = parseFloat(monthlyPayment)
    const totalMinPayments = debts.reduce((sum, d) => sum + d.min_payment, 0)

    if (isNaN(payment) || payment < totalMinPayments) {
      setError(`Monthly payment must be at least $${totalMinPayments.toFixed(2)} (sum of minimum payments)`)
      return
    }

    setError('')

    // Sort debts based on strategy
    const sortedDebts = [...debts].sort((a, b) => {
      if (strategy === 'avalanche') {
        return b.interest_rate - a.interest_rate // Highest interest first
      } else {
        return a.balance - b.balance // Lowest balance first
      }
    })

    // Calculate allocations for this month
    let remaining = payment
    const newAllocations: PaymentAllocation[] = []

    // First, allocate minimum payments
    for (const debt of sortedDebts) {
      const minPay = Math.min(debt.min_payment, debt.balance)
      newAllocations.push({
        debt,
        payment: minPay,
        newBalance: debt.balance - minPay
      })
      remaining -= minPay
    }

    // Then, allocate extra to priority debt
    for (let i = 0; i < newAllocations.length && remaining > 0; i++) {
      const allocation = newAllocations[i]
      if (allocation.newBalance > 0) {
        const extra = Math.min(remaining, allocation.newBalance)
        allocation.payment += extra
        allocation.newBalance -= extra
        remaining -= extra
      }
    }

    setAllocations(newAllocations)

    // Calculate payoff timeline
    const payoffMonths = calculatePayoffTimeline(sortedDebts, payment)
    const today = new Date()
    const payoffDate = new Date(today.setMonth(today.getMonth() + payoffMonths))

    setPayoffInfo({
      monthsToPayoff: payoffMonths,
      payoffDate: payoffDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      totalInterest: calculateTotalInterest(sortedDebts, payment, payoffMonths)
    })
  }

  const calculatePayoffTimeline = (sortedDebts: Debt[], monthlyPay: number): number => {
    // Simulate month by month
    let balances = sortedDebts.map(d => d.balance)
    let months = 0
    const maxMonths = 360 // 30 years cap

    while (balances.some(b => b > 0) && months < maxMonths) {
      months++
      let remaining = monthlyPay

      // Apply interest
      balances = balances.map((bal, i) => {
        if (bal <= 0) return 0
        const monthlyRate = sortedDebts[i].interest_rate / 100 / 12
        return bal * (1 + monthlyRate)
      })

      // Pay minimums first
      for (let i = 0; i < balances.length; i++) {
        if (balances[i] <= 0) continue
        const minPay = Math.min(sortedDebts[i].min_payment, balances[i], remaining)
        balances[i] -= minPay
        remaining -= minPay
      }

      // Pay extra to priority debt
      for (let i = 0; i < balances.length && remaining > 0; i++) {
        if (balances[i] <= 0) continue
        const extra = Math.min(remaining, balances[i])
        balances[i] -= extra
        remaining -= extra
      }
    }

    return months
  }

  const calculateTotalInterest = (sortedDebts: Debt[], monthlyPay: number, months: number): number => {
    const totalPaid = monthlyPay * months
    const totalPrincipal = sortedDebts.reduce((sum, d) => sum + d.balance, 0)
    return Math.max(0, totalPaid - totalPrincipal)
  }

  const handleSavePlan = async () => {
    if (!monthlyPayment) {
      setError('Please enter a monthly payment amount')
      return
    }

    try {
      await api.saveDebtPlan({
        strategy,
        monthly_payment: parseFloat(monthlyPayment)
      })
      setSuccess('Debt plan saved!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(`Failed to save plan: ${err}`)
    }
  }

  const handleCommitToBudget = async () => {
    if (!monthlyPayment) {
      setError('Please set a monthly payment first')
      return
    }

    try {
      // First ensure "Debt Payments" category exists
      const catRes = await api.getCategories()
      let debtCategory = catRes.data.find((c: any) => c.name === 'Debt Payments')

      if (!debtCategory) {
        const newCatRes = await api.createCategory({
          name: 'Debt Payments',
          keywords: ['debt', 'loan', 'payment'],
          color: '#EF4444'
        })
        debtCategory = newCatRes.data
      }

      // Get current budget
      const budgetRes = await api.getBudget(month)
      const currentBudget = budgetRes.data

      // Prepare categories for budget
      const existingCategories = currentBudget?.categories || []
      const otherCategories = existingCategories.filter((c: any) => c.name !== 'Debt Payments')

      const newCategories = [
        ...otherCategories,
        {
          name: 'Debt Payments',
          category_id: debtCategory.id,
          planned_amount: parseFloat(monthlyPayment)
        }
      ]

      // Create/update budget
      await api.createBudget({
        month,
        planned_income: currentBudget?.planned_income || 0,
        planned_fixed_expenses: currentBudget?.planned_fixed_expenses || 0,
        categories: newCategories
      })

      setSuccess(`Added $${monthlyPayment} debt payment to ${month} budget!`)
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError(`Failed to commit to budget: ${err}`)
    }
  }

  if (loading) {
    return <div className="text-center text-gray-400 text-sm uppercase tracking-widest">Loading...</div>
  }

  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0)
  const totalMinPayments = debts.reduce((sum, d) => sum + d.min_payment, 0)

  return (
    <div className="space-y-8">
      {error && <div className="p-4 border border-red-600 bg-red-900 bg-opacity-20 text-red-400 text-sm">{error}</div>}
      {success && <div className="p-4 border border-blue-400 bg-blue-900 bg-opacity-20 text-blue-300 text-sm">{success}</div>}

      {/* Add Debt Form */}
      <div className="border border-gray-700 p-8 bg-black">
        <h2 className="text-3xl font-bold mb-2">Debt Planner</h2>
        <p className="text-gray-400 mb-8 text-sm">Track your debts and create a repayment strategy.</p>

        <h3 className="text-lg font-bold mb-6 uppercase tracking-wide">Add New Debt</h3>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-400 block mb-3">Debt Name</label>
            <input
              type="text"
              value={debtName}
              onChange={(e) => setDebtName(e.target.value)}
              placeholder="e.g. Credit Card"
              className="w-full bg-black border border-gray-600 text-white px-4 py-3 focus:border-blue-400 focus:outline-none transition"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-400 block mb-3">Balance</label>
            <input
              type="number"
              step="0.01"
              value={debtBalance}
              onChange={(e) => setDebtBalance(e.target.value)}
              placeholder="5000.00"
              className="w-full bg-black border border-gray-600 text-white px-4 py-3 focus:border-blue-400 focus:outline-none transition"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-400 block mb-3">APY %</label>
            <input
              type="number"
              step="0.01"
              value={debtInterestRate}
              onChange={(e) => setDebtInterestRate(e.target.value)}
              placeholder="18.99"
              className="w-full bg-black border border-gray-600 text-white px-4 py-3 focus:border-blue-400 focus:outline-none transition"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-400 block mb-3">Min Payment</label>
            <input
              type="number"
              step="0.01"
              value={debtMinPayment}
              onChange={(e) => setDebtMinPayment(e.target.value)}
              placeholder="100.00"
              className="w-full bg-black border border-gray-600 text-white px-4 py-3 focus:border-blue-400 focus:outline-none transition"
            />
          </div>
        </div>
        <button onClick={handleAddDebt} className="btn-ghost">
          Add Debt
        </button>
      </div>

      {/* Debts List */}
      {debts.length > 0 && (
        <div className="border border-gray-700 overflow-hidden bg-black">
          <div className="px-8 py-6 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-bold uppercase tracking-wide">Your Debts</h3>
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-gray-400">Total Debt</p>
              <p className="text-2xl font-bold text-red-400">${totalDebt.toFixed(2)}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700 bg-black">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Name</th>
                  <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Balance</th>
                  <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">APY</th>
                  <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Min Payment</th>
                  <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {debts.map((debt) => (
                  <tr key={debt.id} className="hover:bg-gray-900 transition">
                    {editingId === debt.id ? (
                      <>
                        <td className="px-8 py-4">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-black border border-gray-600 text-white px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-8 py-4">
                          <input
                            type="number"
                            value={editBalance}
                            onChange={(e) => setEditBalance(e.target.value)}
                            className="w-24 bg-black border border-gray-600 text-white px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-8 py-4">
                          <input
                            type="number"
                            value={editInterestRate}
                            onChange={(e) => setEditInterestRate(e.target.value)}
                            className="w-20 bg-black border border-gray-600 text-white px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-8 py-4">
                          <input
                            type="number"
                            value={editMinPayment}
                            onChange={(e) => setEditMinPayment(e.target.value)}
                            className="w-24 bg-black border border-gray-600 text-white px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-8 py-4">
                          <button onClick={handleUpdateDebt} className="text-blue-400 hover:text-blue-300 mr-4 text-xs uppercase tracking-widest">Save</button>
                          <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-300 text-xs uppercase tracking-widest">Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-8 py-4 text-sm text-gray-200">{debt.name}</td>
                        <td className="px-8 py-4 text-sm font-medium text-red-400">${debt.balance.toFixed(2)}</td>
                        <td className="px-8 py-4 text-sm text-gray-200">{debt.interest_rate}%</td>
                        <td className="px-8 py-4 text-sm text-gray-200">${debt.min_payment.toFixed(2)}</td>
                        <td className="px-8 py-4">
                          <button onClick={() => startEditing(debt)} className="text-blue-400 hover:text-blue-300 mr-4 text-xs uppercase tracking-widest">Edit</button>
                          <button onClick={() => handleDeleteDebt(debt.id)} className="text-red-400 hover:text-red-300 text-xs uppercase tracking-widest">Delete</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Repayment Strategy */}
      {debts.length > 0 && (
        <div className="border border-gray-700 p-8 bg-black">
          <h3 className="text-lg font-bold mb-6 uppercase tracking-wide">Repayment Strategy</h3>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400 block mb-4">Choose Method</label>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="strategy"
                    checked={strategy === 'avalanche'}
                    onChange={() => setStrategy('avalanche')}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-white group-hover:text-blue-400 transition">Avalanche Method</p>
                    <p className="text-xs text-gray-400">Pay highest interest rate first. Saves the most money.</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="strategy"
                    checked={strategy === 'snowball'}
                    onChange={() => setStrategy('snowball')}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-white group-hover:text-blue-400 transition">Snowball Method</p>
                    <p className="text-xs text-gray-400">Pay smallest balance first. Quick wins for motivation.</p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400 block mb-3">Monthly Payment</label>
              <input
                type="number"
                step="0.01"
                value={monthlyPayment}
                onChange={(e) => setMonthlyPayment(e.target.value)}
                placeholder={`Min: $${totalMinPayments.toFixed(2)}`}
                className="w-full bg-black border border-gray-600 text-white px-4 py-3 focus:border-blue-400 focus:outline-none transition mb-2"
              />
              <p className="text-xs text-gray-500">Minimum required: ${totalMinPayments.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={calculatePayments} className="btn-ghost">
              Calculate Payments
            </button>
            <button onClick={handleSavePlan} className="btn-ghost">
              Save Plan
            </button>
          </div>
        </div>
      )}

      {/* Payment Allocation */}
      {allocations.length > 0 && (
        <div className="border border-gray-700 p-8 bg-black">
          <h3 className="text-lg font-bold mb-6 uppercase tracking-wide">Monthly Payment Allocation</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Debt</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Current Balance</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-400">New Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {allocations.map((alloc, idx) => (
                  <tr key={alloc.debt.id} className="hover:bg-gray-900 transition">
                    <td className="px-4 py-3 text-sm text-gray-400">#{idx + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-200">{alloc.debt.name}</td>
                    <td className="px-4 py-3 text-sm text-red-400">${alloc.debt.balance.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-blue-400">${alloc.payment.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-200">${alloc.newBalance.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payoff Timeline */}
      {payoffInfo && (
        <div className="border border-gray-700 p-8 bg-black">
          <h3 className="text-lg font-bold mb-6 uppercase tracking-wide">Payoff Timeline</h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="border border-blue-400 p-6">
              <p className="text-xs uppercase tracking-widest text-blue-300 mb-2">Debt Free In</p>
              <p className="text-4xl font-bold text-blue-400">{payoffInfo.monthsToPayoff}</p>
              <p className="text-sm text-gray-400 mt-1">months</p>
            </div>
            <div className="border border-gray-700 p-6">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Debt Free Date</p>
              <p className="text-2xl font-bold text-white">{payoffInfo.payoffDate}</p>
            </div>
            <div className="border border-gray-700 p-6">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Est. Total Interest</p>
              <p className="text-2xl font-bold text-red-400">${payoffInfo.totalInterest.toFixed(2)}</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-700">
            <button onClick={handleCommitToBudget} className="btn-ghost">
              Commit ${monthlyPayment} to {month} Budget
            </button>
            <p className="text-xs text-gray-500 mt-3">This will add a "Debt Payments" category to your budget for this month.</p>
          </div>
        </div>
      )}
    </div>
  )
}
