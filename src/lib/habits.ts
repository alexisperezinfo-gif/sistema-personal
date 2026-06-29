import type { Habit } from '../types'
import { todayKey } from './format'

function dateKey(d: Date): string {
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

function parseKey(key: string): Date {
  return new Date(key + 'T12:00:00')
}

/** ¿El hábito está programado para ese día? (hábitos diarios pueden limitarse a ciertos días). */
export function isScheduledOn(habit: Habit, d: Date): boolean {
  if (habit.frequency !== 'diaria') return true
  if (!habit.weekdays || habit.weekdays.length === 0) return true
  return habit.weekdays.includes(d.getDay())
}

/** Racha de períodos consecutivos cumplidos: días programados para hábitos diarios, semanas para semanales. */
export function currentStreak(habit: Habit): number {
  const set = new Set(habit.history)
  if (set.size === 0) return 0
  if (habit.frequency === 'semanal') return weeklyStreak(set)

  const d = parseKey(todayKey())
  // si hoy está programado y aún no se marcó, empezamos a contar desde el día anterior
  if (isScheduledOn(habit, d) && !set.has(dateKey(d))) d.setDate(d.getDate() - 1)
  let streak = 0
  let guard = 0
  while (guard++ < 3650) {
    if (isScheduledOn(habit, d)) {
      if (set.has(dateKey(d))) streak++
      else break
    }
    d.setDate(d.getDate() - 1)
  }
  return streak
}

/** Mejor racha histórica de días programados consecutivos cumplidos (hábitos diarios). */
export function bestStreak(habit: Habit): number {
  if (habit.frequency === 'semanal') return currentStreak(habit)
  const set = new Set(habit.history)
  if (set.size === 0) return 0
  // recorre desde el primer día con historial hasta hoy
  const keys = [...set].sort()
  const start = parseKey(keys[0])
  const end = parseKey(todayKey())
  let best = 0
  let run = 0
  const d = new Date(start)
  let guard = 0
  while (d <= end && guard++ < 36500) {
    if (isScheduledOn(habit, d)) {
      if (set.has(dateKey(d))) {
        run++
        if (run > best) best = run
      } else {
        run = 0
      }
    }
    d.setDate(d.getDate() + 1)
  }
  return best
}

/** Cuenta semanas consecutivas (hacia atrás) con al menos un día marcado. */
function weeklyStreak(set: Set<string>): number {
  const hasInWeek = (offsetWeeks: number): boolean => {
    const ref = parseKey(todayKey())
    ref.setDate(ref.getDate() - offsetWeeks * 7)
    // lunes de esa semana
    const monday = new Date(ref)
    const dow = (monday.getDay() + 6) % 7 // 0 = lunes
    monday.setDate(monday.getDate() - dow)
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday)
      day.setDate(monday.getDate() + i)
      if (set.has(dateKey(day))) return true
    }
    return false
  }
  let streak = 0
  let week = hasInWeek(0) ? 0 : 1 // tolera que aún no se marcó esta semana
  while (hasInWeek(week)) {
    streak++
    week++
  }
  return streak
}

/** ¿Hoy está programado el hábito? */
export function scheduledToday(habit: Habit): boolean {
  return isScheduledOn(habit, parseKey(todayKey()))
}

export function doneToday(habit: Habit): boolean {
  return habit.history.includes(todayKey())
}

/** Porcentaje de cumplimiento sobre los días programados de los últimos `n` días. */
export function completionRate(habit: Habit, n = 30): number {
  const set = new Set(habit.history)
  const base = parseKey(todayKey())
  let scheduled = 0
  let done = 0
  for (let i = 0; i < n; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() - i)
    if (isScheduledOn(habit, d)) {
      scheduled++
      if (set.has(dateKey(d))) done++
    }
  }
  return scheduled === 0 ? 0 : Math.round((done / scheduled) * 100)
}

/** Devuelve los últimos `n` días (más antiguo→hoy) con su estado de cumplimiento. */
export function lastDays(
  habit: Habit,
  n = 7,
): { key: string; done: boolean; scheduled: boolean; label: string }[] {
  const set = new Set(habit.history)
  const out: { key: string; done: boolean; scheduled: boolean; label: string }[] = []
  const base = parseKey(todayKey())
  const fmt = new Intl.DateTimeFormat('es-AR', { weekday: 'narrow' })
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base)
    d.setDate(base.getDate() - i)
    const key = dateKey(d)
    out.push({ key, done: set.has(key), scheduled: isScheduledOn(habit, d), label: fmt.format(d) })
  }
  return out
}

/** Etiquetas cortas de los días de la semana, índice = getDay() (0=domingo). */
export const WEEKDAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
export const WEEKDAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
