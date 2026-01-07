import { useState } from 'react'
import PlanPhase from './components/PlanPhase'
import ReviewPhase from './components/ReviewPhase'
import DashboardPhase from './components/DashboardPhase'
import DebtPhase from './components/DebtPhase'
import MonthNavigator from './components/MonthNavigator'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { AuthProvider, useAuth } from './contexts/AuthContext'

export type Phase = 'plan' | 'review' | 'dashboard' | 'debt'
type AuthPage = 'login' | 'register'

function MainApp() {
  const { user, logout } = useAuth()
  const [currentPhase, setCurrentPhase] = useState<Phase>('plan')
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7))

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-700 px-8 py-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <img src="/spendlens-logo.png" alt="SpendLens" className="h-14" />
          </div>
          <div className="flex items-center gap-6">
            <MonthNavigator currentMonth={currentMonth} onMonthChange={setCurrentMonth} />
            <div className="flex items-center gap-4 border-l border-gray-700 pl-6">
              <span className="text-sm text-gray-400">{user?.email}</span>
              <button
                onClick={logout}
                className="text-xs uppercase tracking-widest text-gray-400 hover:text-white transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Phase Selector */}
      <div className="border-b border-gray-700 px-8 py-4">
        <div className="max-w-6xl mx-auto flex gap-8">
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
          <button
            onClick={() => setCurrentPhase('debt')}
            className={`text-xs uppercase tracking-widest font-medium pb-2 border-b-2 transition ${
              currentPhase === 'debt'
                ? 'border-blue-400 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Debt Planner
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-8 py-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {currentPhase === 'plan' && <PlanPhase month={currentMonth} />}
          {currentPhase === 'review' && <ReviewPhase month={currentMonth} />}
          {currentPhase === 'dashboard' && <DashboardPhase month={currentMonth} />}
          {currentPhase === 'debt' && <DebtPhase month={currentMonth} />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-700 px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs text-gray-500 uppercase tracking-widest">© 2025 SpendLens. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function AppContent() {
  const { user, isLoading } = useAuth()
  const [authPage, setAuthPage] = useState<AuthPage>('login')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <img src="/spendlens-logo.png" alt="SpendLens" className="h-12 mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    if (authPage === 'login') {
      return <LoginPage onSwitchToRegister={() => setAuthPage('register')} />
    }
    return <RegisterPage onSwitchToLogin={() => setAuthPage('login')} />
  }

  return <MainApp />
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
