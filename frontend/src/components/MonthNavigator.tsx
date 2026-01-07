import { useState } from 'react'

interface MonthNavigatorProps {
  currentMonth: string // Format: YYYY-MM
  onMonthChange: (month: string) => void
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function MonthNavigator({ currentMonth, onMonthChange }: MonthNavigatorProps) {
  const [showDropdown, setShowDropdown] = useState(false)

  // Parse current month
  const [year, month] = currentMonth.split('-').map(Number)
  const monthName = MONTHS[month - 1]

  // Generate list of months (current month and 24 months back)
  const generateMonthOptions = () => {
    const options = []
    const now = new Date()
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const y = d.getFullYear()
      const m = d.getMonth() + 1
      options.push({
        value: `${y}-${m.toString().padStart(2, '0')}`,
        label: `${MONTHS[m - 1]} ${y}`
      })
    }
    return options
  }

  const handlePrevMonth = () => {
    const d = new Date(year, month - 2, 1)
    const newMonth = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`
    onMonthChange(newMonth)
  }

  const handleNextMonth = () => {
    const d = new Date(year, month, 1)
    const newMonth = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`
    onMonthChange(newMonth)
  }

  const handleSelectMonth = (value: string) => {
    onMonthChange(value)
    setShowDropdown(false)
  }

  // Check if we're at the current month (can't go forward)
  const now = new Date()
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  return (
    <div className="flex items-center gap-4">
      {/* Previous Month Button */}
      <button
        onClick={handlePrevMonth}
        className="p-2 text-gray-400 hover:text-white transition"
        aria-label="Previous month"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Month Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-600 bg-black text-white hover:border-blue-400 transition min-w-48 justify-center"
        >
          <span className="text-sm font-medium">{monthName} {year}</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDropdown && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowDropdown(false)}
            />
            {/* Dropdown */}
            <div className="absolute top-full left-0 mt-1 w-full bg-black border border-gray-600 max-h-64 overflow-y-auto z-20">
              {generateMonthOptions().map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelectMonth(option.value)}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-800 transition ${
                    option.value === currentMonth ? 'text-blue-400 bg-gray-900' : 'text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Next Month Button */}
      <button
        onClick={handleNextMonth}
        disabled={isCurrentMonth}
        className={`p-2 transition ${
          isCurrentMonth
            ? 'text-gray-700 cursor-not-allowed'
            : 'text-gray-400 hover:text-white'
        }`}
        aria-label="Next month"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
