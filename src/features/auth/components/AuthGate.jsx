import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'

export default function AuthGate({ children }) {
  const { session, loading, initialize, signIn, signUp } = useAuthStore()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    initialize()
  }, [initialize])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password)
        if (error) setError(error.message)
      } else {
        if (!username.trim()) {
          setError('Username is required')
          return
        }
        const { error } = await signUp(email, password, username)
        if (error) setError(error.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (session) return children

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6">Pillar</h1>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError('') }}
              className={`flex-1 py-2 rounded text-sm font-medium ${
                mode === 'signin' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError('') }}
              className={`flex-1 py-2 rounded text-sm font-medium ${
                mode === 'signup' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                required
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              required
              minLength={6}
            />

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-gray-900 text-white rounded text-sm font-medium disabled:opacity-50"
            >
              {submitting ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
