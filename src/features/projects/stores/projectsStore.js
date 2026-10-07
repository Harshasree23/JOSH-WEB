import { create } from 'zustand'
import { supabase } from '../../../core/lib/supabase'

export const useProjectsStore = create((set, get) => ({
  projects: [],
  tasks: [],
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null })
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (projectsError) throw projectsError

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')

      if (tasksError) throw tasksError

      set({ 
        projects: projectsData || [], 
        tasks: tasksData || [],
        loading: false 
      })
    } catch (error) {
      console.error('Error fetching projects:', error)
      set({ error: error.message, loading: false })
    }
  },

  addProject: async ({ name, description }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: { message: 'Not authenticated' } }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding project:', error)
      return { error }
    }

    set((state) => ({ projects: [data, ...state.projects] }))
    return { data, error: null }
  },

  updateProject: async (projectId, updates) => {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single()

    if (error) {
      console.error('Error updating project:', error)
      return { error }
    }

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, ...data } : p
      ),
    }))
    return { data, error: null }
  },

  deleteProject: async (projectId) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      console.error('Error deleting project:', error)
      return { error }
    }

    set((state) => ({
      projects: state.projects.filter((p) => p.id !== projectId),
      tasks: state.tasks.filter((t) => t.project_id !== projectId)
    }))
    return { error: null }
  },

  addTask: async ({ projectId, parentTaskId, title, description }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: { message: 'Not authenticated' } }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        project_id: projectId,
        parent_task_id: parentTaskId || null,
        title,
        description: description || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding task:', error)
      return { error }
    }

    set((state) => ({ tasks: [...state.tasks, data] }))
    return { data, error: null }
  },

  updateTask: async (taskId, updates) => {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single()

    if (error) {
      console.error('Error updating task:', error)
      return { error }
    }

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, ...data } : t
      ),
    }))
    return { data, error: null }
  },

  toggleTaskCompletion: async (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId)
    if (!task) return

    const { data, error } = await supabase
      .from('tasks')
      .update({ is_completed: !task.is_completed })
      .eq('id', taskId)
      .select()
      .single()

    if (!error) {
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, is_completed: data.is_completed } : t
        ),
      }))
    }
  },

  deleteTask: async (taskId) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) {
      console.error('Error deleting task:', error)
      return { error }
    }

    // Since tasks have on delete cascade for parent_task_id, we should just refetch or optimistically clear children
    // Optimistic recursive delete:
    const deleteIds = new Set([taskId])
    let added = true
    const allTasks = get().tasks
    while (added) {
      added = false
      allTasks.forEach(t => {
        if (t.parent_task_id && deleteIds.has(t.parent_task_id) && !deleteIds.has(t.id)) {
          deleteIds.add(t.id)
          added = true
        }
      })
    }

    set((state) => ({
      tasks: state.tasks.filter((t) => !deleteIds.has(t.id)),
    }))
    return { error: null }
  },
}))
