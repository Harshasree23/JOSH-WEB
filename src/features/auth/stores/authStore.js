import { create } from 'zustand'
import { supabase } from '../../../core/lib/supabase'

export const useAuthStore = create((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        set({ session, user: session.user })
        await get().fetchProfile(session.user.id)
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        set({ session, user: session?.user || null })

        if (session?.user) {
          await get().fetchProfile(session.user.id)
        } else {
          set({ profile: null })
        }
      })
    } catch (error) {
      console.error('Auth initialization error:', error)
    } finally {
      set({ loading: false })
    }
  },

  fetchProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist yet — the DB trigger should create it,
      // but if not, we create it manually
      const user = get().user
      const username = user?.user_metadata?.username ||
        user?.email?.split('@')[0] || 'user'

      const { data: newProfile } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          username,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })
        .select()
        .single()

      set({ profile: newProfile })
    } else if (data) {
      set({ profile: data })
    }
  },

  updateProfile: async (updates) => {
    const userId = get().user?.id
    if (!userId) return

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (!error && data) {
      set({ profile: data })
    }
    return { data, error }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  signUp: async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    })
    return { data, error }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null, profile: null })
  },
}))
