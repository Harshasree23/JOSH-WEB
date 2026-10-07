import { useEffect, useRef, useState } from "react"
import StreakGraph from "../../../shared/components/StreakGraph"
import { useHabitsStore } from "../stores/habitsStore"

export default function HabitsPage() {
  const { habits, categories, loading, fetchHabits, fetchCategories } = useHabitsStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")

  useEffect(() => {
    fetchCategories()
    fetchHabits()
  }, [fetchCategories, fetchHabits])

  if (loading && habits.length === 0) {
    return (
      <div className="font-bubbler text-xl text-gray-400 py-10 text-center">
        Loading habits...
      </div>
    )
  }

  return (
    <div className="">
      {/* Header with Add button */}
      <div className="flex items-center justify-between mb-6">
        <div className="font-bubbler text-2xl">My Habits</div>
        <button
          onClick={() => setShowAddModal(true)}
          className="font-bubbler flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded text-sm hover:bg-gray-700 transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          Add Habit
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search habits..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 font-kalam focus:outline-none focus:border-gray-900"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 font-kalam focus:outline-none focus:border-gray-900 min-w-[200px]"
        >
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.display_name}</option>)}
        </select>
      </div>

      {/* Habits list */}
      {habits.length === 0 ? (
        <div className="font-bubbler text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📋</div>
          <div className="text-lg">No habits yet</div>
          <div className="text-sm mt-1">Click "Add Habit" to create your first one</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {habits
            .filter(h => {
              const matchesSearch = h.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                    (h.description && h.description.toLowerCase().includes(searchQuery.toLowerCase()))
              const matchesFilter = filterCategory === 'all' || h.category_id === filterCategory
              return matchesSearch && matchesFilter
            })
            .map((habit) => (
              <HabitItem
                key={habit.id}
                habit={habit}
                onEdit={() => setEditingHabit(habit)}
              />
            ))}
        </div>
      )}

      {/* Add Habit Modal */}
      {showAddModal && (
        <HabitFormModal
          categories={categories}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit Habit Modal */}
      {editingHabit && (
        <HabitFormModal
          categories={categories}
          habit={editingHabit}
          onClose={() => setEditingHabit(null)}
        />
      )}
    </div>
  )
}


