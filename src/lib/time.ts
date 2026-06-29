import type { TimeEntry } from '../types'
import { todayKey } from './format'

/** Formatea minutos a "2h 30m" / "45m" / "0m". */
export function formatMinutes(mins: number): string {
  const m = Math.max(0, Math.round(mins))
  const h = Math.floor(m / 60)
  const rem = m % 60
  if (h === 0) return `${rem}m`
  if (rem === 0) return `${h}h`
  return `${h}h ${rem}m`
}

/** Formatea minutos como horas decimales: "2,5 h". */
export function formatHours(mins: number): string {
  const h = mins / 60
  return `${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(h)} h`
}

function dateKey(d: Date): string {
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

/** Lunes de la semana que contiene `ref` (por defecto hoy). */
export function mondayOf(ref = new Date()): Date {
  const d = new Date(ref)
  const dow = (d.getDay() + 6) % 7 // 0 = lunes
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - dow)
  return d
}

/** Las 7 claves YYYY-MM-DD de la semana (lunes→domingo) que contiene `ref`. */
export function weekKeys(ref = new Date()): string[] {
  const monday = mondayOf(ref)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return dateKey(d)
  })
}

export function isToday(key: string): boolean {
  return key === todayKey()
}

/** Suma de minutos por proyecto a partir de un conjunto de entradas. */
export function minutesByProject(entries: TimeEntry[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const e of entries) {
    map.set(e.projectId, (map.get(e.projectId) ?? 0) + e.minutes)
  }
  return map
}

export function totalMinutes(entries: TimeEntry[]): number {
  return entries.reduce((s, e) => s + e.minutes, 0)
}
