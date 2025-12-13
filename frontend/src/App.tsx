import { useState } from 'react'
import PlanPhase from './components/PlanPhase'
import ReviewPhase from './components/ReviewPhase'
import DashboardPhase from './components/DashboardPhase'

export type Phase = 'plan' | 'review' | 'dashboard'
// High-tech architectural design version 1.0

function App() {
  const [currentPhase, setCurrentPhase] = useState<Phase>('plan')
  const [userId] = useState('demo-user')
  const [currentMonth] = useState(new Date().toISOString().slice(0, 7))

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-700 px-8 py-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">SpendLens</h1>
            <p className="text-xs uppercase tracking-widest text-gray-500 mt-2">Monthly Budgeting & Surplus Tracking</p>
          </div>
          {/* Navigation */}
          <nav className="flex gap-6">
            <a href="#" className="text-xs uppercase tracking-widest hover:text-blue-400 transition">Portfolio</a>
            <a href="#" className="text-xs uppercase tracking-widest hover:text-blue-400 transition">Build</a>
            <a href="#" className="text-xs uppercase tracking-widest hover:text-blue-400 transition">Team</a>
            <a href="#" className="text-xs uppercase tracking-widest hover:text-blue-400 transition">Resources</a>
          </nav>
        </div>
      </header>

      {/* Phase Selector */}
      <div className="border-b border-gray-700 px-8 py-4">
        <div className="flex gap-8">
          <button
            onClick={() => setCurrentPhase('plan')}
            className={`text-xs uppercase tracking-widest font-medium pb-2 border-b-2 transition ${
              currentPhase === 'plan'
                ? 'border-blue-400 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Plan Phase
          </button>
          <button
            onClick={() => setCurrentPhase('review')}
            className={`text-xs uppercase tracking-widest font-medium pb-2 border-b-2 transition ${
              currentPhase === 'review'
                ? 'border-blue-400 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Review Phase
          </button>
          <button
            onClick={() => setCurrentPhase('dashboard')}
            className={`text-xs uppercase tracking-widest font-medium pb-2 border-b-2 transition ${
              currentPhase === 'dashboard'
                ? 'border-blue-400 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Insights
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-8 py-8 overflow-y-auto">
        {currentPhase === 'plan' && <PlanPhase userId={userId} month={currentMonth} />}
        {currentPhase === 'review' && <ReviewPhase userId={userId} month={currentMonth} />}
        {currentPhase === 'dashboard' && <DashboardPhase userId={userId} month={currentMonth} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-700 px-8 py-6">
        <p className="text-xs text-gray-500 uppercase tracking-widest">© 2025 SpendLens. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default App
