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

  it('edits every task detail and persists the changes', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowKey = [
      tomorrow.getFullYear(),
      String(tomorrow.getMonth() + 1).padStart(2, '0'),
      String(tomorrow.getDate()).padStart(2, '0'),
    ].join('-')
    const { unmount } = render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /All tasks/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Edit: Finalize the product roadmap' }))

    expect(screen.getByLabelText('Edit task title')).toHaveValue('Finalize the product roadmap')
    expect(screen.getByLabelText('Edit notes')).toHaveValue(
      'Review milestones and share the updated draft with the team.',
    )
    expect(screen.getByLabelText('Edit category')).toHaveValue('Work')
    expect(screen.getByLabelText('Edit priority')).toHaveValue('high')
    expect(screen.getByLabelText('Edit task title')).toHaveFocus()

    fireEvent.change(screen.getByLabelText('Edit task title'), {
      target: { value: 'Finalize the revised roadmap' },
    })
    fireEvent.change(screen.getByLabelText('Edit notes'), {
      target: { value: 'Share the approved milestones.' },
    })
    fireEvent.change(screen.getByLabelText('Edit category'), { target: { value: 'Personal' } })
    fireEvent.change(screen.getByLabelText('Edit priority'), { target: { value: 'low' } })
    fireEvent.change(screen.getByLabelText('Edit due date'), { target: { value: tomorrowKey } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(screen.getAllByText('Finalize the revised roadmap')).toHaveLength(1)
    expect(screen.queryByText('Finalize the product roadmap')).not.toBeInTheDocument()
    expect(screen.getByText('Share the approved milestones.')).toBeInTheDocument()
    expect(
      within(screen.getByText('Finalize the revised roadmap').closest('li')!).getByText('Tomorrow'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Complete: Finalize the revised roadmap' }),
    ).toBeInTheDocument()

    const stored = JSON.parse(localStorage.getItem('daymark.todos.v1') ?? '[]')
    expect(stored).toContainEqual(
      expect.objectContaining({
        id: 'seed-1',
        title: 'Finalize the revised roadmap',
        notes: 'Share the approved milestones.',
        category: 'Personal',
        priority: 'low',
        dueDate: tomorrowKey,
        completed: false,
      }),
    )

    unmount()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /All tasks/ }))
    expect(screen.getByText('Finalize the revised roadmap')).toBeInTheDocument()
    expect(screen.queryByText('Finalize the product roadmap')).not.toBeInTheDocument()
  })

  it('cancels edits and rejects a blank title', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Edit: Finalize the product roadmap' }))
    fireEvent.change(screen.getByLabelText('Edit task title'), {
      target: { value: 'Do not keep this title' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getAllByText('Finalize the product roadmap')).toHaveLength(1)
    expect(screen.queryByText('Do not keep this title')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Edit: Finalize the product roadmap' }))
    fireEvent.change(screen.getByLabelText('Edit task title'), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Task title is required.')
    expect(screen.getByLabelText('Edit task title')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('daymark.todos.v1') ?? '[]')).toContainEqual(
      expect.objectContaining({ id: 'seed-1', title: 'Finalize the product roadmap' }),
    )
  })

  it('uses edited values for search and existing task actions', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Edit: Finalize the product roadmap' }))
    fireEvent.change(screen.getByLabelText('Edit task title'), {
      target: { value: 'Publish the revised roadmap' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    fireEvent.change(screen.getByPlaceholderText('Search tasks'), {
      target: { value: 'Publish' },
    })
    expect(screen.getByText('Publish the revised roadmap')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Complete: Publish the revised roadmap' }))
    expect(
      screen.getByRole('button', { name: 'Mark active: Publish the revised roadmap' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Delete: Publish the revised roadmap' }))
    expect(screen.queryByText('Publish the revised roadmap')).not.toBeInTheDocument()
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