const HabitItem = ({ habit, onEdit }) => {
  const { toggleHabitLog, deleteHabit, saveLog } = useHabitsStore()
  const isCompleted = habit.todayLog?.completed
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Log fields — pre-fill from today's log each time it changes
  const [actualValue, setActualValue] = useState(habit.todayLog?.actual_value ?? '')
  const [completionLog, setCompletionLog] = useState(habit.todayLog?.completion_log ?? '')
  const [saving, setSaving] = useState(false)

  // Keep inputs in sync if todayLog changes externally (e.g. after toggle)
  useEffect(() => {
    setActualValue(habit.todayLog?.actual_value ?? '')
    setCompletionLog(habit.todayLog?.completion_log ?? '')
  }, [habit.todayLog?.actual_value, habit.todayLog?.completion_log])

  const saveTimerRef = useRef(null)

  const scheduleSave = (newActualValue, newCompletionLog) => {
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true)
      await saveLog(habit.id, {
        actualValue: habit.is_quantifiable ? newActualValue : undefined,
        completionLog: newCompletionLog,
      })
      setSaving(false)
    }, 800)
  }

  const handleDelete = async () => {
    setDeleting(true)
    const { error } = await deleteHabit(habit.id)
    if (error) {
      alert(error.message || 'Failed to delete habit')
    }
    setDeleting(false)
    setConfirmDelete(false)
  }

  return (
    <div 
      className="font-roboto bg-white border border-gray-100 rounded-2xl p-5 flex flex-col shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group" >
      {/* Category Color Accent */}
      {/* <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: habit.category?.color_hex || '#e5e7eb' }} /> */}

      <div className="flex flex-col md:flex-row gap-6 mt-1 items-center md:items-stretch">
        
        {/* Left Side: Details */}
        <div className="flex-1 flex flex-col gap-4 w-full">
          
          {/* Line 1: Header (Name + Actions) */}
          <div className="flex justify-between items-start gap-4">
            <div 
              className="font-bold text-2xl leading-tight tracking-tight flex-1"
              style={{ color: habit.category?.color_hex || '#1f2937' }}
              title={habit.name}
            >
              {habit.name}
            </div>
            
            <div className="flex gap-1.5 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <button onClick={onEdit} className="p-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">✏️</button>
              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)} className="p-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors">🗑️</button>
              ) : (
                <div className="flex gap-1 bg-red-50 border border-red-100 rounded-md p-1 shadow-sm">
                  <button onClick={handleDelete} disabled={deleting} className="px-2 text-xs text-red-600 font-bold hover:bg-red-100 rounded">Yes</button>
                  <button onClick={() => setConfirmDelete(false)} className="px-2 text-xs text-gray-600 hover:bg-gray-200 rounded">No</button>
                </div>
              )}
            </div>
          </div>
          
          {/* Line 2: Marking & Target */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-auto">
            <div className="flex items-center gap-3">
              {habit.is_quantifiable ? (
                <div className="flex items-center">
                  <input
                    type="number"
                    className="w-16 h-10 border-2 border-gray-200 rounded-l-lg text-lg font-medium text-center focus:outline-none focus:border-gray-800 transition-colors"
                    placeholder={'0'}
                    value={actualValue}
                    onChange={(e) => {
                      setActualValue(e.target.value)
                      scheduleSave(e.target.value, completionLog)
                    }}
                  />
                  <div className="h-10 px-3 bg-gray-100 border-y-2 border-r-2 border-gray-200 rounded-r-lg flex items-center text-sm font-medium text-gray-500">
                    / {habit.baseline_target} {habit.unit}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center cursor-pointer border-2 transition-all duration-200 ${
                      isCompleted ? 'bg-green-500 border-green-500 text-white shadow-sm shadow-green-200' : 'bg-gray-50 border-gray-300 hover:border-gray-400 hover:bg-gray-100'
                    }`}
                    onClick={() => toggleHabitLog(habit.id)}
                  >
                    {isCompleted && <span className="text-xl font-sans">✓</span>}
                  </div>
                  <div className={`text-sm font-medium ${isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                    {isCompleted ? "Active" : "Not Active"}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Line 3: Streaks */}
          <div className="flex gap-4 text-xs font-medium text-gray-600 shrink-0 bg-gray-50/80 px-3 py-2 rounded-lg border border-gray-100">
            <span className="flex items-center gap-1.5" title="Current Streak">
              <span className="text-base">🔥</span> {habit.streak?.current_streak || 0} Current
            </span>
            <span className="w-px bg-gray-200" />
            <span className="flex items-center gap-1.5" title="Best Streak">
              <span className="text-base">🏆</span> {habit.streak?.longest_streak || 0} Best
            </span>
          </div>

        </div>

        {/* Right Side: Monthly Graph */}
        <div className=" shrink-0 p-3 bg-gray-50 rounded-xl flex flex-col justify-center items-center border border-gray-100">
          <StreakGraph 
            habitId={habit.id} 
            currentMonthOnly={true} 
            hideStats={true} 
            refreshTrigger={`${habit.todayLog?.completed}-${habit.todayLog?.actual_value}`} 
          />
        </div>

      </div>

      {/* View Full Details Toggle */}
      {/* <div 
        className="mt-5 text-center text-[10px] font-bold text-gray-400 cursor-pointer hover:text-gray-600 uppercase tracking-widest font-sans bg-gray-50 py-2 rounded-lg border border-transparent hover:border-gray-200 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? "▲ Hide Details" : "▼ View Full Details"}
      </div> */}

      {/* Expanded Area: Full details */}
      {expanded && (
        <div className="mt-4 border-t pt-4">
          
          <div className="flex flex-col gap-6">
            
            {/* Reflection Input */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest font-sans">Today's Reflection</label>
                {saving && <span className="text-[10px] text-gray-400 font-sans italic">Saving…</span>}
              </div>
              <textarea
                placeholder="How did it feel today? Write a short reflection..."
                rows={3}
                value={completionLog}
                onChange={(e) => {
                  setCompletionLog(e.target.value)
                  scheduleSave(actualValue, e.target.value)
                }}
                className="w-full text-sm border-2 border-gray-100 bg-gray-50 rounded-xl px-4 py-3 focus:outline-none focus:border-gray-300 focus:bg-white transition-colors resize-none"
              />
            </div>
            
            {/* Yearly Graph */}
            <div className="mb-2">
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest font-sans mb-3">Yearly Overview</div>
              <div className="overflow-x-auto pb-4 w-full flex justify-start custom-scrollbar">
                <div className="min-w-fit pr-4">
                  <StreakGraph 
                    habitId={habit.id} 
                    currentMonthOnly={false} 
                    hideStats={true} 
                    refreshTrigger={`${habit.todayLog?.completed}-${habit.todayLog?.actual_value}`} 
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}


const HabitFormModal = ({ categories, habit, onClose }) => {
  const { addHabit, updateHabit } = useHabitsStore()
  const isEdit = !!habit

  const [name, setName] = useState(habit?.name || '')
  const [description, setDescription] = useState(habit?.description || '')
  const [categoryId, setCategoryId] = useState(habit?.category_id || categories[0]?.id || '')
  const [isQuantifiable, setIsQuantifiable] = useState(habit?.is_quantifiable || false)
  const [baselineTarget, setBaselineTarget] = useState(habit?.baseline_target?.toString() || '')
  const [unit, setUnit] = useState(habit?.unit || '')
  const [frequency, setFrequency] = useState(habit?.frequency || 'daily')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Habit name is required')
      return
    }
    if (!categoryId) {
      setError('Please select a category')
      return
    }
    if (isQuantifiable && (!baselineTarget || !unit.trim())) {
      setError('Target and unit are required for quantifiable habits')
      return
    }

    setSubmitting(true)
    setError('')

    const payload = {
      name: name.trim(),
      description: description.trim(),
      categoryId,
      isQuantifiable,
      baselineTarget: isQuantifiable ? Number(baselineTarget) : null,
      unit: isQuantifiable ? unit.trim() : null,
      frequency,
    }

    let result
    if (isEdit) {
      result = await updateHabit(habit.id, payload)
    } else {
      result = await addHabit(payload)
    }

    setSubmitting(false)

    if (result.error) {
      setError(result.error.message)
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bubbler text-2xl font-bold">
            {isEdit ? 'Edit Habit' : 'Add New Habit'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Habit Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning Run"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your habit..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  className={`px-3 py-1.5 rounded text-sm border transition-colors ${
                    categoryId === cat.id
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {cat.icon} {cat.display_name}
                </button>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="weekdays">Weekdays</option>
            </select>
          </div>

          {/* Quantifiable toggle */}
          <div className="flex items-center gap-2">
            <input
              id="quantifiable"
              type="checkbox"
              checked={isQuantifiable}
              onChange={(e) => setIsQuantifiable(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="quantifiable" className="text-sm text-gray-700">
              This habit is measurable (has a number target)
            </label>
          </div>

          {/* Quantifiable fields */}
          {isQuantifiable && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
                <input
                  type="number"
                  value={baselineTarget}
                  onChange={(e) => setBaselineTarget(e.target.value)}
                  placeholder="e.g. 5"
                  min="0"
                  step="any"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g. km, pages, glasses"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 rounded text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 bg-gray-900 text-white rounded text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
