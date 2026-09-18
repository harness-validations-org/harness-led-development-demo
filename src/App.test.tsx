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
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Edit: Finalize the product roadmap' }))
    const editor = screen.getByRole('form', { name: 'Edit task: Finalize the product roadmap' })

    fireEvent.change(within(editor).getByRole('textbox', { name: 'Title' }), {
      target: { value: 'Publish the product roadmap' },
    })
    fireEvent.change(within(editor).getByRole('textbox', { name: 'Notes' }), {
      target: { value: 'Send the approved version to the team.' },
    })
    fireEvent.change(within(editor).getByRole('combobox', { name: 'Category' }), {
      target: { value: 'Personal' },
    })
    fireEvent.change(within(editor).getByRole('combobox', { name: 'Priority' }), {
      target: { value: 'low' },
    })
    fireEvent.change(within(editor).getByLabelText('Due date'), {
      target: { value: '2099-01-15' },
    })
    fireEvent.click(within(editor).getByRole('button', { name: 'Save changes' }))
    fireEvent.click(screen.getByRole('button', { name: /All tasks/ }))

    expect(screen.getByText('Publish the product roadmap')).toBeInTheDocument()
    expect(screen.getByText('Send the approved version to the team.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Complete: Publish the product roadmap' })).toBeInTheDocument()
    expect(screen.getAllByText('Publish the product roadmap')).toHaveLength(1)
    expect(localStorage.getItem('daymark.todos.v1')).toContain('2099-01-15')
  })

  it('rejects a blank edit and cancel restores the original task', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Edit: Finalize the product roadmap' }))
    const editor = screen.getByRole('form', { name: 'Edit task: Finalize the product roadmap' })
    const titleInput = within(editor).getByRole('textbox', { name: 'Title' })

    fireEvent.change(titleInput, { target: { value: '   ' } })
    fireEvent.click(within(editor).getByRole('button', { name: 'Save changes' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a title before saving.')
    expect(titleInput).toHaveAttribute('aria-invalid', 'true')
    expect(localStorage.getItem('daymark.todos.v1')).toContain('Finalize the product roadmap')

    fireEvent.change(titleInput, { target: { value: 'Unsaved replacement' } })
    fireEvent.click(within(editor).getByRole('button', { name: 'Cancel' }))

    expect(screen.getByText('Finalize the product roadmap')).toBeInTheDocument()
    expect(screen.queryByText('Unsaved replacement')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit: Finalize the product roadmap' })).toBeInTheDocument()
  })

  it('loads saved edits on a later render', () => {
    const { unmount } = render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Edit: Finalize the product roadmap' }))
    const editor = screen.getByRole('form', { name: 'Edit task: Finalize the product roadmap' })
    fireEvent.change(within(editor).getByRole('textbox', { name: 'Title' }), {
      target: { value: 'Review the saved roadmap' },
    })
    fireEvent.click(within(editor).getByRole('button', { name: 'Save changes' }))
    unmount()

    render(<App />)

    expect(screen.getByText('Review the saved roadmap')).toBeInTheDocument()
    expect(screen.queryByText('Finalize the product roadmap')).not.toBeInTheDocument()
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
