'use client'

import { useState, useEffect, type FormEvent } from 'react'
import './todo.css'
import {
  resendSignupEmail,
  signInWithGoogle,
  supabase,
  signInWithEmail,
  signOutUser,
  signUpWithEmail,
} from '@/lib/supabase'

type Task = {
  id: number
  title: string
  priority: 'Low' | 'Medium' | 'High'
  completed: boolean
  dueDate: string | null
}

type AppUser = {
  id: string
  username: string
  email: string
}

type DbTask = {
  id: number
  user_id: string
  title: string
  priority: 'Low' | 'Medium' | 'High'
  completed: boolean
  due_date: string | null
  position: number
}

const uiToDbPriorityMap: Record<'low' | 'medium' | 'high', Task['priority']> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

const dbToUiPriorityMap: Record<Task['priority'], 'low' | 'medium' | 'high'> = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
}

const getReadableAuthError = (message?: string) => {
  const normalized = (message || '').toLowerCase()

  if (normalized.includes('invalid login credentials')) {
    return 'Login failed. Agar account naya banaya hai to pehle email verify karo.'
  }

  if (normalized.includes('email not confirmed')) {
    return 'Email verify nahi hua. Inbox me Supabase verification mail open karke confirm karo.'
  }

  if (normalized.includes('password should be at least')) {
    return 'Password kam se kam 6 characters ka rakho.'
  }

  if (normalized.includes('email rate limit exceeded') || normalized.includes('security purposes')) {
    return 'Verification email rate limit hit ho gaya. 1-5 min wait karo, phir resend karo.'
  }

  return message || 'Authentication failed. Please try again.'
}

