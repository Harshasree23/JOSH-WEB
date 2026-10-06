import { useEffect, useState } from 'react'
import { useMoneyStore, EXPENSE_CATEGORIES, getCategoryMeta } from '../stores/moneyStore'

/* ── helpers ─────────────────────────────────────────────────────────────── */
const fmt = (amount, currency = 'INR') => {
  const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency
  return `${symbol}${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
const todayStr = () => new Date().toISOString().split('T')[0]

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400'
const btnBase  = 'px-3 py-1.5 rounded text-sm font-medium transition-colors'
const btnPrimary = `${btnBase} bg-gray-900 text-white hover:bg-gray-700`
const btnSecondary = `${btnBase} border border-gray-300 text-gray-600 hover:bg-gray-50`

const TABS = [
  { id: 'overview',     label: 'Overview'      },
  { id: 'transactions', label: 'Transactions'  },
  { id: 'groups',       label: 'Groups'        },
]

/* ── page ─────────────────────────────────────────────────────────────────── */
export default function MoneyPage() {
  const {
    wallet, transactions, groups, loading,
    fetchWallet, fetchTransactions, fetchGroups,
  } = useMoneyStore()

  const [tab, setTab] = useState('overview')
  const [showWalletModal,    setShowWalletModal]    = useState(false)
  const [showAddTxModal,     setShowAddTxModal]     = useState(false)
  const [showAddGroupModal,  setShowAddGroupModal]  = useState(false)
  const [editTx,    setEditTx]    = useState(null)
  const [editGroup, setEditGroup] = useState(null)

  useEffect(() => {
    fetchWallet()
    fetchTransactions()
    fetchGroups()
  }, [fetchWallet, fetchTransactions, fetchGroups])

  const getTotals  = useMoneyStore((s) => s.getTotals)
  const { startingBalance, totalCredit, totalSpent, remaining } = getTotals()
  const currency   = wallet?.currency || 'INR'
  const spentPct   = startingBalance + totalCredit > 0
    ? Math.min((totalSpent / (startingBalance + totalCredit)) * 100, 100)
    : 0

  return (
    <div className="font-bubbler">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-2xl">Money</div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddTxModal(true)} className={btnPrimary}>
            <span className="text-lg leading-none mr-1">+</span> Add Expense
          </button>
          <button onClick={() => setShowWalletModal(true)} className={btnSecondary}>
            {wallet ? '✏️ Wallet' : '+ Setup Wallet'}
          </button>
        </div>
      </div>

      {/* ── Balance Summary Bar ─────────────────────────────────────────── */}
      <div className="border rounded p-4 mb-6">
        <div className="flex flex-wrap gap-6 items-center">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Starting</div>
            <div className="text-xl font-bold">{fmt(startingBalance, currency)}</div>
          </div>
          {totalCredit > 0 && (
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Added</div>
              <div className="text-xl font-bold text-green-600">+{fmt(totalCredit, currency)}</div>
            </div>
          )}
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Spent</div>
            <div className="text-xl font-bold text-red-500">{fmt(totalSpent, currency)}</div>
          </div>
          <div className="border-l pl-6">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Remaining</div>
            <div className={`text-2xl font-bold ${remaining < 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {fmt(remaining, currency)}
            </div>
          </div>
          <div className="flex-1 min-w-[120px]">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{spentPct.toFixed(1)}% spent</span>
              <span>{transactions.filter(t => t.tx_type === 'expense').length} expenses</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  spentPct > 80 ? 'bg-red-500' : spentPct > 50 ? 'bg-yellow-400' : 'bg-gray-700'
                }`}
                style={{ width: `${spentPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ──────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <OverviewTab
          transactions={transactions}
          groups={groups}
          currency={currency}
          onAddTx={() => setShowAddTxModal(true)}
        />
      )}
      {tab === 'transactions' && (
        <TransactionsTab
          transactions={transactions}
          groups={groups}
          currency={currency}
          loading={loading}
          onAdd={() => setShowAddTxModal(true)}
          onEdit={(tx) => setEditTx(tx)}
        />
      )}
      {tab === 'groups' && (
        <GroupsTab
          groups={groups}
          transactions={transactions}
          currency={currency}
          onAdd={() => setShowAddGroupModal(true)}
          onEdit={(g) => setEditGroup(g)}
        />
      )}

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      {showWalletModal && (
        <WalletModal wallet={wallet} onClose={() => setShowWalletModal(false)} />
      )}
      {(showAddTxModal || editTx) && (
        <TransactionModal
          tx={editTx}
          groups={groups}
          onClose={() => { setShowAddTxModal(false); setEditTx(null) }}
        />
      )}
      {(showAddGroupModal || editGroup) && (
        <GroupModal
          group={editGroup}
          onClose={() => { setShowAddGroupModal(false); setEditGroup(null) }}
        />
      )}
    </div>
  )
}

