import type { Subscription } from '../types'
import { monthKey } from './format'

const MS_PER_DAY = 86_400_000

/** Devuelve el día de cobro válido para un mes/año dado (ajusta a fin de mes). */
function dueDayForMonth(dueDay: number, year: number, month: number): number {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return Math.min(Math.max(dueDay, 1), daysInMonth)
}

/** Próxima fecha de cobro a partir de hoy (incluye hoy). */
export function nextDueDate(sub: Subscription, from: Date = new Date()): Date {
  const base = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  let year = base.getFullYear()
  let month = base.getMonth()
  let day = dueDayForMonth(sub.dueDay, year, month)
  let due = new Date(year, month, day)
  if (due.getTime() < base.getTime()) {
    month += 1
    if (month > 11) {
      month = 0
      year += 1
    }
    day = dueDayForMonth(sub.dueDay, year, month)
    due = new Date(year, month, day)
  }
  return due
}

/** Días que faltan para el próximo cobro (0 = hoy). */
export function daysUntilDue(sub: Subscription, from: Date = new Date()): number {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const due = nextDueDate(sub, from)
  return Math.round((due.getTime() - today.getTime()) / MS_PER_DAY)
}

/**
 * Progreso 0–100 del ciclo mensual: cuánto avanzó el período desde el cobro
 * anterior hasta el próximo. Sirve para la barra que se va "completando".
 */
export function cycleProgress(sub: Subscription, from: Date = new Date()): number {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const next = nextDueDate(sub, from)
  // cobro anterior = retroceder un mes desde el próximo
  const prevMonth = next.getMonth() - 1
  const prevYear = prevMonth < 0 ? next.getFullYear() - 1 : next.getFullYear()
  const pm = (prevMonth + 12) % 12
  const prev = new Date(prevYear, pm, dueDayForMonth(sub.dueDay, prevYear, pm))
  const span = next.getTime() - prev.getTime()
  if (span <= 0) return 0
  const elapsed = today.getTime() - prev.getTime()
  return Math.max(0, Math.min(100, (elapsed / span) * 100))
}

export function isPaidThisMonth(sub: Subscription, from: Date = new Date()): boolean {
  return sub.paidMonths.includes(monthKey(from))
}

/** Total mensual de las suscripciones activas. */
export function monthlyTotal(subs: Subscription[]): number {
  return subs.filter((s) => !s.archived).reduce((sum, s) => sum + s.amount, 0)
}

/** Estado del próximo cobro, para colorear la UI. */
export function dueStatus(sub: Subscription, from: Date = new Date()): 'paid' | 'overdue' | 'soon' | 'upcoming' {
  if (isPaidThisMonth(sub, from)) return 'paid'
  const days = daysUntilDue(sub, from)
  if (days <= 0) return 'overdue'
  if (days <= 5) return 'soon'
  return 'upcoming'
}
