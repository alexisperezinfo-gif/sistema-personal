export function formatCurrency(amount: number, symbol = '$'): string {
  const formatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(isFinite(amount) ? amount : 0)
  return `${symbol} ${formatted}`
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

/** YYYY-MM-DD para la fecha local de hoy */
export function todayKey(): string {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value))
}
