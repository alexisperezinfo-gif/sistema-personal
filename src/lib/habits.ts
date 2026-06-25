import type { Habit } from '../types'
import { todayKey } from './format'

function dateKey(d: Date): string {
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

/** Racha de días consecutivos hasta hoy (o ayer si aún no se marcó hoy). */
export function currentStreak(habit: Habit): number {
  const set = new Set(habit.history)
  if (set.size === 0) return 0
  const today = todayKey()
  const d = new Date(today + 'T12:00:00')
  // si hoy no está marcado, empezamos a contar desde ayer
  if (!set.has(today)) d.setDate(d.getDate() - 1)
  let streak = 0
  while (set.has(dateKey(d))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export function doneToday(habit: Habit): boolean {
  return habit.history.includes(todayKey())
}
