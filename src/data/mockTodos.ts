import type { Todo } from '../types'

function dateFrom(today: Date, offset: number) {
  const date = new Date(today)
  date.setDate(date.getDate() + offset)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function createSeedTodos(today = new Date()): Todo[] {
  return [
    {
      id: 'seed-1',
      title: 'Finalize the product roadmap',
      notes: 'Review milestones and share the updated draft with the team.',
      completed: false,
      priority: 'high',
      category: 'Work',
      dueDate: dateFrom(today, 0),
    },
    {
      id: 'seed-2',
      title: 'Morning strength session',
      notes: 'Upper body · 35 minutes',
      completed: true,
      priority: 'medium',
      category: 'Health',
      dueDate: dateFrom(today, 0),
    },
    {
      id: 'seed-3',
      title: 'Book the weekend train',
      notes: 'Check the flexible return options.',
      completed: false,
      priority: 'medium',
      category: 'Personal',
      dueDate: dateFrom(today, 0),
    },
    {
      id: 'seed-4',
      title: 'Send campaign feedback',
      notes: 'Focus on the revised opening and call to action.',
      completed: false,
      priority: 'low',
      category: 'Work',
      dueDate: dateFrom(today, 1),
    },
    {
      id: 'seed-5',
      title: 'Plan next week’s meals',
      notes: 'Keep Thursday quick and make extra for Friday.',
      completed: false,
      priority: 'low',
      category: 'Health',
      dueDate: dateFrom(today, 2),
    },
    {
      id: 'seed-6',
      title: 'Call Mom',
      notes: '',
      completed: true,
      priority: 'medium',
      category: 'Personal',
      dueDate: dateFrom(today, -1),
    },
  ]
}
