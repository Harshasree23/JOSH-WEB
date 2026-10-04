import { useEffect, useState } from "react"
import StreakGraph from "../../../shared/components/StreakGraph"
import { useHabitsStore } from "../stores/habitsStore"

export default function HabitsPage() {
  const { habits, categories, loading, fetchHabits, fetchCategories } = useHabitsStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)

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
    <div>
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

      {/* Habits list */}
      {habits.length === 0 ? (
        <div className="font-bubbler text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📋</div>
          <div className="text-lg">No habits yet</div>
          <div className="text-sm mt-1">Click "Add Habit" to create your first one</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {habits.map((habit) => (
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
  const { toggleHabitLog, deleteHabit } = useHabitsStore()
  const isCompleted = habit.todayLog?.completed
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
    <div className="font-bubbler border rounded">

      {/* Collapsed header — always visible */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div
            className="rounded w-5 h-5 shrink-0"
            style={{ backgroundColor: habit.category?.color_hex || '#FDE047' }}
          />
          <div className="font-bold text-xl">{habit.name}</div>
        </div>

        <div className="flex items-center gap-4">
          {/* Streak badge */}
          <div className="text-sm text-gray-500">
            🔥 {habit.streak?.current_streak || 0}
          </div>

          {/* Completion toggle */}
          <div
            className={`text-sm px-2 py-0.5 rounded cursor-pointer select-none transition-colors ${
              isCompleted
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            onClick={(e) => { e.stopPropagation(); toggleHabitLog(habit.id) }}
          >
            {isCompleted ? '✓ Done' : 'Mark done'}
          </div>

          {/* Chevron */}
          <div className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>
            ▼
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t flex flex-col gap-4">

          {/* Info row */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-start">
              <div className="flex gap-4 items-center flex-wrap">
                <div className="border rounded px-2 py-1 text-sm"
                  style={{
                    borderColor: habit.category?.color_hex || '#e5e7eb',
                    color: habit.category?.color_hex || '#6b7280',
                  }}
                >
                  {habit.category?.icon} {habit.category?.display_name || 'Uncategorized'}
                </div>
                {habit.is_quantifiable && (
                  <div className="border rounded px-2 py-1 text-sm">
                    {habit.baseline_target} {habit.unit}
                  </div>
                )}
                <div className="border rounded px-2 py-1 text-xs text-gray-500">
                  {habit.frequency}
                </div>
              </div>

              {/* Edit / Delete buttons */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={onEdit}
                  className="text-xs px-2 py-1 border rounded text-gray-500 hover:text-gray-900 hover:border-gray-400 transition-colors"
                >
                  Edit
                </button>
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="text-xs px-2 py-1 border rounded text-gray-500 hover:text-red-600 hover:border-red-300 transition-colors"
                  >
                    Delete
                  </button>
                ) : (
                  <div className="flex gap-1">
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="text-xs px-2 py-1 bg-red-600 text-white rounded disabled:opacity-50"
                    >
                      {deleting ? '...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="text-xs px-2 py-1 border rounded text-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {habit.description && (
              <div className="text-gray-600 mt-1">{habit.description}</div>
            )}

            {/* Streak summary */}
            <div className="flex gap-6 text-sm text-gray-500 mt-1">
              <span>🔥 {habit.streak?.current_streak || 0} day streak</span>
              <span>🏆 Best: {habit.streak?.longest_streak || 0} days</span>
            </div>
          </div>

          {/* Streak graph */}
          <div>
            <StreakGraph habitId={habit.id} />
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
