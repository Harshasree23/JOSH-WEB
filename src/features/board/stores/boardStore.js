import { create } from 'zustand'
import { supabase } from '../../../core/lib/supabase'

export const useBoardStore = create((set, get) => ({
  events: [],
  loading: false,
  error: null,

  fetchEvents: async (date) => {
    set({ loading: true, error: null })
    try {
      const dateStr = date instanceof Date
        ? new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0]
        : date

      const { data, error } = await supabase
        .from('board_events')
        .select('*')
        .eq('event_date', dateStr)
        .order('start_px')

      if (error) throw error
      set({ events: data || [], loading: false })
    } catch (error) {
      console.error('Error fetching board events:', error)
      set({ error: error.message, loading: false })
    }
  },

  addEvent: async ({ name, description, startPx, endPx, date, color }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: { message: 'Not authenticated' } }

    // Ensure profile exists (may be missing after schema recreation)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      const username = user.user_metadata?.username ||
        user.email?.split('@')[0] || 'user'
      // Try upsert profile
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })
        .select()
        .single()

      if (upsertError) {
        // Username conflict – retry with unique suffix
        console.warn('Profile upsert failed, retrying with unique username:', upsertError.message)
        const suffix = Date.now().toString(36).slice(-4)
        const { error: retryError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            username: `${username}_${suffix}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          })
          .select()
          .single()
        if (retryError) {
          console.error('Error ensuring profile after retry:', retryError)
          return { error: { message: 'Failed to create user profile. Try signing out and back in.' } }
        }
      }
    }

    const dateStr = date instanceof Date
      ? new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0]
      : date

    const { data, error } = await supabase
      .from('board_events')
      .insert({
        user_id: user.id,
        event_date: dateStr,
        name,
        description: description || null,
        start_px: Math.round(Math.min(startPx, endPx)),
        end_px: Math.round(Math.max(startPx, endPx)),
        color: color || '#4B5563',
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding board event:', error)
      return { error }
    }

    set((state) => ({
      events: [...state.events, data].sort((a, b) => a.start_px - b.start_px),
    }))
    return { data, error: null }
  },

  deleteEvent: async (eventId) => {
    const { error } = await supabase
      .from('board_events')
      .delete()
      .eq('id', eventId)

    if (error) {
      console.error('Error deleting board event:', error)
      return { error }
    }

    set((state) => ({
      events: state.events.filter((e) => e.id !== eventId),
    }))
    return { error: null }
  },

  // Get a summary for dashboard: total events and hours planned for a given date
  getSummary: () => {
    const events = get().events
    const totalEvents = events.length
    // 1440px = 24 hours, so 1px = 1 minute
    const totalMinutes = events.reduce((sum, e) => sum + (e.end_px - e.start_px), 0)
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10
    return { totalEvents, totalHours, totalMinutes }
  },
}))
