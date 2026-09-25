import { useState, useEffect } from 'react'
import { useAuthStore } from '../../auth/stores/authStore'

export default function SettingsPage() {
  const { profile, updateProfile, signOut } = useAuthStore()
  const [username, setUsername] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) setUsername(profile.username || '')
  }, [profile])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await updateProfile({ username })
    setSaving(false)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-gray-900 text-white rounded text-sm font-medium disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  )
}