/* ── Overview tab ─────────────────────────────────────────────────────────── */
function OverviewTab({ transactions, groups, currency, onAddTx }) {
  const { getByCategory } = useMoneyStore()
  const byCategory = getByCategory()

  const categoryRows = EXPENSE_CATEGORIES
    .filter((c) => byCategory[c.slug])
    .map((c) => ({ ...c, total: byCategory[c.slug] }))
    .sort((a, b) => b.total - a.total)

  const maxSpend  = categoryRows[0]?.total || 1
  const recent    = [...transactions].sort((a, b) => b.tx_date > a.tx_date ? 1 : -1).slice(0, 6)

  return (
    <div className="grid md:grid-cols-2 gap-6">

      {/* Category Breakdown */}
      <div>
        <div className="text-xl mb-3">Spending by Category</div>
        {categoryRows.length === 0 ? (
          <EmptyState icon="📊" text="No expenses yet" />
        ) : (
          <div className="border rounded p-4 flex flex-col gap-3">
            {categoryRows.map((cat) => (
              <div key={cat.slug} className="flex items-center gap-3">
                <span className="text-base w-6 shrink-0 text-center">{cat.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{cat.label}</span>
                    <span className="font-semibold">{fmt(cat.total, currency)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${(cat.total / maxSpend) * 100}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right column */}
      <div className="flex flex-col gap-6">
        {/* Recent transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xl">Recent</div>
            <button onClick={onAddTx} className="text-sm text-gray-500 hover:text-gray-900">
              + Add expense
            </button>
          </div>
          {recent.length === 0 ? (
            <EmptyState icon="💸" text="No transactions yet" />
          ) : (
            <div className="border rounded divide-y divide-gray-100">
              {recent.map((tx) => {
                const cat = getCategoryMeta(tx.category)
                const isCredit = tx.tx_type === 'credit'
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-base">{isCredit ? '💵' : cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{tx.description}</div>
                      <div className="text-xs text-gray-400">{tx.tx_date}</div>
                    </div>
                    <div className={`text-sm font-bold shrink-0 ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                      {isCredit ? '+' : '-'}{fmt(tx.amount, currency)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Groups */}
        {groups.length > 0 && (
          <div>
            <div className="text-xl mb-3">Groups</div>
            <div className="border rounded divide-y divide-gray-100">
              {groups.map((g) => {
                const groupTxs = transactions.filter((t) => t.group_id === g.id)
                const total = groupTxs.reduce((s, t) => s + (t.tx_type !== 'credit' ? Number(t.amount) : 0), 0)
                return (
                  <div key={g.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-base">{g.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{g.name}</div>
                      <div className="text-xs text-gray-400">{groupTxs.length} items</div>
                    </div>
                    <div className="text-sm font-bold text-gray-700">{fmt(total, currency)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Transactions tab ────────────────────────────────────────────────────── */
function TransactionsTab({ transactions, groups, currency, loading, onAdd, onEdit }) {
  const { deleteTransaction } = useMoneyStore()

  // Filters
  const [search,       setSearch]       = useState('')
  const [filterCat,    setFilterCat]    = useState('all')
  const [filterGroup,  setFilterGroup]  = useState('all')
  const [filterType,   setFilterType]   = useState('all')   // all | expense | credit
  const [dateFrom,     setDateFrom]     = useState('')
  const [dateTo,       setDateTo]       = useState('')
  const [amountMin,    setAmountMin]    = useState('')
  const [amountMax,    setAmountMax]    = useState('')
  const [showFilters,  setShowFilters]  = useState(false)
  const [confirmDel,   setConfirmDel]   = useState(null)

  // Always sorted by date desc (recent first), then by created_at desc
  const sorted = [...transactions].sort((a, b) => {
    if (b.tx_date !== a.tx_date) return b.tx_date > a.tx_date ? 1 : -1
    return b.created_at > a.created_at ? 1 : -1
  })

  const filtered = sorted.filter((tx) => {
    if (filterType !== 'all' && tx.tx_type !== filterType) return false
    if (filterCat !== 'all' && tx.category !== filterCat) return false
    if (filterGroup !== 'all') {
      if (filterGroup === '__none__' && tx.group_id) return false
      if (filterGroup !== '__none__' && tx.group_id !== filterGroup) return false
    }
    if (dateFrom && tx.tx_date < dateFrom) return false
    if (dateTo   && tx.tx_date > dateTo)   return false
    if (amountMin && Number(tx.amount) < Number(amountMin)) return false
    if (amountMax && Number(tx.amount) > Number(amountMax)) return false
    if (search) {
      const q = search.toLowerCase()
      if (
        !tx.description.toLowerCase().includes(q) &&
        !(tx.what_i_got || '').toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  const activeFilterCount = [
    filterCat !== 'all', filterGroup !== 'all', filterType !== 'all',
    dateFrom, dateTo, amountMin, amountMax,
  ].filter(Boolean).length

  const clearFilters = () => {
    setFilterCat('all'); setFilterGroup('all'); setFilterType('all')
    setDateFrom(''); setDateTo(''); setAmountMin(''); setAmountMax('')
    setSearch('')
  }

  const handleDelete = async (txId) => {
    await deleteTransaction(txId)
    setConfirmDel(null)
  }

  // Group by date for display
  const grouped = filtered.reduce((acc, tx) => {
    const key = tx.tx_date
    if (!acc[key]) acc[key] = []
    acc[key].push(tx)
    return acc
  }, {})
  const dateKeys = Object.keys(grouped).sort((a, b) => b > a ? 1 : -1)

  const formatDateLabel = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00')
    const todayD = new Date(); todayD.setHours(0,0,0,0)
    const yesterday = new Date(todayD); yesterday.setDate(todayD.getDate()-1)
    if (d.toDateString() === todayD.toDateString()) return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div>
      {/* Search + filter row */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Search description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`${btnSecondary} relative`}
        >
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1.5 bg-gray-900 text-white text-xs rounded-full px-1.5 py-0.5">
              {activeFilterCount}
            </span>
          )}
        </button>
        <button onClick={onAdd} className={btnPrimary}>
          <span className="text-lg leading-none mr-1">+</span> Add
        </button>
      </div>

      {/* Expanded filters panel */}
      {showFilters && (
        <div className="border rounded p-4 mb-4 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">

            {/* Type */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Type</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                className={inputCls}>
                <option value="all">All types</option>
                <option value="expense">Expense</option>
                <option value="credit">Credit / Top-up</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Category</label>
              <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
                className={inputCls}>
                <option value="all">All categories</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.icon} {c.label}</option>
                ))}
              </select>
            </div>

            {/* Group */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Group</label>
              <select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)}
                className={inputCls}>
                <option value="all">All groups</option>
                <option value="__none__">No group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.icon} {g.name}</option>
                ))}
              </select>
            </div>

            {/* Amount range */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Amount range</label>
              <div className="flex gap-1">
                <input type="number" min="0" placeholder="Min" value={amountMin}
                  onChange={(e) => setAmountMin(e.target.value)}
                  className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400" />
                <input type="number" min="0" placeholder="Max" value={amountMax}
                  onChange={(e) => setAmountMax(e.target.value)}
                  className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400" />
              </div>
            </div>

            {/* Date from */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">From date</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className={inputCls} />
            </div>

            {/* Date to */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">To date</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className={inputCls} />
            </div>

            {/* Quick ranges */}
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Quick range</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Today',    days: 0  },
                  { label: 'This week', days: 6  },
                  { label: 'This month', days: 29 },
                  { label: 'Last 3 months', days: 89 },
                ].map(({ label, days }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      const to = todayStr()
                      const from = new Date()
                      from.setDate(from.getDate() - days)
                      setDateFrom(from.toISOString().split('T')[0])
                      setDateTo(to)
                    }}
                    className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button onClick={clearFilters}
              className="text-xs text-gray-500 hover:text-gray-900 underline">
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Result count */}
      <div className="text-xs text-gray-400 mb-3">
        {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
        {activeFilterCount > 0 ? ' (filtered)' : ''}
      </div>

      {loading && transactions.length === 0 ? (
        <div className="text-center py-10 text-gray-400 font-bubbler">Loading…</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="💸" text="No transactions found" />
      ) : (
        <div className="flex flex-col gap-4">
          {dateKeys.map((dateKey) => (
            <div key={dateKey}>
              {/* Date group header */}
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
                {formatDateLabel(dateKey)}
              </div>
              <div className="border rounded divide-y divide-gray-100">
                {grouped[dateKey].map((tx) => {
                  const cat     = getCategoryMeta(tx.category)
                  const group   = groups.find((g) => g.id === tx.group_id)
                  const isCredit = tx.tx_type === 'credit'
                  return (
                    <div key={tx.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <span className="text-xl mt-0.5 shrink-0">{isCredit ? '💵' : cat.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-sm font-medium">{tx.description}</div>
                              {tx.what_i_got && (
                                <div className="text-xs text-gray-500 mt-0.5">🛍️ {tx.what_i_got}</div>
                              )}
                            </div>
                            <div className={`text-sm font-bold shrink-0 ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                              {isCredit ? '+' : '-'}{fmt(tx.amount, currency)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {!isCredit && (
                              <span className="text-xs px-2 py-0.5 rounded border"
                                style={{ borderColor: cat.color + '66', color: cat.color }}>
                                {cat.icon} {cat.label}
                              </span>
                            )}
                            {isCredit && (
                              <span className="text-xs px-2 py-0.5 rounded border border-green-200 text-green-600">
                                Credit / Top-up
                              </span>
                            )}
                            {group && (
                              <span className="text-xs px-2 py-0.5 rounded border border-gray-200 text-gray-500">
                                {group.icon} {group.name}
                              </span>
                            )}
                            {/* Actions */}
                            <div className="ml-auto flex gap-2">
                              <button onClick={() => onEdit(tx)}
                                className="text-xs text-gray-400 hover:text-gray-700 border border-transparent hover:border-gray-200 px-2 py-0.5 rounded transition-colors">
                                Edit
                              </button>
                              {confirmDel === tx.id ? (
                                <div className="flex gap-1">
                                  <button onClick={() => handleDelete(tx.id)}
                                    className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">
                                    Confirm
                                  </button>
                                  <button onClick={() => setConfirmDel(null)}
                                    className="text-xs border border-gray-200 text-gray-500 px-2 py-0.5 rounded">
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => setConfirmDel(tx.id)}
                                  className="text-xs text-gray-400 hover:text-red-500 border border-transparent hover:border-red-200 px-2 py-0.5 rounded transition-colors">
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Groups tab ──────────────────────────────────────────────────────────── */
function GroupsTab({ groups, transactions, currency, onAdd, onEdit }) {
  const { deleteGroup } = useMoneyStore()
  const [confirmDel,   setConfirmDel]   = useState(null)
  const [expandedGroup, setExpandedGroup] = useState(null)

  const handleDelete = async (groupId) => {
    await deleteGroup(groupId)
    setConfirmDel(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-500">
          Group related expenses — e.g. "Goa Trip", "Monthly Bills"
        </div>
        <button onClick={onAdd} className={btnPrimary}>
          <span className="text-lg leading-none mr-1">+</span> New Group
        </button>
      </div>

      {groups.length === 0 ? (
        <EmptyState icon="📁" text="No groups yet" />
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((g) => {
            const groupTxs = [...transactions.filter((t) => t.group_id === g.id)]
              .sort((a, b) => b.tx_date > a.tx_date ? 1 : -1)
            const total = groupTxs.reduce((s, t) => s + (t.tx_type !== 'credit' ? Number(t.amount) : 0), 0)
            const isExpanded = expandedGroup === g.id

            return (
              <div key={g.id} className="border rounded">
                {/* Header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors select-none"
                  onClick={() => setExpandedGroup(isExpanded ? null : g.id)}
                >
                  <span className="text-xl shrink-0">{g.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{g.name}</div>
                    {g.description && (
                      <div className="text-xs text-gray-500">{g.description}</div>
                    )}
                    <div className="text-xs text-gray-400 mt-0.5">
                      {groupTxs.length} transaction{groupTxs.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold">{fmt(total, currency)}</div>
                    <div className="text-xs text-gray-400">total</div>
                  </div>
                  <div className={`text-gray-400 text-xs transition-transform ml-1 ${isExpanded ? 'rotate-180' : ''}`}>▼</div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t">
                    {/* Group actions */}
                    <div className="flex gap-2 justify-end px-4 py-2 bg-gray-50">
                      <button onClick={() => onEdit(g)}
                        className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 px-2 py-1 rounded transition-colors">
                        Edit group
                      </button>
                      {confirmDel === g.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => handleDelete(g.id)}
                            className="text-xs bg-red-500 text-white px-2 py-1 rounded">
                            Confirm Delete
                          </button>
                          <button onClick={() => setConfirmDel(null)}
                            className="text-xs border border-gray-200 text-gray-500 px-2 py-1 rounded">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDel(g.id)}
                          className="text-xs text-gray-500 hover:text-red-500 border border-gray-200 hover:border-red-200 px-2 py-1 rounded transition-colors">
                          Delete group
                        </button>
                      )}
                    </div>
                    {/* Transactions list */}
                    {groupTxs.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-400">No transactions yet.</div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {groupTxs.map((tx) => {
                          const cat = getCategoryMeta(tx.category)
                          const isCredit = tx.tx_type === 'credit'
                          return (
                            <div key={tx.id} className="flex items-center gap-3 px-4 py-2.5">
                              <span className="text-base">{isCredit ? '💵' : cat.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm truncate">{tx.description}</div>
                                {tx.what_i_got && (
                                  <div className="text-xs text-gray-400 truncate">🛍️ {tx.what_i_got}</div>
                                )}
                              </div>
                              <div className={`text-sm font-bold shrink-0 ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                                {isCredit ? '+' : '-'}{fmt(tx.amount, currency)}
                              </div>
                              <div className="text-xs text-gray-400 shrink-0">{tx.tx_date}</div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Wallet Modal ─────────────────────────────────────────────────────────── */
function WalletModal({ wallet, onClose }) {
  const { createOrUpdateWallet } = useMoneyStore()
  const [name,     setName]     = useState(wallet?.name     || 'My Wallet')
  const [balance,  setBalance]  = useState(wallet?.balance  ?? '')
  const [currency, setCurrency] = useState(wallet?.currency || 'INR')
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (balance === '' || isNaN(Number(balance))) { setError('Enter a valid amount'); return }
    setSaving(true)
    const { error: err } = await createOrUpdateWallet({ name, balance, currency })
    setSaving(false)
    if (err) setError(err.message)
    else onClose()
  }

  return (
    <Modal title={wallet ? 'Edit Wallet' : 'Setup Wallet'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Wallet name">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            className={inputCls} placeholder="My Wallet" />
        </Field>
        <Field label="Starting balance">
          <input type="number" value={balance} min="0" step="any"
            onChange={(e) => setBalance(e.target.value)}
            className={inputCls} placeholder="e.g. 50000" required />
        </Field>
        <Field label="Currency">
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls}>
            <option value="INR">₹ INR</option>
            <option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option>
            <option value="GBP">£ GBP</option>
          </select>
        </Field>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <ModalActions onClose={onClose} saving={saving} label={wallet ? 'Save Changes' : 'Create Wallet'} />
      </form>
    </Modal>
  )
}

/* ── Transaction Modal ────────────────────────────────────────────────────── */
function TransactionModal({ tx, groups, onClose }) {
  const { addTransaction, updateTransaction } = useMoneyStore()
  const isEdit = !!tx

  const [txType,      setTxType]      = useState(tx?.tx_type      || 'expense')
  const [category,    setCategory]    = useState(tx?.category      || 'food')
  const [description, setDescription] = useState(tx?.description   || '')
  const [whatIGot,    setWhatIGot]    = useState(tx?.what_i_got    || '')
  const [amount,      setAmount]      = useState(tx?.amount        ?? '')
  const [txDate,      setTxDate]      = useState(tx?.tx_date       || todayStr())
  const [groupId,     setGroupId]     = useState(tx?.group_id      || '')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!description.trim())                              { setError('Description is required'); return }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) { setError('Enter a valid positive amount'); return }
    setSaving(true)
    const payload = {
      txType,
      category: txType === 'credit' ? 'other' : category,
      description,
      whatIGot,
      amount,
      txDate,
      groupId: groupId || null,
    }
    const { error: err } = isEdit
      ? await updateTransaction(tx.id, payload)
      : await addTransaction(payload)
    setSaving(false)
    if (err) setError(err.message)
    else onClose()
  }

  return (
    <Modal title={isEdit ? 'Edit Transaction' : 'Add Transaction'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Type toggle */}
        <Field label="Type">
          <div className="flex gap-2">
            {[
              { value: 'expense', label: '↑ Expense' },
              { value: 'credit',  label: '↓ Credit / Add Money' },
            ].map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTxType(t.value)}
                className={`flex-1 py-1.5 rounded border text-sm font-medium transition-colors ${
                  txType === t.value
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Field>

        {/* Category (only for expense) */}
        {txType === 'expense' && (
          <Field label="Category">
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {EXPENSE_CATEGORIES.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setCategory(c.slug)}
                  className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                    category === c.slug
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </Field>
        )}

        <Field label="Description *">
          <input type="text" value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputCls}
            placeholder={txType === 'credit' ? 'e.g. Salary, Pocket money' : 'e.g. Lunch at Café'}
            required />
        </Field>

        {txType === 'expense' && (
          <Field label="What I got (optional)">
            <input type="text" value={whatIGot}
              onChange={(e) => setWhatIGot(e.target.value)}
              className={inputCls} placeholder="e.g. Pasta, coffee, juice" />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount *">
            <input type="number" value={amount} min="0.01" step="any"
              onChange={(e) => setAmount(e.target.value)}
              className={inputCls} placeholder="0.00" required />
          </Field>
          <Field label="Date">
            <input type="date" value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
              className={inputCls} />
          </Field>
        </div>

        {txType === 'expense' && (
          <Field label="Group (optional)">
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className={inputCls}>
              <option value="">No group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.icon} {g.name}</option>
              ))}
            </select>
          </Field>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
        <ModalActions onClose={onClose} saving={saving} label={isEdit ? 'Save Changes' : txType === 'credit' ? 'Add Credit' : 'Add Expense'} />
      </form>
    </Modal>
  )
}

/* ── Group Modal ──────────────────────────────────────────────────────────── */
const GROUP_ICONS   = ['📁', '✈️', '🏖️', '🎉', '🛒', '💼', '🏠', '🎓', '🍔', '💊', '🚗', '📅', '🎮', '🎁', '🏋️']
const GROUP_COLORS  = ['#374151', '#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#06B6D4', '#84CC16']

function GroupModal({ group, onClose }) {
  const { addGroup, updateGroup } = useMoneyStore()
  const isEdit = !!group

  const [name,        setName]        = useState(group?.name        || '')
  const [description, setDescription] = useState(group?.description || '')
  const [color,       setColor]       = useState(group?.color       || '#374151')
  const [icon,        setIcon]        = useState(group?.icon        || '📁')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true)
    const { error: err } = isEdit
      ? await updateGroup(group.id, { name, description, color, icon })
      : await addGroup({ name, description, color, icon })
    setSaving(false)
    if (err) setError(err.message)
    else onClose()
  }

  return (
    <Modal title={isEdit ? 'Edit Group' : 'New Group'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Icon">
          <div className="flex flex-wrap gap-1.5">
            {GROUP_ICONS.map((i) => (
              <button key={i} type="button" onClick={() => setIcon(i)}
                className={`w-8 h-8 rounded text-base border flex items-center justify-center transition-colors ${
                  icon === i ? 'border-gray-900 bg-gray-100' : 'border-gray-200 hover:border-gray-400'
                }`}>
                {i}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Color">
          <div className="flex flex-wrap gap-2">
            {GROUP_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  color === c ? 'border-gray-400 scale-110' : 'border-transparent'
                }`}
                style={{ background: c }} />
            ))}
          </div>
        </Field>
        <Field label="Group name *">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            className={inputCls} placeholder="e.g. Goa Trip, Monthly Bills" required />
        </Field>
        <Field label="Description (optional)">
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
            className={inputCls} placeholder="Brief description" />
        </Field>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <ModalActions onClose={onClose} saving={saving} label={isEdit ? 'Save Changes' : 'Create Group'} />
      </form>
    </Modal>
  )
}

/* ── Shared atoms ─────────────────────────────────────────────────────────── */
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="font-bubbler text-2xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

function ModalActions({ onClose, saving, label }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onClose}
        className="flex-1 py-2 border border-gray-300 rounded text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
        Cancel
      </button>
      <button type="submit" disabled={saving}
        className="flex-1 py-2 bg-gray-900 text-white rounded text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors">
        {saving ? 'Saving…' : label}
      </button>
    </div>
  )
}

function EmptyState({ icon, text }) {
  return (
    <div className="font-bubbler text-center py-16 text-gray-400">
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-lg">{text}</div>
    </div>
  )
}
