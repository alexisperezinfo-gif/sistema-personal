import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import localforage from 'localforage'
import type {
  AppData,
  Contribution,
  Habit,
  HabitFrequency,
  Objective,
  ObjectiveCategory,
  ObjectiveStatus,
  Project,
  RunningTimer,
  SavingGoal,
  Settings,
  Subscription,
  TimeEntry,
} from '../types'
import { monthKey, todayKey, uid } from '../lib/format'

localforage.config({
  name: 'sistema-personal',
  storeName: 'app_data',
})

const forageStorage: StateStorage = {
  getItem: async (name) => (await localforage.getItem<string>(name)) ?? null,
  setItem: async (name, value) => {
    await localforage.setItem(name, value)
  },
  removeItem: async (name) => {
    await localforage.removeItem(name)
  },
}

const defaultSettings: Settings = { theme: 'light', currencySymbol: '$' }

interface StoreState extends AppData {
  _hydrated: boolean
  runningTimer?: RunningTimer
  // saving goals
  addGoal: (g: Omit<SavingGoal, 'id' | 'createdAt' | 'contributions' | 'achievedAt'>) => void
  updateGoal: (id: string, patch: Partial<SavingGoal>) => void
  deleteGoal: (id: string) => void
  restoreGoal: (goal: SavingGoal, index?: number) => void
  addContribution: (goalId: string, amount: number, date: string, note?: string) => void
  updateContribution: (goalId: string, contribId: string, amount: number, date: string, note?: string) => void
  deleteContribution: (goalId: string, contribId: string) => void
  restoreContribution: (goalId: string, contribution: Contribution, index?: number) => void
  // objectives
  addObjective: (title: string, category: ObjectiveCategory) => void
  updateObjective: (id: string, patch: Partial<Objective>) => void
  deleteObjective: (id: string) => void
  restoreObjective: (objective: Objective, index?: number) => void
  addSubtask: (objectiveId: string, title: string) => void
  toggleSubtask: (objectiveId: string, subtaskId: string) => void
  deleteSubtask: (objectiveId: string, subtaskId: string) => void
  // habits
  addHabit: (title: string, frequency: HabitFrequency, opts?: Partial<Pick<Habit, 'description' | 'weekdays'>>) => void
  updateHabit: (id: string, patch: Partial<Habit>) => void
  deleteHabit: (id: string) => void
  restoreHabit: (habit: Habit, index?: number) => void
  toggleHabitToday: (id: string) => void
  // projects & time tracking
  addProject: (p: Omit<Project, 'id' | 'createdAt'>) => void
  updateProject: (id: string, patch: Partial<Project>) => void
  deleteProject: (id: string) => void
  restoreProject: (project: Project, entries?: TimeEntry[], index?: number) => void
  addTimeEntry: (projectId: string, minutes: number, date: string, note?: string) => void
  updateTimeEntry: (id: string, patch: Partial<TimeEntry>) => void
  deleteTimeEntry: (id: string) => void
  restoreTimeEntry: (entry: TimeEntry, index?: number) => void
  startTimer: (projectId: string, note?: string) => void
  stopTimer: () => void
  cancelTimer: () => void
  // subscriptions / pagos mensuales
  addSubscription: (s: Omit<Subscription, 'id' | 'createdAt' | 'paidMonths' | 'archived'>) => void
  updateSubscription: (id: string, patch: Partial<Subscription>) => void
  deleteSubscription: (id: string) => void
  restoreSubscription: (subscription: Subscription, index?: number) => void
  togglePaidMonth: (id: string, month?: string) => void
  /** Suma (o resta) un importe al monto abonado del mes. */
  addPayment: (id: string, amount: number, month?: string) => void
  // settings
  setTheme: (theme: 'light' | 'dark') => void
  setCurrencySymbol: (symbol: string) => void
  // backup
  replaceAll: (data: Partial<AppData>) => void
}

