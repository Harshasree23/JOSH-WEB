import { create } from 'zustand'
import { supabase } from '../../../core/lib/supabase'

export const useHabitsStore = create((set, get) => ({
  habits: [],
  categories: [],
  loading: false,
  error: null,

  fetchCategories: async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order')

    if (error) {
      console.error('Error fetching categories:', error)
      return
    }
    set({ categories: data || [] })
  },

  fetchHabits: async () => {
    set({ loading: true, error: null })
    try {
      // Fetch habits with their category info and streak data
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select(`
          *,
          categories ( slug, display_name, icon, color_hex ),
          habit_streaks ( current_streak, longest_streak, last_completed_date )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (habitsError) throw habitsError

      // Fetch today's logs to know completion status
      const today = new Date().toISOString().split('T')[0]
      const { data: logsData } = await supabase
        .from('habit_logs')
        .select('habit_id, completed, actual_value')
        .eq('log_date', today)

      const logsMap = {}
      if (logsData) {
        logsData.forEach((log) => {
          logsMap[log.habit_id] = log
        })
      }

      // Merge everything together
      const habits = (habitsData || []).map((habit) => ({
        ...habit,
        category: habit.categories,
        streak: habit.habit_streaks?.[0] || { current_streak: 0, longest_streak: 0 },
        todayLog: logsMap[habit.id] || null,
      }))

      set({ habits, loading: false })
    } catch (error) {
      console.error('Error fetching habits:', error)
      set({ error: error.message, loading: false })
    }
  },

  addHabit: async ({ name, description, categoryId, isQuantifiable, baselineTarget, unit, frequency }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: { message: 'Not authenticated' } }

    // Ensure the profile row exists (may be missing after schema recreation)
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

    const { data, error } = await supabase
      .from('habits')
      .insert({
        user_id: user.id,
        category_id: categoryId,
        name,
        description: description || null,
        is_quantifiable: isQuantifiable || false,
        baseline_target: isQuantifiable ? baselineTarget : null,
        unit: isQuantifiable ? unit : null,
        frequency: frequency || 'daily',
      })
      .select(`
        *,
        categories ( slug, display_name, icon, color_hex )
      `)
      .single()

    if (error) {
      console.error('Error adding habit:', error)
      return { error }
    }

    // Add to local state
    const newHabit = {
      ...data,
      category: data.categories,
      streak: { current_streak: 0, longest_streak: 0 },
      todayLog: null,
    }
    set((state) => ({ habits: [newHabit, ...state.habits] }))
    return { data: newHabit, error: null }
  },

  updateHabit: async (habitId, { name, description, categoryId, isQuantifiable, baselineTarget, unit, frequency }) => {
    const updates = {
      name,
      description: description || null,
      category_id: categoryId,
      is_quantifiable: isQuantifiable || false,
      baseline_target: isQuantifiable ? baselineTarget : null,
      unit: isQuantifiable ? unit : null,
      frequency: frequency || 'daily',
    }

    const { data, error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', habitId)
      .select(`
        *,
        categories ( slug, display_name, icon, color_hex )
      `)
      .single()

    if (error) {
      console.error('Error updating habit:', error)
      return { error }
    }

    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === habitId
          ? { ...h, ...data, category: data.categories }
          : h
      ),
    }))
    return { data, error: null }
  },

  deleteHabit: async (habitId) => {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId)

    if (error) {
      console.error('Error deleting habit:', error)
      return { error }
    }

    set((state) => ({
      habits: state.habits.filter((h) => h.id !== habitId),
    }))
    return { error: null }
  },

  toggleHabitLog: async (habitId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date().toISOString().split('T')[0]
    const habit = get().habits.find((h) => h.id === habitId)
    const isCompleted = habit?.todayLog?.completed

    if (isCompleted) {
      // Uncomplete: update existing log
      const { error } = await supabase
        .from('habit_logs')
        .update({ completed: false })
        .eq('habit_id', habitId)
        .eq('log_date', today)

      if (!error) {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === habitId
              ? { ...h, todayLog: { ...h.todayLog, completed: false } }
              : h
          ),
        }))
      }
    } else {
      // Complete: upsert a log
      const { data, error } = await supabase
        .from('habit_logs')
        .upsert(
          {
            habit_id: habitId,
            user_id: user.id,
            log_date: today,
            completed: true,
          },
          { onConflict: 'habit_id,log_date' }
        )
        .select()
        .single()

      if (!error) {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === habitId
              ? { ...h, todayLog: data }
              : h
          ),
        }))
        // Refresh to get updated streak
        setTimeout(() => get().fetchHabits(), 500)
      }
    }
  },

  archiveHabit: async (habitId) => {
    const { error } = await supabase
      .from('habits')
      .update({ is_active: false, archived_at: new Date().toISOString() })
      .eq('id', habitId)

    if (!error) {
      set((state) => ({
        habits: state.habits.filter((h) => h.id !== habitId),
      }))
    }
    return { error }
  },
}))
