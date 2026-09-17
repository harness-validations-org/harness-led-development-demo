export type Category = 'Work' | 'Personal' | 'Health'
export type Priority = 'low' | 'medium' | 'high'
export type View = 'today' | 'upcoming' | 'all'

export interface Todo {
  id: string
  title: string
  notes: string
  completed: boolean
  priority: Priority
  category: Category
  dueDate: string
}
