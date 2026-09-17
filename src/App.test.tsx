import { fireEvent, render, screen } from '@testing-library/react'
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
