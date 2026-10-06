import { create } from 'zustand'
import { supabase } from '../../../core/lib/supabase'

export const EXPENSE_CATEGORIES = [
  { slug: 'food',          label: 'Food & Dining',   icon: '🍔', color: '#F59E0B' },
  { slug: 'travel',        label: 'Travel',           icon: '✈️',  color: '#3B82F6' },
  { slug: 'essentials',    label: 'Essentials',       icon: '🏠', color: '#10B981' },
  { slug: 'clothing',      label: 'Clothing',         icon: '👗', color: '#EC4899' },
  { slug: 'stationery',    label: 'Stationery',       icon: '✏️',  color: '#8B5CF6' },
  { slug: 'health',        label: 'Health',           icon: '💊', color: '#EF4444' },
  { slug: 'groceries',     label: 'Groceries',        icon: '🛒', color: '#22C55E' },
  { slug: 'subscriptions', label: 'Subscriptions',    icon: '📺', color: '#06B6D4' },
  { slug: 'entertainment', label: 'Entertainment',    icon: '🎮', color: '#A855F7' },
  { slug: 'education',     label: 'Education',        icon: '📚', color: '#0EA5E9' },
  { slug: 'transport',     label: 'Transport',        icon: '🚗', color: '#F97316' },
  { slug: 'utilities',     label: 'Utilities',        icon: '💡', color: '#84CC16' },
  { slug: 'other',         label: 'Other',            icon: '📦', color: '#6B7280' },
]

export const getCategoryMeta = (slug) =>
  EXPENSE_CATEGORIES.find((c) => c.slug === slug) || EXPENSE_CATEGORIES.at(-1)

export const useMoneyStore = create((set, get) => ({
  wallet:       null,
  transactions: [],
  groups:       [],
  loading:      false,
  error:        null,

  // ── Wallet ──────────────────────────────────────────────────────────────

  fetchWallet: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase
      .from('money_wallets')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!error) set({ wallet: data })
  },

  createOrUpdateWallet: async ({ name, balance, currency }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: { message: 'Not authenticated' } }
    const { data, error } = await supabase
      .from('money_wallets')
      .upsert(
        { user_id: user.id, name: name || 'My Wallet', balance: Number(balance) || 0, currency: currency || 'INR', updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
      .select()
      .single()
    if (error) return { error }
    set({ wallet: data })
    return { data, error: null }
  },

  // ── Groups ───────────────────────────────────────────────────────────────

  fetchGroups: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase
      .from('expense_groups')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (!error) set({ groups: data || [] })
  },

  addGroup: async ({ name, description, color, icon }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: { message: 'Not authenticated' } }
    const { data, error } = await supabase
      .from('expense_groups')
      .insert({ user_id: user.id, name: name.trim(), description: description?.trim() || null, color: color || '#374151', icon: icon || '📁' })
      .select()
      .single()
    if (error) return { error }
    set((s) => ({ groups: [data, ...s.groups] }))
    return { data, error: null }
  },

  updateGroup: async (groupId, { name, description, color, icon }) => {
    const { data, error } = await supabase
      .from('expense_groups')
      .update({ name: name.trim(), description: description?.trim() || null, color, icon, updated_at: new Date().toISOString() })
      .eq('id', groupId)
      .select()
      .single()
    if (error) return { error }
    set((s) => ({ groups: s.groups.map((g) => (g.id === groupId ? data : g)) }))
    return { data, error: null }
  },

  deleteGroup: async (groupId) => {
    const { error } = await supabase.from('expense_groups').delete().eq('id', groupId)
    if (error) return { error }
    set((s) => ({ groups: s.groups.filter((g) => g.id !== groupId) }))
    return { error: null }
  },

  // ── Transactions ─────────────────────────────────────────────────────────

  fetchTransactions: async () => {
    set({ loading: true })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { set({ loading: false }); return }
    const { data, error } = await supabase
      .from('expense_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('tx_date', { ascending: false })
      .order('created_at', { ascending: false })
    set({ transactions: data || [], loading: false, error: error?.message || null })
  },

  addTransaction: async ({ txType, category, description, whatIGot, amount, txDate, groupId }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: { message: 'Not authenticated' } }
    const { data, error } = await supabase
      .from('expense_transactions')
      .insert({
        user_id:     user.id,
        group_id:    groupId || null,
        tx_type:     txType || 'expense',
        category:    txType === 'credit' ? 'other' : category,
        description: description.trim(),
        what_i_got:  whatIGot?.trim() || null,
        amount:      Number(amount),
        tx_date:     txDate || new Date().toISOString().split('T')[0],
      })
      .select()
      .single()
    if (error) return { error }
    set((s) => ({ transactions: [data, ...s.transactions] }))
    return { data, error: null }
  },

  updateTransaction: async (txId, { txType, category, description, whatIGot, amount, txDate, groupId }) => {
    const { data, error } = await supabase
      .from('expense_transactions')
      .update({
        group_id:    groupId || null,
        tx_type:     txType || 'expense',
        category:    txType === 'credit' ? 'other' : category,
        description: description.trim(),
        what_i_got:  whatIGot?.trim() || null,
        amount:      Number(amount),
        tx_date:     txDate,
        updated_at:  new Date().toISOString(),
      })
      .eq('id', txId)
      .select()
      .single()
    if (error) return { error }
    set((s) => ({ transactions: s.transactions.map((t) => (t.id === txId ? data : t)) }))
    return { data, error: null }
  },

  deleteTransaction: async (txId) => {
    const { error } = await supabase.from('expense_transactions').delete().eq('id', txId)
    if (error) return { error }
    set((s) => ({ transactions: s.transactions.filter((t) => t.id !== txId) }))
    return { error: null }
  },

  // ── Computed ─────────────────────────────────────────────────────────────

  getTotals: () => {
    const { wallet, transactions } = get()
    const startingBalance = wallet ? Number(wallet.balance) : 0
    const totalSpent  = transactions
      .filter((t) => t.tx_type !== 'credit')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const totalCredit = transactions
      .filter((t) => t.tx_type === 'credit')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    return {
      startingBalance,
      totalSpent,
      totalCredit,
      remaining: startingBalance + totalCredit - totalSpent,
    }
  },

  getByCategory: () => {
    const { transactions } = get()
    const map = {}
    transactions
      .filter((t) => t.tx_type !== 'credit')
      .forEach((t) => {
        if (!map[t.category]) map[t.category] = 0
        map[t.category] += Number(t.amount)
      })
    return map
  },
}))
