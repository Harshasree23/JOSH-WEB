import { useEffect, useState } from "react"
import { useProjectsStore } from "../stores/projectsStore"

export default function ProjectsPage() {
  const { projects, tasks, loading, fetchProjects, addProject, deleteProject } = useProjectsStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const selectedProject = projects.find(p => p.id === selectedProjectId)
  const projectTasks = tasks.filter(t => t.project_id === selectedProjectId)

  if (loading && projects.length === 0) {
    return <div className="font-bubbler text-xl text-gray-400 py-10 text-center">Loading projects...</div>
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Sidebar / List */}
      <div className="w-1/3 flex flex-col border-r border-gray-200 pr-4">
        <div className="flex items-center justify-between mb-4">
          <div className="font-bubbler text-2xl">Learning & Projects</div>
          <button
            onClick={() => setShowAddModal(true)}
            className="font-bubbler flex items-center gap-2 px-3 py-1 bg-gray-900 text-white rounded text-sm hover:bg-gray-700 transition-colors"
          >
            + Add
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1 font-bubbler focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1 font-bubbler focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
          >
            <option value="all">All</option>
            <option value="project">Projects</option>
            <option value="learning">Learning</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-2">
          {projects.length === 0 ? (
            <div className="text-gray-400 text-sm font-bubbler mt-4">No projects yet.</div>
          ) : (
            projects
              .filter(p => {
                const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
                const matchesFilter = filterType === 'all' || p.project_type === filterType
                return matchesSearch && matchesFilter
              })
              .map(project => {
              const pTasks = tasks.filter(t => t.project_id === project.id)
              const totalTasks = pTasks.length
              const completedTasks = pTasks.filter(t => t.is_completed).length
              const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

              return (
                <div 
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedProjectId === project.id ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="font-bold font-bubbler text-lg flex justify-between items-center">
                    {project.name}
                    {project.project_type === 'learning' && (
                      <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-sans font-normal">Learning</span>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteProject(project.id); if (selectedProjectId === project.id) setSelectedProjectId(null); }}
                      className="text-red-400 hover:text-red-600 text-sm ml-auto"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="text-sm text-gray-500 line-clamp-1">{project.description}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-green-500 h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 font-bubbler w-8 text-right">{progress}%</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Main Area / Detail */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {selectedProject ? (
          <ProjectDetail 
            project={selectedProject} 
            tasks={projectTasks} 
            allTasks={tasks}
            allProjects={projects}
            onSelectProject={setSelectedProjectId}
          />
        ) : (
          <div className="m-auto text-gray-400 font-bubbler text-xl flex flex-col items-center">
            <div className="text-4xl mb-3">📁</div>
            Select a project to view tasks
          </div>
        )}
      </div>

      {showAddModal && (
        <ProjectFormModal onClose={() => setShowAddModal(false)} onSubmit={addProject} />
      )}
    </div>
  )
}

function ProjectDetail({ project, tasks, allTasks, allProjects, onSelectProject }) {
  const { addTask } = useProjectsStore()
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [linkedProjectId, setLinkedProjectId] = useState('')

  // Build task tree
  const rootTasks = tasks.filter(t => !t.parent_task_id)

  const handleAddTask = (e) => {
    e.preventDefault()
    if (!newTaskTitle.trim() && !linkedProjectId) return
    let title = newTaskTitle.trim()
    if (!title && linkedProjectId) {
      title = allProjects.find(p => p.id === linkedProjectId)?.name || 'Linked Project'
    }
    addTask({ 
      projectId: project.id, 
      title,
      linkedProjectId: linkedProjectId || null
    })
    setNewTaskTitle('')
    setLinkedProjectId('')
  }

  return (
    <div className="flex flex-col h-full pl-4">
      <div className="mb-6">
        <h2 className="font-bubbler text-3xl font-bold flex items-center gap-3">
          {project.name}
          {project.project_type === 'learning' && (
            <span className="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-sans font-normal">Learning</span>
          )}
        </h2>
        <p className="text-gray-600 mt-2">{project.description}</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="font-bubbler text-xl mb-4 font-bold border-b pb-2">Tasks</div>
        <div className="flex flex-col gap-1">
          {rootTasks.length === 0 ? (
            <div className="text-gray-400 text-sm font-bubbler">No tasks yet. Create one below.</div>
          ) : (
            rootTasks.map(task => (
              <TaskNode key={task.id} task={task} project={project} allTasks={tasks} allProjects={allProjects} onSelectProject={onSelectProject} level={0} />
            ))
          )}
        </div>

        <form onSubmit={handleAddTask} className="mt-6 flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add a new root task/milestone..."
            className="flex-1 border border-gray-300 rounded px-3 py-2 font-bubbler text-lg focus:outline-none focus:border-gray-900"
          />
          {project.project_type === 'learning' && (
            <select
              value={linkedProjectId}
              onChange={(e) => setLinkedProjectId(e.target.value)}
              className="border border-gray-300 rounded px-2 py-2 font-bubbler focus:outline-none focus:border-gray-900 max-w-[200px]"
            >
              <option value="">+ Link Project</option>
              {allProjects.filter(p => p.id !== project.id && p.project_type === 'project').map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded font-bubbler">
            Add
          </button>
        </form>
      </div>
    </div>
  )
}

function TaskNode({ task, project, allTasks, allProjects, onSelectProject, level }) {
  const { toggleTaskCompletion, deleteTask, addTask } = useProjectsStore()
  const [expanded, setExpanded] = useState(true)
  const [showAddSubtask, setShowAddSubtask] = useState(false)
  const [subtaskTitle, setSubtaskTitle] = useState('')
  const [linkedProjectId, setLinkedProjectId] = useState('')

  const children = allTasks.filter(t => t.parent_task_id === task.id)
  const linkedProject = task.linked_project_id ? allProjects.find(p => p.id === task.linked_project_id) : null

  const handleAddSubtask = (e) => {
    e.preventDefault()
    if (!subtaskTitle.trim() && !linkedProjectId) return
    let title = subtaskTitle.trim()
    if (!title && linkedProjectId) {
      title = allProjects.find(p => p.id === linkedProjectId)?.name || 'Linked Project'
    }
    addTask({ 
      projectId: project.id, 
      parentTaskId: task.id, 
      title,
      linkedProjectId: linkedProjectId || null
    })
    setSubtaskTitle('')
    setLinkedProjectId('')
    setShowAddSubtask(false)
    setExpanded(true)
  }

  return (
    <div className="flex flex-col mb-1">
      <div 
        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded group transition-colors"
        style={{ marginLeft: `${level * 1.5}rem` }}
      >
        <div className="flex items-center gap-3">
          {children.length > 0 ? (
            <button 
              onClick={() => setExpanded(!expanded)}
              className="text-gray-400 hover:text-gray-900 w-4 h-4 flex items-center justify-center"
            >
              {expanded ? '▼' : '▶'}
            </button>
          ) : (
            <div className="w-4 h-4" /> // spacing
          )}
          
          <input 
            type="checkbox" 
            checked={task.is_completed}
            onChange={() => toggleTaskCompletion(task.id)}
            className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
          />
          
          <span className={`font-bubbler text-lg flex items-center gap-2 ${task.is_completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {task.title}
            {linkedProject && (
              <button 
                onClick={(e) => { e.stopPropagation(); onSelectProject(linkedProject.id); }}
                className="text-xs px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded flex items-center gap-1 ml-2 transition-colors"
              >
                ↗ {linkedProject.name}
              </button>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => setShowAddSubtask(!showAddSubtask)}
            className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bubbler"
          >
            + Subtask
          </button>
          <button 
            onClick={() => deleteTask(task.id)}
            className="text-xs px-2 py-1 text-red-500 hover:bg-red-50 rounded font-bubbler"
          >
            Delete
          </button>
        </div>
      </div>

      {showAddSubtask && (
        <div style={{ marginLeft: `${(level + 1) * 1.5}rem` }} className="mt-1 mb-2 flex gap-2 pr-2">
          <input
            type="text"
            autoFocus
            value={subtaskTitle}
            onChange={(e) => setSubtaskTitle(e.target.value)}
            placeholder="Subtask title..."
            className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm font-bubbler focus:outline-none focus:border-gray-900"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddSubtask(e)
              if (e.key === 'Escape') setShowAddSubtask(false)
            }}
          />
          {project.project_type === 'learning' && (
            <select
              value={linkedProjectId}
              onChange={(e) => setLinkedProjectId(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm font-bubbler focus:outline-none focus:border-gray-900 max-w-[150px]"
            >
              <option value="">+ Link Project</option>
              {allProjects.filter(p => p.id !== project.id && p.project_type === 'project').map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          <button onClick={handleAddSubtask} className="px-3 py-1 bg-gray-900 text-white rounded text-sm font-bubbler">
            Save
          </button>
          <button onClick={() => setShowAddSubtask(false)} className="px-3 py-1 text-gray-500 hover:bg-gray-100 rounded text-sm font-bubbler">
            Cancel
          </button>
        </div>
      )}

      {expanded && children.length > 0 && (
        <div className="flex flex-col gap-1 border-l border-gray-200 ml-4 mt-1">
          {children.map(child => (
            <TaskNode key={child.id} task={child} project={project} allTasks={allTasks} allProjects={allProjects} onSelectProject={onSelectProject} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function ProjectFormModal({ onClose, onSubmit }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [projectType, setProjectType] = useState('project')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    await onSubmit({ name: name.trim(), description: description.trim(), projectType })
    setIsSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bubbler text-2xl font-bold">New Project</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-bubbler">Project Name</label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 font-bubbler focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                placeholder="e.g. Build a SaaS MVP"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-bubbler">Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 font-bubbler">
                  <input 
                    type="radio" 
                    name="projectType" 
                    value="project" 
                    checked={projectType === 'project'} 
                    onChange={() => setProjectType('project')} 
                    className="text-gray-900 focus:ring-gray-900"
                  />
                  Project
                </label>
                <label className="flex items-center gap-2 font-bubbler">
                  <input 
                    type="radio" 
                    name="projectType" 
                    value="learning" 
                    checked={projectType === 'learning'} 
                    onChange={() => setProjectType('learning')} 
                    className="text-gray-900 focus:ring-gray-900"
                  />
                  Learning
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-bubbler">Description (Optional)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 font-bubbler focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                placeholder="What is this project about?"
                rows={3}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bubbler transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg font-bubbler hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