function insertAt<T>(list: T[], item: T, index?: number): T[] {
  const i = index === undefined ? 0 : Math.max(0, Math.min(index, list.length))
  const copy = [...list]
  copy.splice(i, 0, item)
  return copy
}

function recomputeAchieved(goal: SavingGoal): SavingGoal {
  const total = goal.contributions.reduce((s, c) => s + c.amount, 0)
  const reached = goal.targetAmount > 0 && total >= goal.targetAmount
  return {
    ...goal,
    achievedAt: reached ? goal.achievedAt ?? new Date().toISOString() : undefined,
  }
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      goals: [],
      objectives: [],
      habits: [],
      projects: [],
      timeEntries: [],
      subscriptions: [],
      runningTimer: undefined as RunningTimer | undefined,
      settings: defaultSettings,
      _hydrated: false,

      addGoal: (g) =>
        set((s) => ({
          goals: [
            {
              ...g,
              id: uid(),
              contributions: [],
              createdAt: new Date().toISOString(),
            },
            ...s.goals,
          ],
        })),
      updateGoal: (id, patch) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? recomputeAchieved({ ...g, ...patch }) : g)),
        })),
      deleteGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
      restoreGoal: (goal, index) => set((s) => ({ goals: insertAt(s.goals, goal, index) })),
      addContribution: (goalId, amount, date, note) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId
              ? recomputeAchieved({
                  ...g,
                  contributions: [
                    { id: uid(), amount, date, note: note?.trim() || undefined },
                    ...g.contributions,
                  ],
                })
              : g,
          ),
        })),
      updateContribution: (goalId, contribId, amount, date, note) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId
              ? recomputeAchieved({
                  ...g,
                  contributions: g.contributions.map((c) =>
                    c.id === contribId ? { ...c, amount, date, note: note?.trim() || undefined } : c,
                  ),
                })
              : g,
          ),
        })),
      deleteContribution: (goalId, contribId) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId
              ? recomputeAchieved({
                  ...g,
                  contributions: g.contributions.filter((c) => c.id !== contribId),
                })
              : g,
          ),
        })),
      restoreContribution: (goalId, contribution, index) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId
              ? recomputeAchieved({ ...g, contributions: insertAt(g.contributions, contribution, index) })
              : g,
          ),
        })),

      addObjective: (title, category) =>
        set((s) => ({
          objectives: [
            {
              id: uid(),
              title,
              category,
              status: 'pendiente',
              createdAt: new Date().toISOString(),
            },
            ...s.objectives,
          ],
        })),
      updateObjective: (id, patch) =>
        set((s) => ({
          objectives: s.objectives.map((o) => (o.id === id ? { ...o, ...patch } : o)),
        })),
      deleteObjective: (id) =>
        set((s) => ({ objectives: s.objectives.filter((o) => o.id !== id) })),
      restoreObjective: (objective, index) =>
        set((s) => ({ objectives: insertAt(s.objectives, objective, index) })),
      addSubtask: (objectiveId, title) =>
        set((s) => ({
          objectives: s.objectives.map((o) =>
            o.id === objectiveId
              ? { ...o, subtasks: [...(o.subtasks ?? []), { id: uid(), title, done: false }] }
              : o,
          ),
        })),
      toggleSubtask: (objectiveId, subtaskId) =>
        set((s) => ({
          objectives: s.objectives.map((o) =>
            o.id === objectiveId
              ? {
                  ...o,
                  subtasks: (o.subtasks ?? []).map((t) =>
                    t.id === subtaskId ? { ...t, done: !t.done } : t,
                  ),
                }
              : o,
          ),
        })),
      deleteSubtask: (objectiveId, subtaskId) =>
        set((s) => ({
          objectives: s.objectives.map((o) =>
            o.id === objectiveId
              ? { ...o, subtasks: (o.subtasks ?? []).filter((t) => t.id !== subtaskId) }
              : o,
          ),
        })),

      addHabit: (title, frequency, opts) =>
        set((s) => ({
          habits: [
            {
              id: uid(),
              title,
              frequency,
              description: opts?.description,
              weekdays: opts?.weekdays,
              history: [],
              createdAt: new Date().toISOString(),
            },
            ...s.habits,
          ],
        })),
      updateHabit: (id, patch) =>
        set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)) })),
      deleteHabit: (id) => set((s) => ({ habits: s.habits.filter((h) => h.id !== id) })),
      restoreHabit: (habit, index) => set((s) => ({ habits: insertAt(s.habits, habit, index) })),
      toggleHabitToday: (id) =>
        set((s) => {
          const key = todayKey()
          return {
            habits: s.habits.map((h) => {
              if (h.id !== id) return h
              const has = h.history.includes(key)
              return {
                ...h,
                history: has ? h.history.filter((d) => d !== key) : [...h.history, key],
              }
            }),
          }
        }),

      addProject: (p) =>
        set((s) => ({
          projects: [...s.projects, { ...p, id: uid(), createdAt: new Date().toISOString() }],
        })),
      updateProject: (id, patch) =>
        set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      deleteProject: (id) =>
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          timeEntries: s.timeEntries.filter((e) => e.projectId !== id),
          runningTimer: s.runningTimer?.projectId === id ? undefined : s.runningTimer,
        })),
      restoreProject: (project, entries, index) =>
        set((s) => ({
          projects: insertAt(s.projects, project, index),
          timeEntries: entries && entries.length ? [...entries, ...s.timeEntries] : s.timeEntries,
        })),
      addTimeEntry: (projectId, minutes, date, note) =>
        set((s) => ({
          timeEntries: [
            { id: uid(), projectId, minutes, date, note: note?.trim() || undefined, createdAt: new Date().toISOString() },
            ...s.timeEntries,
          ],
        })),
      updateTimeEntry: (id, patch) =>
        set((s) => ({
          timeEntries: s.timeEntries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),
      deleteTimeEntry: (id) =>
        set((s) => ({ timeEntries: s.timeEntries.filter((e) => e.id !== id) })),
      restoreTimeEntry: (entry, index) =>
        set((s) => ({ timeEntries: insertAt(s.timeEntries, entry, index) })),
      startTimer: (projectId, note) =>
        set((s) => {
          // si ya había un cronómetro corriendo, lo guardamos antes de arrancar el nuevo
          const entries = [...s.timeEntries]
          if (s.runningTimer) {
            const mins = Math.round((Date.now() - new Date(s.runningTimer.startedAt).getTime()) / 60000)
            if (mins >= 1) {
              entries.unshift({
                id: uid(),
                projectId: s.runningTimer.projectId,
                minutes: mins,
                date: todayKey(),
                note: s.runningTimer.note,
                createdAt: new Date().toISOString(),
              })
            }
          }
          return {
            timeEntries: entries,
            runningTimer: { projectId, startedAt: new Date().toISOString(), note: note?.trim() || undefined },
          }
        }),
      stopTimer: () =>
        set((s) => {
          if (!s.runningTimer) return {}
          const mins = Math.round((Date.now() - new Date(s.runningTimer.startedAt).getTime()) / 60000)
          if (mins < 1) return { runningTimer: undefined }
          return {
            timeEntries: [
              {
                id: uid(),
                projectId: s.runningTimer.projectId,
                minutes: mins,
                date: todayKey(),
                note: s.runningTimer.note,
                createdAt: new Date().toISOString(),
              },
              ...s.timeEntries,
            ],
            runningTimer: undefined,
          }
        }),
      cancelTimer: () => set(() => ({ runningTimer: undefined })),

      addSubscription: (sub) =>
        set((s) => ({
          subscriptions: [
            { ...sub, id: uid(), paidMonths: [], createdAt: new Date().toISOString() },
            ...s.subscriptions,
          ],
        })),
      updateSubscription: (id, patch) =>
        set((s) => ({
          subscriptions: s.subscriptions.map((sub) => (sub.id === id ? { ...sub, ...patch } : sub)),
        })),
      deleteSubscription: (id) =>
        set((s) => ({ subscriptions: s.subscriptions.filter((sub) => sub.id !== id) })),
      restoreSubscription: (subscription, index) =>
        set((s) => ({ subscriptions: insertAt(s.subscriptions, subscription, index) })),
      togglePaidMonth: (id, month) =>
        set((s) => {
          const key = month ?? monthKey()
          return {
            subscriptions: s.subscriptions.map((sub) => {
              if (sub.id !== id) return sub
              const paidAmount = sub.paidAmounts?.[key]
              const isPaid = paidAmount != null ? paidAmount >= sub.amount : sub.paidMonths.includes(key)
              return {
                ...sub,
                paidMonths: isPaid ? sub.paidMonths.filter((m) => m !== key) : [...sub.paidMonths.filter((m) => m !== key), key],
                paidAmounts: { ...sub.paidAmounts, [key]: isPaid ? 0 : sub.amount },
              }
            }),
          }
        }),
      addPayment: (id, amount, month) =>
        set((s) => {
          const key = month ?? monthKey()
          return {
            subscriptions: s.subscriptions.map((sub) => {
              if (sub.id !== id) return sub
              const current = sub.paidAmounts?.[key] ?? (sub.paidMonths.includes(key) ? sub.amount : 0)
              const next = Math.max(0, Math.min(current + amount, sub.amount))
              const fullyPaid = sub.amount > 0 && next >= sub.amount
              return {
                ...sub,
                paidAmounts: { ...sub.paidAmounts, [key]: next },
                paidMonths: fullyPaid
                  ? [...sub.paidMonths.filter((m) => m !== key), key]
                  : sub.paidMonths.filter((m) => m !== key),
              }
            }),
          }
        }),

      setTheme: (theme) => set((s) => ({ settings: { ...s.settings, theme } })),
      setCurrencySymbol: (symbol) =>
        set((s) => ({ settings: { ...s.settings, currencySymbol: symbol } })),

      replaceAll: (data) =>
        set((s) => ({
          goals: data.goals ?? s.goals,
          objectives: data.objectives ?? s.objectives,
          habits: data.habits ?? s.habits,
          projects: data.projects ?? s.projects,
          timeEntries: data.timeEntries ?? s.timeEntries,
          subscriptions: data.subscriptions ?? s.subscriptions,
          settings: { ...s.settings, ...(data.settings ?? {}) },
        })),
    }),
    {
      name: 'state',
      storage: createJSONStorage(() => forageStorage),
      partialize: (s) => ({
        goals: s.goals,
        objectives: s.objectives,
        habits: s.habits,
        projects: s.projects,
        timeEntries: s.timeEntries,
        subscriptions: s.subscriptions,
        runningTimer: s.runningTimer,
        settings: s.settings,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state._hydrated = true
      },
    },
  ),
)

// selectores utilitarios
export function goalTotal(goal: SavingGoal): number {
  return goal.contributions.reduce((s, c) => s + c.amount, 0)
}

export const OBJECTIVE_STATUS_LABEL: Record<ObjectiveStatus, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  logrado: 'Logrado',
}

/** Progreso 0–100 de un objetivo según sus subtareas; 0 si no tiene. */
export function objectiveProgress(o: Objective): { done: number; total: number; pct: number } {
  const total = o.subtasks?.length ?? 0
  const done = o.subtasks?.filter((t) => t.done).length ?? 0
  return { done, total, pct: total > 0 ? (done / total) * 100 : 0 }
}

export const PROJECT_COLORS = [
  '#6366f1', // indigo
  '#0ea5e9', // sky
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#14b8a6', // teal
  '#f97316', // orange
  '#64748b', // slate
] as const
