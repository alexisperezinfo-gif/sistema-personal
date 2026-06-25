export interface Contribution {
  id: string
  amount: number
  date: string // ISO date
  note?: string
}

export interface SavingGoal {
  id: string
  title: string
  description: string
  imageDataUrl?: string
  targetAmount: number
  contributions: Contribution[]
  createdAt: string
  achievedAt?: string
}

export type ObjectiveCategory = 'personal' | 'profesional'
export type ObjectiveStatus = 'pendiente' | 'en_progreso' | 'logrado'

export interface Objective {
  id: string
  title: string
  category: ObjectiveCategory
  status: ObjectiveStatus
  notes?: string
  dueDate?: string
  createdAt: string
}

export type HabitFrequency = 'diaria' | 'semanal'

export interface Habit {
  id: string
  title: string
  frequency: HabitFrequency
  history: string[] // YYYY-MM-DD
  createdAt: string
}

export interface Settings {
  theme: 'light' | 'dark'
  currencySymbol: string
}

export interface AppData {
  goals: SavingGoal[]
  objectives: Objective[]
  habits: Habit[]
  settings: Settings
}
