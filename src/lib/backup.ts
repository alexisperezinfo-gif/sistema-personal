import type { AppData } from '../types'

export function exportData(data: AppData) {
  const payload = {
    app: 'sistema-personal',
    version: 1,
    exportedAt: new Date().toISOString(),
    ...data,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mi-sistema-personal-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importData(file: File): Promise<Partial<AppData>> {
  const text = await file.text()
  const parsed = JSON.parse(text)
  const result: Partial<AppData> = {}
  if (Array.isArray(parsed.goals)) result.goals = parsed.goals
  if (Array.isArray(parsed.objectives)) result.objectives = parsed.objectives
  if (Array.isArray(parsed.habits)) result.habits = parsed.habits
  if (parsed.settings && typeof parsed.settings === 'object') result.settings = parsed.settings
  if (!result.goals && !result.objectives && !result.habits) {
    throw new Error('El archivo no parece un respaldo válido de Mi Sistema Personal.')
  }
  return result
}
