import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import './App.css'
import { createSeedTodos } from './data/mockTodos'
import type { Category, Priority, Todo, View } from './types'

const STORAGE_KEY = 'daymark.todos.v1'
const categories: Category[] = ['Work', 'Personal', 'Health']
const priorities: Priority[] = ['low', 'medium', 'high']
type TodoDraft = Pick<Todo, 'id' | 'title' | 'notes' | 'category' | 'priority' | 'dueDate'>

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function loadTodos(): Todo[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed: unknown = JSON.parse(stored)
      if (Array.isArray(parsed)) return parsed as Todo[]
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
  }
  return createSeedTodos()
}

function formatDueDate(dateKey: string) {
  const today = new Date()
  const todayKey = toDateKey(today)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  if (dateKey === todayKey) return 'Today'
  if (dateKey === toDateKey(tomorrow)) return 'Tomorrow'

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${dateKey}T12:00:00`))
}

function TaskIcon({ name }: { name: 'check' | 'edit' | 'plus' | 'search' | 'trash' }) {
  const paths = {
    check: <path d="m5 12 4 4L19 6" />,
    edit: <path d="m4 20 4.2-1 10.6-10.6a2.1 2.1 0 0 0-3-3L5.2 16 4 20Zm10.5-12.5 3 3" />,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <path d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />,
    trash: <path d="M4 7h16m-10 4v6m4-6v6M9 7l1-3h4l1 3m3 0-1 14H7L6 7" />,
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  )
}

function App() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos)
  const [view, setView] = useState<View>('today')
  const [category, setCategory] = useState<Category | 'All'>('All')
  const [query, setQuery] = useState('')
  const [showCompleted, setShowCompleted] = useState(true)
  const [title, setTitle] = useState('')
  const [newCategory, setNewCategory] = useState<Category>('Work')
  const [newPriority, setNewPriority] = useState<Priority>('medium')
  const [newDueDate, setNewDueDate] = useState(toDateKey(new Date()))
  const [editDraft, setEditDraft] = useState<TodoDraft | null>(null)
  const [editError, setEditError] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  }, [todos])

  const todayKey = toDateKey(new Date())
  const completedCount = todos.filter((todo) => todo.completed).length
  const activeCount = todos.length - completedCount
  const progress = todos.length ? Math.round((completedCount / todos.length) * 100) : 0

  const visibleTodos = useMemo(() => {
    return todos
      .filter((todo) => {
        if (view === 'today' && todo.dueDate > todayKey) return false
        if (view === 'upcoming' && todo.dueDate <= todayKey) return false
        if (category !== 'All' && todo.category !== category) return false
        if (!showCompleted && todo.completed) return false
        return `${todo.title} ${todo.notes}`.toLowerCase().includes(query.toLowerCase())
      })
      .sort((a, b) => Number(a.completed) - Number(b.completed) || a.dueDate.localeCompare(b.dueDate))
  }, [category, query, showCompleted, todos, todayKey, view])

  function addTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) return

    setTodos((current) => [
      {
        id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
        title: cleanTitle,
        notes: '',
        completed: false,
        priority: newPriority,
        category: newCategory,
        dueDate: newDueDate,
      },
      ...current,
    ])
    setTitle('')
  }

  function toggleTodo(id: string) {
    setTodos((current) =>
      current.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)),
    )
  }

  function deleteTodo(id: string) {
    setTodos((current) => current.filter((todo) => todo.id !== id))
    if (editDraft?.id === id) setEditDraft(null)
  }

  function startEditing(todo: Todo) {
    setEditDraft({
      id: todo.id,
      title: todo.title,
      notes: todo.notes,
      category: todo.category,
      priority: todo.priority,
      dueDate: todo.dueDate,
    })
    setEditError('')
  }

  function cancelEditing() {
    setEditDraft(null)
    setEditError('')
  }

  function saveTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editDraft) return

    const cleanTitle = editDraft.title.trim()
    if (!cleanTitle) {
      setEditError('Task title is required.')
      return
    }

    setTodos((current) =>
      current.map((todo) =>
        todo.id === editDraft.id
          ? { ...todo, ...editDraft, title: cleanTitle, notes: editDraft.notes.trim() }
          : todo,
      ),
    )
    cancelEditing()
  }

  const navItems: { id: View; label: string; symbol: string; count: number }[] = [
    { id: 'today', label: 'Today', symbol: '⌁', count: todos.filter((todo) => todo.dueDate <= todayKey && !todo.completed).length },
    { id: 'upcoming', label: 'Upcoming', symbol: '□', count: todos.filter((todo) => todo.dueDate > todayKey && !todo.completed).length },
    { id: 'all', label: 'All tasks', symbol: '≡', count: activeCount },
  ]

  const currentTitle = category !== 'All' ? category : navItems.find((item) => item.id === view)?.label
  const dateLabel = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="Daymark home">
          <span className="brand-mark"><TaskIcon name="check" /></span>
          <span>Daymark</span>
        </a>

        <nav aria-label="Task views">
          <p className="nav-label">My tasks</p>
          {navItems.map((item) => (
            <button
              className={`nav-item ${view === item.id && category === 'All' ? 'active' : ''}`}
              key={item.id}
              onClick={() => {
                setView(item.id)
                setCategory('All')
              }}
              type="button"
            >
              <span className="nav-symbol" aria-hidden="true">{item.symbol}</span>
              <span>{item.label}</span>
              <span className="nav-count">{item.count}</span>
            </button>
          ))}

          <p className="nav-label categories-label">Categories</p>
          {categories.map((item) => (
            <button
              className={`nav-item ${category === item ? 'active' : ''}`}
              key={item}
              onClick={() => {
                setCategory(item)
                setView('all')
              }}
              type="button"
            >
              <span className={`category-dot ${item.toLowerCase()}`} aria-hidden="true" />
              <span>{item}</span>
              <span className="nav-count">
                {todos.filter((todo) => todo.category === item && !todo.completed).length}
              </span>
            </button>
          ))}
        </nav>

        <div className="sidebar-quote">
          <span aria-hidden="true">✦</span>
          <p>Small steps, every day.</p>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <p className="eyebrow">{dateLabel}</p>
            <h1>Make today count.</h1>
          </div>
          <div className="profile">
            <div>
              <strong>Alex Morgan</strong>
              <span>Staying focused</span>
            </div>
            <div className="avatar" aria-hidden="true">AM</div>
          </div>
        </header>

        <section className="summary-grid" aria-label="Task summary">
          <article className="summary-card primary-card">
            <div>
              <span className="summary-kicker">Daily progress</span>
              <strong>{progress}%</strong>
              <p>{completedCount} of {todos.length} tasks complete</p>
            </div>
            <div className="progress-ring" style={{ '--progress': `${progress * 3.6}deg` } as CSSProperties}>
              <span>{progress}%</span>
            </div>
          </article>
          <article className="summary-card">
            <span className="metric-icon amber" aria-hidden="true">↗</span>
            <div>
              <strong>{activeCount}</strong>
              <p>Tasks to go</p>
            </div>
          </article>
          <article className="summary-card">
            <span className="metric-icon green" aria-hidden="true">✓</span>
            <div>
              <strong>{completedCount}</strong>
              <p>Completed</p>
            </div>
          </article>
        </section>

        <section className="tasks-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Your plan</p>
              <h2>{currentTitle}</h2>
            </div>
            <label className="search">
              <span className="sr-only">Search tasks</span>
              <TaskIcon name="search" />
              <input
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tasks"
                type="search"
                value={query}
              />
            </label>
          </div>

          <form className="add-task" onSubmit={addTodo}>
            <div className="add-title">
              <TaskIcon name="plus" />
              <label className="sr-only" htmlFor="new-task">Add a new task</label>
              <input
                id="new-task"
                onChange={(event) => setTitle(event.target.value)}
                placeholder="What needs to get done?"
                value={title}
              />
            </div>
            <div className="add-options">
              <label>
                <span className="sr-only">Category</span>
                <select value={newCategory} onChange={(event) => setNewCategory(event.target.value as Category)}>
                  {categories.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>
                <span className="sr-only">Priority</span>
                <select value={newPriority} onChange={(event) => setNewPriority(event.target.value as Priority)}>
                  {priorities.map((item) => <option key={item}>{item} priority</option>)}
                </select>
              </label>
              <label>
                <span className="sr-only">Due date</span>
                <input type="date" value={newDueDate} onChange={(event) => setNewDueDate(event.target.value)} />
              </label>
              <button type="submit">Add task</button>
            </div>
          </form>

          <div className="list-toolbar">
            <p>{visibleTodos.length} {visibleTodos.length === 1 ? 'task' : 'tasks'}</p>
            <label className="completed-toggle">
              <input
                checked={showCompleted}
                onChange={(event) => setShowCompleted(event.target.checked)}
                type="checkbox"
              />
              Show completed
            </label>
          </div>

          <ul className="todo-list" aria-live="polite">
            {visibleTodos.map((todo) => (
              <li className={`${todo.completed ? 'completed' : ''} ${editDraft?.id === todo.id ? 'editing' : ''}`} key={todo.id}>
                {editDraft?.id === todo.id ? (
                  <form aria-label={`Edit ${todo.title}`} className="edit-task" onSubmit={saveTodo}>
                    <div className="edit-fields">
                      <label className="edit-title">
                        <span>Task title</span>
                        <input
                          aria-describedby={editError ? `edit-error-${todo.id}` : undefined}
                          aria-invalid={Boolean(editError)}
                          autoFocus
                          onChange={(event) => {
                            setEditDraft({ ...editDraft, title: event.target.value })
                            setEditError('')
                          }}
                          value={editDraft.title}
                        />
                      </label>
                      <label className="edit-notes">
                        <span>Notes</span>
                        <textarea
                          onChange={(event) => setEditDraft({ ...editDraft, notes: event.target.value })}
                          rows={2}
                          value={editDraft.notes}
                        />
                      </label>
                      <label>
                        <span>Category</span>
                        <select
                          onChange={(event) => setEditDraft({ ...editDraft, category: event.target.value as Category })}
                          value={editDraft.category}
                        >
                          {categories.map((item) => <option key={item}>{item}</option>)}
                        </select>
                      </label>
                      <label>
                        <span>Priority</span>
                        <select
                          onChange={(event) => setEditDraft({ ...editDraft, priority: event.target.value as Priority })}
                          value={editDraft.priority}
                        >
                          {priorities.map((item) => <option key={item}>{item}</option>)}
                        </select>
                      </label>
                      <label>
                        <span>Due date</span>
                        <input
                          onChange={(event) => setEditDraft({ ...editDraft, dueDate: event.target.value })}
                          type="date"
                          value={editDraft.dueDate}
                        />
                      </label>
                    </div>
                    {editError && <p className="edit-error" id={`edit-error-${todo.id}`} role="alert">{editError}</p>}
                    <div className="edit-form-actions">
                      <button className="cancel-edit" onClick={cancelEditing} type="button">Cancel</button>
                      <button className="save-edit" type="submit">Save changes</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <button
                      aria-label={`${todo.completed ? 'Mark active' : 'Complete'}: ${todo.title}`}
                      className="check-button"
                      onClick={() => toggleTodo(todo.id)}
                      type="button"
                    >
                      {todo.completed && <TaskIcon name="check" />}
                    </button>
                    <div className="todo-copy">
                      <strong>{todo.title}</strong>
                      {todo.notes && <p>{todo.notes}</p>}
                      <div className="todo-meta">
                        <span className={`category-pill ${todo.category.toLowerCase()}`}>{todo.category}</span>
                        <span className={`priority ${todo.priority}`}>{todo.priority}</span>
                        <time dateTime={todo.dueDate}>{formatDueDate(todo.dueDate)}</time>
                      </div>
                    </div>
                    <div className="todo-actions">
                      <button
                        aria-label={`Edit: ${todo.title}`}
                        className="edit-button"
                        onClick={() => startEditing(todo)}
                        type="button"
                      >
                        <TaskIcon name="edit" />
                      </button>
                      <button
                        aria-label={`Delete: ${todo.title}`}
                        className="delete-button"
                        onClick={() => deleteTodo(todo.id)}
                        type="button"
                      >
                        <TaskIcon name="trash" />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>

          {visibleTodos.length === 0 && (
            <div className="empty-state">
              <span aria-hidden="true">✓</span>
              <h3>All clear</h3>
              <p>No tasks match this view. Add one above or try another filter.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
