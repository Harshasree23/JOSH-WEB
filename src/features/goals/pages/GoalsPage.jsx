import { useEffect, useState } from "react"
import { useGoalsStore } from "../stores/goalsStore"
import { useHabitsStore } from "../../habits/stores/habitsStore"
import { useProjectsStore } from "../../projects/stores/projectsStore"

export default function GoalsPage() {
  const { 
    goals, goalHabits, goalProjects, goalTasks, 
    loading, fetchGoals, addGoal, deleteGoal, 
    linkHabit, unlinkHabit, linkProject, unlinkProject,
    addTask, toggleTaskCompletion, deleteTask, goalProgress
  } = useGoalsStore()
  
  const { habits, fetchHabits } = useHabitsStore()
  const { projects, fetchProjects } = useProjectsStore()

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [selectedGoalId, setSelectedGoalId] = useState(null)

  useEffect(() => {
    fetchGoals()
    fetchHabits()
    fetchProjects()
  }, [fetchGoals, fetchHabits, fetchProjects])

  const selectedGoal = goals.find(g => g.id === selectedGoalId)

  if (loading && goals.length === 0) {
    return <div className="font-bubbler text-xl text-gray-400 py-10 text-center">Loading goals...</div>
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Sidebar */}
      <div className="w-1/3 flex flex-col border-r border-gray-200 pr-4">
        <div className="flex items-center justify-between mb-4">
          <div className="font-bubbler text-2xl">Goals</div>
          <button
            onClick={() => setShowAddModal(true)}
            className="font-bubbler flex items-center gap-2 px-3 py-1 bg-gray-900 text-white rounded text-sm hover:bg-gray-700 transition-colors"
          >
            + Add
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-2">
          {goals.length === 0 ? (
            <div className="text-gray-400 text-sm font-bubbler mt-4">No goals yet.</div>
          ) : (
            goals.map(goal => {
              let progressDays = goalProgress[goal.id] || 0;
              let totalDays = parseInt(goal.target_value) || 0;
              let progressPercent = 0;
              
              if (!totalDays && goal.time_period_start && goal.time_period_end) {
                const start = new Date(goal.time_period_start);
                const end = new Date(goal.time_period_end);
                totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
              }

              if (totalDays > 0) {
                progressPercent = Math.min(100, (progressDays / totalDays) * 100);
              }

              return (
                <div 
                  key={goal.id}
                  onClick={() => setSelectedGoalId(goal.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors flex flex-col gap-1 ${
                    selectedGoalId === goal.id ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="font-bold font-bubbler text-lg flex justify-between items-center">
                    {goal.name}
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingGoal(goal); }}
                        className="text-blue-400 hover:text-blue-600 text-sm"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteGoal(goal.id); if (selectedGoalId === goal.id) setSelectedGoalId(null); }}
                        className="text-red-400 hover:text-red-600 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  {totalDays > 0 && (
                    <div className="mt-1">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{progressDays} / {totalDays} {goal.target_unit || 'days'}</span>
                        <span>{Math.round(progressPercent)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                      </div>
                    </div>
                  )}

                  {!goal.target_value && goal.time_period_end && (
                    <div className="text-xs text-gray-400 mt-1">
                      Ends: {new Date(goal.time_period_end).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {selectedGoal ? (
          <GoalDetail 
            goal={selectedGoal} 
            goalHabits={goalHabits.filter(gh => gh.goal_id === selectedGoal.id)}
            goalProjects={goalProjects.filter(gp => gp.goal_id === selectedGoal.id)}
            goalTasks={goalTasks.filter(t => t.goal_id === selectedGoal.id)}
            allHabits={habits}
            allProjects={projects}
            linkHabit={linkHabit}
            unlinkHabit={unlinkHabit}
            linkProject={linkProject}
            unlinkProject={unlinkProject}
            addTask={addTask}
            toggleTask={toggleTaskCompletion}
            deleteTask={deleteTask}
          />
        ) : (
          <div className="m-auto text-gray-400 font-bubbler text-xl flex flex-col items-center">
            <div className="text-4xl mb-3">🎯</div>
            Select a goal to view details
          </div>
        )}
      </div>

      {showAddModal && (
        <GoalFormModal onClose={() => setShowAddModal(false)} onSubmit={addGoal} />
      )}
      
      {editingGoal && (
        <GoalFormModal 
          initialData={editingGoal} 
          onClose={() => setEditingGoal(null)} 
          onSubmit={(updates) => useGoalsStore.getState().updateGoal(editingGoal.id, updates)} 
        />
      )}
    </div>
  )
}

function GoalDetail({ goal, goalHabits, goalProjects, goalTasks, allHabits, allProjects, linkHabit, unlinkHabit, linkProject, unlinkProject, addTask, toggleTask, deleteTask }) {
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [habitSelect, setHabitSelect] = useState('')
  const [projectSelect, setProjectSelect] = useState('')

  const handleAddTask = (e) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    addTask(goal.id, newTaskTitle.trim())
    setNewTaskTitle('')
  }

  const handleLinkHabit = (e) => {
    if (e.target.value) {
      linkHabit(goal.id, e.target.value)
      setHabitSelect('')
    }
  }

  const handleLinkProject = (e) => {
    if (e.target.value) {
      linkProject(goal.id, e.target.value)
      setProjectSelect('')
    }
  }

  return (
    <div className="flex flex-col h-full pl-4 space-y-6">
      <div>
        <h2 className="font-bubbler text-3xl font-bold">{goal.name}</h2>
        <p className="text-gray-600 mt-2">{goal.description}</p>
        {(goal.target_value || goal.time_period_start || goal.time_period_end) && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
            {goal.target_value && <div><strong>Target:</strong> {goal.target_value} {goal.target_unit}</div>}
            {goal.frequency && <div><strong>Frequency:</strong> {goal.frequency}</div>}
            {goal.time_period_start && <div><strong>Start:</strong> {new Date(goal.time_period_start).toLocaleDateString()}</div>}
            {goal.time_period_end && <div><strong>End:</strong> {new Date(goal.time_period_end).toLocaleDateString()}</div>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6 flex-1 overflow-y-auto pb-6">
        
        {/* Linked Habits */}
        <div>
          <div className="font-bubbler text-xl font-bold border-b pb-2 mb-3">Linked Habits</div>
          <select value={habitSelect} onChange={handleLinkHabit} className="w-full mb-3 p-2 border rounded font-bubbler">
            <option value="">+ Link existing habit...</option>
            {allHabits.filter(h => !goalHabits.find(gh => gh.habit_id === h.id)).map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
          <div className="space-y-2">
            {goalHabits.length === 0 && <div className="text-sm text-gray-500">No habits linked.</div>}
            {goalHabits.map(gh => {
              const habit = allHabits.find(h => h.id === gh.habit_id)
              if(!habit) return null
              return (
                <div key={gh.habit_id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                  <span className="font-bubbler">{habit.name}</span>
                  <button onClick={() => unlinkHabit(goal.id, habit.id)} className="text-red-400 text-xs">Unlink</button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Linked Projects */}
        <div>
          <div className="font-bubbler text-xl font-bold border-b pb-2 mb-3">Linked Projects</div>
          <select value={projectSelect} onChange={handleLinkProject} className="w-full mb-3 p-2 border rounded font-bubbler">
            <option value="">+ Link existing project...</option>
            {allProjects.filter(p => !goalProjects.find(gp => gp.project_id === p.id)).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <div className="space-y-2">
            {goalProjects.length === 0 && <div className="text-sm text-gray-500">No projects linked.</div>}
            {goalProjects.map(gp => {
              const proj = allProjects.find(p => p.id === gp.project_id)
              if(!proj) return null
              return (
                <div key={gp.project_id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                  <span className="font-bubbler">{proj.name}</span>
                  <button onClick={() => unlinkProject(goal.id, proj.id)} className="text-red-400 text-xs">Unlink</button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Standalone Tasks */}
        <div className="col-span-2 mt-4">
          <div className="font-bubbler text-xl font-bold border-b pb-2 mb-3">Standalone Goal Tasks</div>
          <div className="space-y-2">
            {goalTasks.length === 0 && <div className="text-sm text-gray-500">No standalone tasks.</div>}
            {goalTasks.map(t => (
              <div key={t.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded group">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={t.is_completed} onChange={() => toggleTask(t.id)} className="w-4 h-4 rounded text-gray-900 focus:ring-gray-900 cursor-pointer"/>
                  <span className={`font-bubbler text-lg ${t.is_completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{t.title}</span>
                </div>
                <button onClick={() => deleteTask(t.id)} className="text-red-400 text-xs opacity-0 group-hover:opacity-100">Delete</button>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddTask} className="mt-3 flex gap-2">
            <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Add a new goal task..." className="flex-1 border rounded px-3 py-1 font-bubbler text-sm focus:outline-none focus:border-gray-900"/>
            <button type="submit" className="px-3 py-1 bg-gray-900 text-white rounded text-sm font-bubbler">Add</button>
          </form>
        </div>

      </div>
    </div>
  )
}

function GoalFormModal({ initialData, onClose, onSubmit }) {
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [targetValue, setTargetValue] = useState(initialData?.target_value || '')
  const [targetUnit, setTargetUnit] = useState(initialData?.target_unit || 'days')
  const [startDate, setStartDate] = useState(initialData?.time_period_start || '')
  const [endDate, setEndDate] = useState(initialData?.time_period_end || '')
  const [frequency, setFrequency] = useState(initialData?.frequency || 'daily')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setIsSubmitting(true)
    await onSubmit({ 
      name: name.trim(), 
      description: description.trim(),
      targetValue: targetValue ? Number(targetValue) : null,
      targetUnit: targetValue ? targetUnit : null,
      startDate: startDate || null,
      endDate: endDate || null,
      frequency
    })
    setIsSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bubbler text-2xl font-bold">{initialData ? 'Edit Goal' : 'New Goal'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-bubbler">Goal Name</label>
              <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border rounded-lg px-4 py-2 font-bubbler focus:ring-1 focus:ring-gray-900" required/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-bubbler">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded-lg px-4 py-2 font-bubbler focus:ring-1 focus:ring-gray-900" rows={2}/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-bubbler">Target (e.g. 75)</label>
                <input type="number" value={targetValue} onChange={e => setTargetValue(e.target.value)} className="w-full border rounded-lg px-4 py-2 font-bubbler focus:ring-1 focus:ring-gray-900"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-bubbler">Unit (e.g. days)</label>
                <input type="text" value={targetUnit} onChange={e => setTargetUnit(e.target.value)} className="w-full border rounded-lg px-4 py-2 font-bubbler focus:ring-1 focus:ring-gray-900"/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-bubbler">Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border rounded-lg px-4 py-2 font-bubbler focus:ring-1 focus:ring-gray-900"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-bubbler">End Date</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border rounded-lg px-4 py-2 font-bubbler focus:ring-1 focus:ring-gray-900"/>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-bubbler">Frequency</label>
              <select value={frequency} onChange={e => setFrequency(e.target.value)} className="w-full border rounded-lg px-4 py-2 font-bubbler focus:ring-1 focus:ring-gray-900">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bubbler transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting || !name.trim()} className="px-4 py-2 bg-gray-900 text-white rounded-lg font-bubbler hover:bg-gray-800 disabled:opacity-50 transition-colors">
              {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
