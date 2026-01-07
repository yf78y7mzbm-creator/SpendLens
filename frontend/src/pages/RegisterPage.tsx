import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface RegisterPageProps {
  onSwitchToLogin: () => void
}

export default function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      await register(email, password, name || undefined)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to register')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <img src="/spendlens-logo.png" alt="SpendLens" className="h-16 mx-auto" />
        </div>

        <div className="border border-gray-700 p-8 bg-black">
          <h2 className="text-2xl font-bold mb-6">Create Account</h2>

          {error && (
            <div className="mb-6 p-4 border border-red-600 bg-red-900 bg-opacity-20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400 block mb-3">
                Name (Optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-black border border-gray-600 text-white px-4 py-3 focus:border-blue-400 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400 block mb-3">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-black border border-gray-600 text-white px-4 py-3 focus:border-blue-400 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400 block mb-3">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                className="w-full bg-black border border-gray-600 text-white px-4 py-3 focus:border-blue-400 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400 block mb-3">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                className="w-full bg-black border border-gray-600 text-white px-4 py-3 focus:border-blue-400 focus:outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-ghost w-full justify-center disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-blue-400 hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