export default function TodoApp() {
  const [currentPage, setCurrentPage] = useState('login')
  const [user, setUser] = useState<AppUser | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [nightMode, setNightMode] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const getEmailRedirectTo = () => {
    if (typeof window === 'undefined') return undefined
    return window.location.origin
  }

  // Load data on mount
  useEffect(() => {
    const savedNightMode = localStorage.getItem('nightMode') === 'true'

    setNightMode(savedNightMode)

    const restoreSession = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (error || !data.user) return

      const username =
        (data.user.user_metadata?.username as string | undefined) ||
        data.user.email?.split('@')[0] ||
        'user'
      const email = data.user.email || ''

      const appUser = { username, email }
      const appUserWithId = { ...appUser, id: data.user.id }
      setUser(appUserWithId)
      setCurrentPage('dashboard')
      await loadUserTasks(data.user.id)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setUser(null)
        setTasks([])
        setCurrentPage('login')
        return
      }

      const username =
        (session.user.user_metadata?.username as string | undefined) ||
        session.user.email?.split('@')[0] ||
        'user'
      const email = session.user.email || ''

      setUser({ id: session.user.id, username, email })
      setCurrentPage('dashboard')
      await loadUserTasks(session.user.id)
    })

    restoreSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const verifySupabaseConnection = async () => {
      const { error } = await supabase.auth.getSession()
      if (error) {
        console.error('Supabase connection failed:', error.message)
        showNotification('Supabase connection failed. Check env values.', 'error')
        return
      }

      console.log('Supabase connected successfully')
    }

    verifySupabaseConnection()
  }, [])

  useEffect(() => {
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = String(event.reason ?? '')
      if (reason.includes('Failed to connect to MetaMask') || reason.includes('MetaMask extension not found')) {
        event.preventDefault()
      }
    }

    window.addEventListener('unhandledrejection', onUnhandledRejection)
    return () => {
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])

  // Apply night mode
  useEffect(() => {
    if (nightMode) {
      document.body.classList.add('night-mode')
    } else {
      document.body.classList.remove('night-mode')
    }
    localStorage.setItem('nightMode', nightMode.toString())
  }, [nightMode])

  const mapDbTaskToTask = (dbTask: DbTask): Task => ({
    id: dbTask.id,
    title: dbTask.title,
    priority: dbTask.priority,
    completed: dbTask.completed,
    dueDate: dbTask.due_date
  })

  const loadUserTasks = async (userId: string) => {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, user_id, title, priority, completed, due_date, position')
      .eq('user_id', userId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Load tasks failed:', error.message)
      showNotification('Could not load tasks from Supabase.', 'error')
      return
    }

    setTasks((data || []).map((task) => mapDbTaskToTask(task as DbTask)))
  }

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const email = ((document.getElementById('login-email') as HTMLInputElement)?.value || '').trim().toLowerCase()
    const password = ((document.getElementById('login-password') as HTMLInputElement)?.value || '').trim()

    if (!email.includes('@')) {
      showNotification('Login me email use karo, username nahi.', 'error')
      return
    }

    const { data, error } = await signInWithEmail(email, password)

    if (error || !data.user) {
      showNotification(getReadableAuthError(error?.message), 'error')
      return
    }

    const username =
      (data.user.user_metadata?.username as string | undefined) ||
      data.user.email?.split('@')[0] ||
      'user'
    setUser({ id: data.user.id, username, email })
    await loadUserTasks(data.user.id)
    setCurrentPage('dashboard')
  }

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const username = ((document.getElementById('signup-username') as HTMLInputElement)?.value || '').trim()
    const email = ((document.getElementById('signup-email') as HTMLInputElement)?.value || '').trim().toLowerCase()
    const password = ((document.getElementById('signup-password') as HTMLInputElement)?.value || '').trim()

    if (password.length < 6) {
      showNotification('Password kam se kam 6 characters ka hona chahiye.', 'error')
      return
    }

    const { data, error } = await signUpWithEmail(email, password, username, getEmailRedirectTo())

    if (error) {
      showNotification(getReadableAuthError(error.message), 'error')
      return
    }

    if (data.session && data.user) {
      const nextUsername =
        (data.user.user_metadata?.username as string | undefined) ||
        data.user.email?.split('@')[0] ||
        username ||
        'user'
      setUser({ id: data.user.id, username: nextUsername, email: data.user.email || email })
      await loadUserTasks(data.user.id)
      setCurrentPage('dashboard')
      showNotification('Signup successful. You are logged in.', 'success')
      return
    }

    showNotification('Account created. Check your email to verify, then login.', 'success')
    setCurrentPage('login')
  }

  const handleResendVerification = async () => {
    const email = ((document.getElementById('login-email') as HTMLInputElement)?.value || '').trim().toLowerCase()
    if (!email || !email.includes('@')) {
      showNotification('Pehle login email field me valid email likho.', 'error')
      return
    }

    const { error } = await resendSignupEmail(email, getEmailRedirectTo())
    if (error) {
      showNotification(getReadableAuthError(error.message), 'error')
      return
    }

    showNotification('Verification email sent. Inbox/Spam check karo.', 'success')
  }

  const handleGoogleContinue = async () => {
    const { error } = await signInWithGoogle()
    if (error) {
      showNotification(getReadableAuthError(error.message), 'error')
    }
  }

  const handleDemoLogin = async () => {
    showNotification('Demo mode disabled. Please login/signup to save your own tasks in Supabase.', 'info')
  }

  const handleAddTask = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    const cleanedTitle = newTaskTitle.trim()
    if (!cleanedTitle) {
      showNotification('Task likho, phir add karo.', 'error')
      return
    }

    const newTaskPayload = {
      user_id: user.id,
      title: cleanedTitle,
      priority: uiToDbPriorityMap[newTaskPriority],
      completed: false,
      due_date: newTaskDueDate || null
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert(newTaskPayload)
      .select('id, user_id, title, priority, completed, due_date, position')
      .single()

    if (error) {
      console.error('Add task failed:', error.message)
      showNotification('Could not add task to Supabase.', 'error')
      return
    }

    setTasks([mapDbTaskToTask(data as DbTask), ...tasks])
    
    setNewTaskTitle('')
    setNewTaskPriority('medium')
    setNewTaskDueDate('')
    showNotification('Task added!', 'success')
  }

  const handleToggleTask = async (id: number) => {
    const taskToUpdate = tasks.find((t) => t.id === id)
    if (!taskToUpdate) return

    const nextCompleted = !taskToUpdate.completed
    const { error } = await supabase
      .from('tasks')
      .update({ completed: nextCompleted })
      .eq('id', id)

    if (error) {
      console.error('Toggle task failed:', error.message)
      showNotification('Could not update task.', 'error')
      return
    }

    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: nextCompleted } : t)))
  }

  const handleDeleteTask = async (id: number) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)

    if (error) {
      console.error('Delete task failed:', error.message)
      showNotification('Could not delete task.', 'error')
      return
    }

    const updatedTasks = tasks.filter((t) => t.id !== id)
    setTasks(updatedTasks)
    showNotification('Task deleted', 'success')
  }

  const handleEditTask = (id: number) => {
    const task = tasks.find(t => t.id === id)
    if (task) {
      setEditingTask(task)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingTask) return

    const { error } = await supabase
      .from('tasks')
      .update({
        title: editingTask.title,
        priority: editingTask.priority,
        due_date: editingTask.dueDate
      })
      .eq('id', editingTask.id)

    if (error) {
      console.error('Edit task failed:', error.message)
      showNotification('Could not save task changes.', 'error')
      return
    }

    const updatedTasks = tasks.map((t) => 
      t.id === editingTask.id ? editingTask : t
    )
    setTasks(updatedTasks)
    setEditingTask(null)
    showNotification('Task updated!', 'success')
  }

  const handleLogout = async () => {
    const { error } = await signOutUser()
    if (error) {
      showNotification('Logout failed. Try again.', 'error')
      return
    }

    setUser(null)
    setTasks([])
    setCurrentPage('login')
  }

  const showNotification = (message: string, type = 'info') => {
    const notif = document.createElement('div')
    notif.className = `notification ${type}`
    notif.textContent = message
    document.body.appendChild(notif)
    setTimeout(() => notif.remove(), 3000)
  }

  const filterTasks = () => {
    return tasks.filter((t) => 
      t.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const exportTasks = () => {
    const dataStr = JSON.stringify(tasks, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tasks-${new Date().toISOString()}.json`
    link.click()
    showNotification('Tasks exported!', 'success')
  }

  const completedCount = tasks.filter(t => t.completed).length
  const filteredTasks = filterTasks()

  return (
    <div className={nightMode ? 'night-mode' : ''}>
      {/* Login Page */}
      {currentPage === 'login' && (
        <div className="auth-container">
          <div className="auth-card">
            <h1 className="auth-title">✨ Golden Todo</h1>
            <h2 className="form-title" style={{textAlign: 'center', fontSize: '18px', color: 'var(--text-dim)', marginBottom: '30px'}}>Welcome Back</h2>
            
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="login-email">Email</label>
                <input type="email" id="login-email" placeholder="Enter your email" required />
              </div>
              <div className="form-group">
                <label htmlFor="login-password">Password</label>
                <input type="password" id="login-password" placeholder="Enter your password" required />
              </div>
              <button type="submit" className="btn-primary">Login</button>
            </form>

            <button type="button" className="btn-google" onClick={handleGoogleContinue}>
              <span className="google-icon" aria-hidden="true">G</span>
              Continue with Google
            </button>

            <div className="link-text">
              Don't have an account? <a onClick={() => setCurrentPage('signup')}>Sign Up</a>
            </div>

            <div className="link-text" style={{marginTop: '10px'}}>
              <a onClick={handleResendVerification}>Resend verification email</a>
            </div>

            <div className="link-text" style={{marginTop: '10px'}}>
              <a onClick={handleDemoLogin} style={{color: 'var(--success)'}}>Try Demo</a>
            </div>
          </div>
        </div>
      )}

      {/* Signup Page */}
      {currentPage === 'signup' && (
        <div className="auth-container">
          <div className="auth-card">
            <h1 className="auth-title">✨ Golden Todo</h1>
            <h2 className="form-title" style={{textAlign: 'center', fontSize: '18px', color: 'var(--text-dim)', marginBottom: '30px'}}>Create Account</h2>
            
            <form onSubmit={handleSignup}>
              <div className="form-group">
                <label htmlFor="signup-username">Username</label>
                <input type="text" id="signup-username" placeholder="Choose a username" required />
              </div>
              <div className="form-group">
                <label htmlFor="signup-email">Email</label>
                <input type="email" id="signup-email" placeholder="Enter your email" required />
              </div>
              <div className="form-group">
                <label htmlFor="signup-password">Password</label>
                <input type="password" id="signup-password" placeholder="Create a password" required />
              </div>
              <button type="submit" className="btn-primary">Sign Up</button>
            </form>

            <button type="button" className="btn-google" onClick={handleGoogleContinue}>
              <span className="google-icon" aria-hidden="true">G</span>
              Continue with Google
            </button>

            <div className="link-text">
              Already have an account? <a onClick={() => setCurrentPage('login')}>Login</a>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Page */}
      {currentPage === 'dashboard' && (
        <div className="dashboard">
          <div className="dashboard-header">
            <h1 className="dashboard-title">📋 Your Tasks</h1>
            <div className="header-controls">
              <button className="btn-icon" onClick={() => setNightMode(!nightMode)} title="Toggle Night Mode">🌙</button>
              <button className="btn-secondary btn-small" onClick={exportTasks}>📥 Export</button>
              <button className="btn-danger btn-small" onClick={handleLogout}>🚪 Logout</button>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-section">
            <div className="stat-card">
              <div className="stat-number">{tasks.length}</div>
              <div className="stat-label">Total Tasks</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{completedCount}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-card">
              <div style={{fontSize: '48px', color: 'var(--accent-gold)', textAlign: 'center'}}>
                {tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}%
              </div>
              <div className="stat-label">Progress</div>
            </div>
          </div>

          {/* Task Form */}
          <div className="task-form">
            <div className="form-title">➕ Add New Task</div>
            <p className="task-form-hint">Write your task here and click Add Task to save it.</p>
            <form onSubmit={handleAddTask}>
              <div className="task-input-group">
                <input
                  type="text"
                  id="task-input"
                  placeholder="What do you need to do?"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  required
                />
                <button type="submit" className="btn-primary">Add Task</button>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="task-priority">Priority</label>
                  <select
                    id="task-priority"
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="task-duedate">Due Date</label>
                  <input
                    type="date"
                    id="task-duedate"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Search */}
          <div className="search-container">
            <input 
              type="text" 
              placeholder="🔍 Search tasks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Tasks List */}
          <div className="tasks-container">
            {filteredTasks.length > 0 ? (
              filteredTasks.map(task => (
                <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                  <input 
                    type="checkbox" 
                    className="task-checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleTask(task.id)}
                  />
                  <div className="task-content">
                    <div className="task-text">{task.title}</div>
                    <div className="task-meta">
                      <span className={`task-priority ${task.priority.toLowerCase()}`}>{task.priority.toUpperCase()}</span>
                      {task.dueDate && <span>📅 {new Date(task.dueDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="task-actions">
                    <button className="btn-secondary btn-small" onClick={() => handleEditTask(task.id)}>Edit</button>
                    <button className="btn-danger btn-small" onClick={() => handleDeleteTask(task.id)}>Delete</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <div className="empty-text">No tasks found. {searchQuery ? 'Try a different search.' : 'Add one to get started!'}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTask && (
        <div className="modal active">
          <div className="modal-content">
            <h2 className="modal-title">Edit Task</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
              <div className="form-group">
                <label>Task</label>
                <input 
                  type="text" 
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select 
                  value={dbToUiPriorityMap[editingTask.priority]}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      priority: uiToDbPriorityMap[e.target.value as 'low' | 'medium' | 'high'],
                    })
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input 
                  type="date" 
                  value={editingTask.dueDate || ''}
                  onChange={(e) => setEditingTask({...editingTask, dueDate: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">Save Changes</button>
                <button type="button" className="btn-secondary" onClick={() => setEditingTask(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
