import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import localforage from 'localforage'
import type {
  AppData,
  Habit,
  HabitFrequency,
  Objective,
  ObjectiveCategory,
  ObjectiveStatus,
  SavingGoal,
  Settings,
} from '../types'
import { todayKey, uid } from '../lib/format'

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
  // saving goals
  addGoal: (g: Omit<SavingGoal, 'id' | 'createdAt' | 'contributions' | 'achievedAt'>) => void
  updateGoal: (id: string, patch: Partial<SavingGoal>) => void
  deleteGoal: (id: string) => void
  addContribution: (goalId: string, amount: number, date: string, note?: string) => void
  updateContribution: (goalId: string, contribId: string, amount: number, date: string, note?: string) => void
  deleteContribution: (goalId: string, contribId: string) => void
  // objectives
  addObjective: (title: string, category: ObjectiveCategory) => void
  updateObjective: (id: string, patch: Partial<Objective>) => void
  deleteObjective: (id: string) => void
  // habits
  addHabit: (title: string, frequency: HabitFrequency) => void
  updateHabit: (id: string, patch: Partial<Habit>) => void
  deleteHabit: (id: string) => void
  toggleHabitToday: (id: string) => void
  // settings
  setTheme: (theme: 'light' | 'dark') => void
  setCurrencySymbol: (symbol: string) => void
  // backup
  replaceAll: (data: Partial<AppData>) => void
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

      addHabit: (title, frequency) =>
        set((s) => ({
          habits: [
            { id: uid(), title, frequency, history: [], createdAt: new Date().toISOString() },
            ...s.habits,
          ],
        })),
      updateHabit: (id, patch) =>
        set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)) })),
      deleteHabit: (id) => set((s) => ({ habits: s.habits.filter((h) => h.id !== id) })),
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

      setTheme: (theme) => set((s) => ({ settings: { ...s.settings, theme } })),
      setCurrencySymbol: (symbol) =>
        set((s) => ({ settings: { ...s.settings, currencySymbol: symbol } })),

      replaceAll: (data) =>
        set((s) => ({
          goals: data.goals ?? s.goals,
          objectives: data.objectives ?? s.objectives,
          habits: data.habits ?? s.habits,
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
