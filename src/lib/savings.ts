import type { SavingGoal } from '../types'

const MS_PER_DAY = 86_400_000

/** Total aportado dentro del mes calendario actual. */
export function savedThisMonth(goal: SavingGoal): number {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  return goal.contributions.reduce((sum, c) => {
    const d = new Date(c.date)
    return d.getFullYear() === y && d.getMonth() === m ? sum + c.amount : sum
  }, 0)
}

export interface Projection {
  monthlyRate: number
  etaDate: Date | null
}

/**
 * Estima el ritmo mensual de ahorro y la fecha aproximada para alcanzar la meta,
 * usando el historial de aportes. Devuelve null si no hay datos suficientes.
 */
export function savingProjection(goal: SavingGoal): Projection | null {
  const contribs = goal.contributions.filter((c) => c.amount > 0)
  if (contribs.length === 0) return null

  const total = contribs.reduce((s, c) => s + c.amount, 0)
  const dates = contribs.map((c) => new Date(c.date).getTime()).filter((t) => !isNaN(t))
  if (dates.length === 0) return null

  const first = Math.min(...dates)
  const spanDays = Math.max((Date.now() - first) / MS_PER_DAY, 1)
  // Ritmo basado en el período transcurrido; mínimo medio mes para no sobreestimar.
  const months = Math.max(spanDays / 30, 0.5)
  const monthlyRate = total / months

  const remaining = Math.max(0, goal.targetAmount - total)
  if (remaining <= 0 || monthlyRate <= 0) return { monthlyRate, etaDate: null }

  const monthsLeft = remaining / monthlyRate
  const eta = new Date()
  eta.setDate(eta.getDate() + Math.ceil(monthsLeft * 30))
  return { monthlyRate, etaDate: eta }
}
