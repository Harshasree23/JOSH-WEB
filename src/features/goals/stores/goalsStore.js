import { create } from 'zustand'
import { supabase } from '../../../core/lib/supabase'

export const useGoalsStore = create((set, get) => ({
  goals: [],
  goalHabits: [],
  goalProjects: [],
  goalTasks: [],
  goalProgress: {},
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
      
      // Calculate progress asynchronously
      get().calculateGoalProgresses()
    } catch (error) {
      console.error('Error fetching goals:', error)
      set({ error: error.message, loading: false })
    }
  },

  calculateGoalProgresses: async () => {
    const state = get()
    const goals = state.goals
    if (!goals.length) return

    let minDate = new Date()
    let maxDate = new Date('2000-01-01')
    let hasTimePeriods = false

    goals.forEach(g => {
      if (g.time_period_start) {
        hasTimePeriods = true
        const start = new Date(g.time_period_start)
        if (start < minDate) minDate = start
      }
      if (g.time_period_end) {
        const end = new Date(g.time_period_end)
        if (end > maxDate) maxDate = end
      }
    })

    if (!hasTimePeriods) return

    const minStr = minDate.toISOString()
    const maxStr = maxDate.toISOString()

    const { data: logsData } = await supabase
      .from('habit_logs')
      .select('*')
      .gte('log_date', minStr.split('T')[0])
      .lte('log_date', maxStr.split('T')[0])

    const { data: completedTasksData } = await supabase
      .from('tasks')
      .select('id, project_id, goal_id, completed_at')
      .eq('is_completed', true)
      .not('completed_at', 'is', null)
      .gte('completed_at', minStr)
      .lte('completed_at', maxStr)

    const goalProgress = {}

    goals.forEach(goal => {
      if (!goal.time_period_start || !goal.time_period_end) {
        goalProgress[goal.id] = 0
        return
      }

      const linkedHabitIds = state.goalHabits.filter(gh => gh.goal_id === goal.id).map(gh => gh.habit_id)
      const linkedProjectIds = state.goalProjects.filter(gp => gp.goal_id === goal.id).map(gp => gp.project_id)
      const linkedStandaloneTaskIds = state.goalTasks.filter(t => t.goal_id === goal.id).map(t => t.id)

      let successfulDays = 0

      const start = new Date(goal.time_period_start)
      const end = new Date(goal.time_period_end)
      const now = new Date()
      // Use the earlier of 'end date' or 'today' as the limit for counting past days
      const endLimit = end < now ? end : now

      for (let d = new Date(start); d <= endLimit; d.setDate(d.getDate() + 1)) {
        const dStr = d.toISOString().split('T')[0]
        
        let habitsMet = true
        if (linkedHabitIds.length > 0) {
          for (const hid of linkedHabitIds) {
            const log = logsData?.find(l => l.habit_id === hid && l.log_date === dStr)
            if (!log || !log.completed) {
              habitsMet = false
              break
            }
          }
        }

        let tasksMet = true
        if (linkedProjectIds.length > 0 || linkedStandaloneTaskIds.length > 0) {
          tasksMet = false
          const anyTaskCompleted = completedTasksData?.some(t => {
            if (!t.completed_at) return false
            const tDate = new Date(t.completed_at).toISOString().split('T')[0]
            if (tDate !== dStr) return false
            if (linkedStandaloneTaskIds.includes(t.id)) return true
            if (t.project_id && linkedProjectIds.includes(t.project_id)) return true
            return false
          })
          if (anyTaskCompleted) {
            tasksMet = true
          }
        }

        const hasLinks = linkedHabitIds.length > 0 || linkedProjectIds.length > 0 || linkedStandaloneTaskIds.length > 0
        if (hasLinks && habitsMet && tasksMet) {
          successfulDays++
        }
      }

      goalProgress[goal.id] = successfulDays
    })

    set({ goalProgress })
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
