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
export type ObjectivePriority = 'baja' | 'media' | 'alta'

export interface SubTask {
  id: string
  title: string
  done: boolean
}

export interface Objective {
  id: string
  title: string
  category: ObjectiveCategory
  status: ObjectiveStatus
  priority?: ObjectivePriority
  subtasks?: SubTask[]
  notes?: string
  dueDate?: string
  createdAt: string
}

export type HabitFrequency = 'diaria' | 'semanal'

export interface Habit {
  id: string
  title: string
  description?: string
  frequency: HabitFrequency
  /** Para hábitos diarios: días de la semana en los que aplica (0=domingo … 6=sábado). Vacío/undefined = todos los días. */
  weekdays?: number[]
  history: string[] // YYYY-MM-DD
  createdAt: string
}

export interface Project {
  id: string
  name: string
  color: string
  /** Objetivo de horas semanales (opcional). */
  weeklyTargetHours?: number
  archived?: boolean
  createdAt: string
}

export interface TimeEntry {
  id: string
  projectId: string
  date: string // YYYY-MM-DD
  minutes: number
  note?: string
  createdAt: string
}

/** Cronómetro en curso, persistido para sobrevivir recargas. */
export interface RunningTimer {
  projectId: string
  startedAt: string // ISO
  note?: string
}

export interface Subscription {
  id: string
  name: string
  amount: number
  /** Día del mes en que se cobra (1–31). */
  dueDay: number
  note?: string
  color?: string
  /** Meses pagados, en formato YYYY-MM. */
  paidMonths: string[]
  archived?: boolean
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
  projects: Project[]
  timeEntries: TimeEntry[]
  subscriptions: Subscription[]
  settings: Settings
}
