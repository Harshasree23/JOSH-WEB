import { create } from 'zustand'
import { supabase } from '../../../core/lib/supabase'

export const useGoalsStore = create((set, get) => ({
  goals: [],
  goalHabits: [],
  goalProjects: [],
  goalTasks: [],
  loading: false,
  error: null,

  fetchGoals: async () => {
    set({ loading: true, error: null })
    try {
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false })
      if (goalsError) throw goalsError

      const { data: habitsData, error: habitsError } = await supabase
        .from('goal_habits')
        .select('*')
      if (habitsError) throw habitsError

      const { data: projectsData, error: projectsError } = await supabase
        .from('goal_projects')
        .select('*')
      if (projectsError) throw projectsError

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .not('goal_id', 'is', null)
      if (tasksError) throw tasksError

      set({ 
        goals: goalsData || [], 
        goalHabits: habitsData || [],
        goalProjects: projectsData || [],
        goalTasks: tasksData || [],
        loading: false 
      })
    } catch (error) {
      console.error('Error fetching goals:', error)
      set({ error: error.message, loading: false })
    }
  },

  addGoal: async ({ name, description, targetValue, targetUnit, startDate, endDate, frequency }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: { message: 'Not authenticated' } }

    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        target_value: targetValue || null,
        target_unit: targetUnit || null,
        time_period_start: startDate || null,
        time_period_end: endDate || null,
        frequency: frequency || 'daily',
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding goal:', error)
      return { error }
    }

    set((state) => ({ goals: [data, ...state.goals] }))
    return { data, error: null }
  },

  updateGoal: async (goalId, updates) => {
    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', goalId)
      .select()
      .single()

    if (error) {
      console.error('Error updating goal:', error)
      return { error }
    }

    set((state) => ({
      goals: state.goals.map((g) => g.id === goalId ? { ...g, ...data } : g),
    }))
    return { data, error: null }
  },

  deleteGoal: async (goalId) => {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId)

    if (error) {
      console.error('Error deleting goal:', error)
      return { error }
    }

    set((state) => ({
      goals: state.goals.filter((g) => g.id !== goalId),
      goalHabits: state.goalHabits.filter((h) => h.goal_id !== goalId),
      goalProjects: state.goalProjects.filter((p) => p.goal_id !== goalId),
      goalTasks: state.goalTasks.filter((t) => t.goal_id !== goalId)
    }))
    return { error: null }
  },

  linkHabit: async (goalId, habitId) => {
    const { error } = await supabase.from('goal_habits').insert({ goal_id: goalId, habit_id: habitId })
    if (error) return { error }
    set((state) => ({ goalHabits: [...state.goalHabits, { goal_id: goalId, habit_id: habitId }] }))
    return { error: null }
  },
  
  unlinkHabit: async (goalId, habitId) => {
    const { error } = await supabase.from('goal_habits').delete().match({ goal_id: goalId, habit_id: habitId })
    if (error) return { error }
    set((state) => ({ goalHabits: state.goalHabits.filter(h => !(h.goal_id === goalId && h.habit_id === habitId)) }))
    return { error: null }
  },

  linkProject: async (goalId, projectId) => {
    const { error } = await supabase.from('goal_projects').insert({ goal_id: goalId, project_id: projectId })
    if (error) return { error }
    set((state) => ({ goalProjects: [...state.goalProjects, { goal_id: goalId, project_id: projectId }] }))
    return { error: null }
  },
  
  unlinkProject: async (goalId, projectId) => {
    const { error } = await supabase.from('goal_projects').delete().match({ goal_id: goalId, project_id: projectId })
    if (error) return { error }
    set((state) => ({ goalProjects: state.goalProjects.filter(p => !(p.goal_id === goalId && p.project_id === projectId)) }))
    return { error: null }
  },

  addTask: async (goalId, title) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('tasks').insert({
      user_id: user.id,
      goal_id: goalId,
      title,
    }).select().single()
    if (error) return { error }
    set((state) => ({ goalTasks: [...state.goalTasks, data] }))
    return { error: null }
  },
  
  toggleTaskCompletion: async (taskId) => {
    const task = get().goalTasks.find(t => t.id === taskId)
    if (!task) return
    const { data, error } = await supabase.from('tasks').update({ is_completed: !task.is_completed }).eq('id', taskId).select().single()
    if (!error) {
      set((state) => ({
        goalTasks: state.goalTasks.map((t) => t.id === taskId ? { ...t, is_completed: data.is_completed } : t),
      }))
    }
  },

  deleteTask: async (taskId) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (error) return { error }
    set((state) => ({ goalTasks: state.goalTasks.filter(t => t.id !== taskId) }))
    return { error: null }
  }
}))
