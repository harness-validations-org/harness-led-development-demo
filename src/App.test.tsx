import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('Daymark', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts with useful mock tasks and progress', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Make today count.' })).toBeInTheDocument()
    expect(screen.getByText('Finalize the product roadmap')).toBeInTheDocument()
    expect(screen.getByText('2 of 6 tasks complete')).toBeInTheDocument()
  })

  it('adds a task and persists it', () => {
    render(<App />)

    fireEvent.change(screen.getByPlaceholderText('What needs to get done?'), {
      target: { value: 'Prepare tomorrow’s brief' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add task' }))

    expect(screen.getByText('Prepare tomorrow’s brief')).toBeInTheDocument()
    expect(localStorage.getItem('daymark.todos.v1')).toContain('Prepare tomorrow’s brief')
  })

  it('completes and removes tasks', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Complete: Finalize the product roadmap' }))
    expect(
      screen.getByRole('button', { name: 'Mark active: Finalize the product roadmap' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Delete: Finalize the product roadmap' }))
    expect(screen.queryByText('Finalize the product roadmap')).not.toBeInTheDocument()
  })

  it('edits every task detail, preserves completion, and persists the changes', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Edit: Morning strength session' }))
    const editor = screen.getByRole('form', { name: 'Edit Morning strength session' })
    fireEvent.change(within(editor).getByLabelText('Task title'), {
      target: { value: 'Evening strength session' },
    })
    fireEvent.change(within(editor).getByLabelText('Notes'), {
      target: { value: 'Lower body · 40 minutes' },
    })
    fireEvent.change(within(editor).getByLabelText('Category'), {
      target: { value: 'Personal' },
    })
    fireEvent.change(within(editor).getByLabelText('Priority'), {
      target: { value: 'high' },
    })
    fireEvent.change(within(editor).getByLabelText('Due date'), {
      target: { value: '2020-01-01' },
    })
    fireEvent.click(within(editor).getByRole('button', { name: 'Save changes' }))

    const updatedRow = screen.getByText('Evening strength session').closest('li')
    expect(updatedRow).not.toBeNull()
    expect(within(updatedRow!).getByText('Lower body · 40 minutes')).toBeInTheDocument()
    expect(within(updatedRow!).getByText('Personal')).toBeInTheDocument()
    expect(within(updatedRow!).getByText('high')).toBeInTheDocument()
    expect(
      within(updatedRow!).getByRole('button', { name: 'Mark active: Evening strength session' }),
    ).toBeInTheDocument()

    const stored = JSON.parse(localStorage.getItem('daymark.todos.v1') ?? '[]')
    expect(stored).toContainEqual(expect.objectContaining({
      id: 'seed-2',
      title: 'Evening strength session',
      notes: 'Lower body · 40 minutes',
      completed: true,
      category: 'Personal',
      priority: 'high',
      dueDate: '2020-01-01',
    }))
  })

  it('rejects an empty edited title and cancels without saving', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Edit: Finalize the product roadmap' }))
    const editor = screen.getByRole('form', { name: 'Edit Finalize the product roadmap' })
    const titleInput = within(editor).getByLabelText('Task title')
    fireEvent.change(titleInput, { target: { value: '   ' } })
    fireEvent.click(within(editor).getByRole('button', { name: 'Save changes' }))

    expect(within(editor).getByRole('alert')).toHaveTextContent('Task title is required.')
    expect(localStorage.getItem('daymark.todos.v1')).toContain('Finalize the product roadmap')

    fireEvent.change(titleInput, { target: { value: 'Unsaved title' } })
    fireEvent.click(within(editor).getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText('Finalize the product roadmap')).toBeInTheDocument()
    expect(screen.queryByText('Unsaved title')).not.toBeInTheDocument()
    expect(localStorage.getItem('daymark.todos.v1')).not.toContain('Unsaved title')
  })

  it('filters the list by category and search query', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /Personal/ }))
    expect(screen.getByText('Book the weekend train')).toBeInTheDocument()
    expect(screen.queryByText('Finalize the product roadmap')).not.toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Search tasks'), {
      target: { value: 'Mom' },
    })
    expect(screen.getByText('Call Mom')).toBeInTheDocument()
    expect(screen.queryByText('Book the weekend train')).not.toBeInTheDocument()
  })
})
