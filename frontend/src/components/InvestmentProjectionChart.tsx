import { useState, useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface InvestmentProjectionChartProps {
  monthlySurplus: number
}

interface DataPoint {
  year: number
  invested: number
  savings: number
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`
  }
  return `$${value.toFixed(0)}`
}

const formatFullCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function InvestmentProjectionChart({ monthlySurplus }: InvestmentProjectionChartProps) {
  const [annualReturn, setAnnualReturn] = useState(10)
  const years = 30

  const data = useMemo<DataPoint[]>(() => {
    const monthlyRate = annualReturn / 100 / 12
    const result: DataPoint[] = []

    for (let year = 0; year <= years; year++) {
      const months = year * 12

      // Compound growth with monthly contributions
      // FV = P * [(1 + r)^n - 1] / r
      let invested = 0
      if (monthlyRate > 0 && months > 0) {
        invested = monthlySurplus * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
      }

      // Just savings (no growth)
      const savings = monthlySurplus * months

      result.push({
        year,
        invested: Math.round(invested),
        savings: Math.round(savings),
      })
    }

    return result
  }, [monthlySurplus, annualReturn])

  const finalInvested = data[data.length - 1]?.invested || 0
  const finalSavings = data[data.length - 1]?.savings || 0
  const growthBenefit = finalInvested - finalSavings

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-blue-400 p-4 shadow-lg">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Year {label}</p>
          <p className="text-sm text-blue-400">
            Invested: <span className="font-bold">{formatFullCurrency(payload[0]?.value || 0)}</span>
          </p>
          <p className="text-sm text-gray-400">
            Savings Only: <span className="font-bold">{formatFullCurrency(payload[1]?.value || 0)}</span>
          </p>
        </div>
      )
    }
    return null
  }

  if (monthlySurplus <= 0) {
    return (
      <div className="border border-gray-700 p-8 bg-black">
        <h3 className="text-lg font-bold mb-6 uppercase tracking-wide">Investment Projection</h3>
        <div className="border border-gray-700 p-8 text-center">
          <p className="text-gray-400 text-sm mb-2">Start building your surplus to see your investment potential</p>
          <p className="text-xs text-gray-500">A positive monthly surplus can grow significantly over time when invested</p>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-gray-700 p-8 bg-black">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold uppercase tracking-wide">Investment Projection</h3>
          <p className="text-sm text-gray-400 mt-1">
            If you invest {formatFullCurrency(monthlySurplus)}/month in the S&P 500
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">30-Year Value</p>
          <p className="text-2xl font-bold text-blue-400">{formatFullCurrency(finalInvested)}</p>
          <p className="text-xs text-green-400">+{formatFullCurrency(growthBenefit)} from growth</p>
        </div>
      </div>

      {/* Annual Return Slider */}
      <div className="mb-8 pb-6 border-b border-gray-700">
        <div className="flex justify-between items-center mb-3">
          <label className="text-xs uppercase tracking-widest text-gray-400">Annual Return</label>
          <span className="text-sm font-bold text-blue-400">{annualReturn}%</span>
        </div>
        <input
          type="range"
          min="7"
          max="12"
          step="0.5"
          value={annualReturn}
          onChange={(e) => setAnnualReturn(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-400"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>7%</span>
          <span>10% (avg)</span>
          <span>12%</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="investedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6B7280" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6B7280" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="year"
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickLine={{ stroke: '#374151' }}
              axisLine={{ stroke: '#374151' }}
              label={{ value: 'Years', position: 'insideBottom', offset: -5, fill: '#9CA3AF', fontSize: 11 }}
            />
            <YAxis
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickLine={{ stroke: '#374151' }}
              axisLine={{ stroke: '#374151' }}
              tickFormatter={formatCurrency}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => (
                <span className="text-xs uppercase tracking-widest text-gray-400">{value}</span>
              )}
            />
            <Area
              type="monotone"
              dataKey="invested"
              name="With Investment"
              stroke="#60A5FA"
              strokeWidth={2}
              fill="url(#investedGradient)"
            />
            <Area
              type="monotone"
              dataKey="savings"
              name="Savings Only"
              stroke="#6B7280"
              strokeWidth={2}
              fill="url(#savingsGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-700">
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Total Contributed</p>
          <p className="text-xl font-bold text-white">{formatFullCurrency(finalSavings)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Investment Growth</p>
          <p className="text-xl font-bold text-green-400">{formatFullCurrency(growthBenefit)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Growth Multiple</p>
          <p className="text-xl font-bold text-blue-400">{(finalInvested / finalSavings).toFixed(1)}x</p>
        </div>
      </div>
    </div>
  )
}
