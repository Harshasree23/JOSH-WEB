import { create } from 'zustand';
import { supabase } from '../../../core/lib/supabase';

export const useCalendarGoalsStore = create((set, get) => ({
  goals: [],
  loading: false,
  error: null,

  // ── Fetch ──────────────────────────────────────────────────────────────────
  // Fetches goals whose range overlaps [rangeStart, rangeEnd] (date strings or Date objects).
  fetchGoals: async (rangeStart, rangeEnd) => {
    set({ loading: true, error: null });
    try {
      const start = toDateStr(rangeStart);
      const end   = toDateStr(rangeEnd);

      const { data, error } = await supabase
        .from('calendar_goals')
        .select('*')
        // overlapping: goal starts before range end AND goal ends after range start
        .lte('start_date', end)
        .gte('end_date', start)
        .order('start_date');

      if (error) throw error;
      set({ goals: data || [], loading: false });
    } catch (err) {
      console.error('Error fetching calendar goals:', err);
      set({ error: err.message, loading: false });
    }
  },

  // ── Add ────────────────────────────────────────────────────────────────────
  addGoal: async ({ type, startDate, endDate, name, description, color, hasReminder, reminderDate }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: { message: 'Not authenticated' } };

    const { data, error } = await supabase
      .from('calendar_goals')
      .insert({
        user_id:      user.id,
        start_date:   toDateStr(startDate),
        end_date:     toDateStr(endDate),
        goal_type:    type,
        name:         name.trim(),
        description:  description?.trim() || null,
        color:        color || '#475569',
        has_reminder: hasReminder || false,
        reminder_date: hasReminder && reminderDate ? reminderDate : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding calendar goal:', error);
      return { error };
    }

    set((state) => ({
      goals: [...state.goals, data].sort(
        (a, b) => new Date(a.start_date) - new Date(b.start_date)
      ),
    }));
    return { data, error: null };
  },

  // ── Delete ─────────────────────────────────────────────────────────────────
  deleteGoal: async (id) => {
    const { error } = await supabase
      .from('calendar_goals')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting calendar goal:', error);
      return { error };
    }

    set((state) => ({ goals: state.goals.filter((g) => g.id !== id) }));
    return { error: null };
  },

  // ── Local helpers (used by views) ──────────────────────────────────────────
  getGoalsInRange: (rangeStart, rangeEnd) => {
    const s = new Date(rangeStart).getTime();
    const e = new Date(rangeEnd).getTime();
    return get().goals.filter((g) => {
      const gs = new Date(g.start_date + 'T00:00:00').getTime();
      const ge = new Date(g.end_date   + 'T00:00:00').getTime();
      return gs <= e && ge >= s;
    });
  },
}));

// ── util ──────────────────────────────────────────────────────────────────────
function toDateStr(date) {
  if (typeof date === 'string') return date;
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];
}
