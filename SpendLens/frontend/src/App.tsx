import { useState } from 'react'
import PlanPhase from './components/PlanPhase'
import ReviewPhase from './components/ReviewPhase'
import DashboardPhase from './components/DashboardPhase'

export type Phase = 'plan' | 'review' | 'dashboard'

function App() {
  const [currentPhase, setCurrentPhase] = useState<Phase>('plan')
  const [userId] = useState('demo-user')
  const [currentMonth] = useState(new Date().toISOString().slice(0, 7))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">SpendLens</h1>
          <p className="text-sm text-gray-500 mt-1">Monthly Budgeting & Surplus Tracking</p>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setCurrentPhase('plan')}
              className={`px-1 py-4 font-medium text-sm border-b-2 ${
                currentPhase === 'plan'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📋 Plan
            </button>
            <button
              onClick={() => setCurrentPhase('review')}
              className={`px-1 py-4 font-medium text-sm border-b-2 ${
                currentPhase === 'review'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Review
            </button>
            <button
              onClick={() => setCurrentPhase('dashboard')}
              className={`px-1 py-4 font-medium text-sm border-b-2 ${
                currentPhase === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📈 Insights
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {currentPhase === 'plan' && <PlanPhase userId={userId} month={currentMonth} />}
        {currentPhase === 'review' && <ReviewPhase userId={userId} month={currentMonth} />}
        {currentPhase === 'dashboard' && <DashboardPhase userId={userId} month={currentMonth} />}
      </main>
    </div>
  )
}

export default App
