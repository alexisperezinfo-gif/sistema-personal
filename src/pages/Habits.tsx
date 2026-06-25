import { useState } from 'react'
import { Plus, Repeat, Trash2, Check, Flame } from 'lucide-react'
import { useStore } from '../store/useStore'
import { currentStreak, doneToday } from '../lib/habits'
import type { HabitFrequency } from '../types'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'

function HabitForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addHabit = useStore((s) => s.addHabit)
  const [title, setTitle] = useState('')
  const [frequency, setFrequency] = useState<HabitFrequency>('diaria')

  const submit = () => {
    if (!title.trim()) return
    addHabit(title.trim(), frequency)
    setTitle(''); setFrequency('diaria')
    onClose()
  }

  return (
    <Modal open={open} title="Nuevo hábito" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label">Hábito / rutina</label>
          <input className="input" placeholder="Ej: Hacer ejercicio" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="label">Frecuencia</label>
          <div className="grid grid-cols-2 gap-2">
            {(['diaria', 'semanal'] as HabitFrequency[]).map((f) => (
              <button
                key={f}
                onClick={() => setFrequency(f)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-medium capitalize transition ${
                  frequency === f
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200'
                    : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <button className="btn-primary w-full" onClick={submit} disabled={!title.trim()}>Crear hábito</button>
      </div>
    </Modal>
  )
}

export default function Habits() {
  const habits = useStore((s) => s.habits)
  const toggle = useStore((s) => s.toggleHabitToday)
  const deleteHabit = useStore((s) => s.deleteHabit)
  const [open, setOpen] = useState(false)
  const [toDelete, setToDelete] = useState<string | null>(null)

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hábitos y rutinas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Marcá lo que cumpliste y mantené la racha</p>
        </div>
        <button className="btn-primary" onClick={() => setOpen(true)}>
          <Plus size={18} /> <span className="hidden sm:inline">Nuevo</span>
        </button>
      </div>

      {habits.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="Sin hábitos todavía"
          description="Creá rutinas diarias o semanales y construí constancia día a día."
          action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={18} /> Crear hábito</button>}
        />
      ) : (
        <ul className="space-y-2.5">
          {habits.map((h) => {
            const done = doneToday(h)
            const streak = currentStreak(h)
            return (
              <li key={h.id} className="card flex items-center gap-3 p-4">
                <button
                  onClick={() => toggle(h.id)}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition active:scale-90 ${
                    done
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-slate-300 text-transparent hover:border-brand-400 dark:border-slate-600'
                  }`}
                  title={done ? 'Cumplido hoy' : 'Marcar como cumplido'}
                >
                  <Check size={22} strokeWidth={3} />
                </button>
                <div className="min-w-0 flex-1">
                  <h3 className={`font-semibold ${done ? 'text-slate-400' : ''}`}>{h.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="capitalize">{h.frequency}</span>
                    {streak > 0 && (
                      <span className="inline-flex items-center gap-0.5 font-semibold text-orange-500">
                        <Flame size={12} /> {streak} día{streak !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => setToDelete(h.id)} className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950">
                  <Trash2 size={16} />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <HabitForm open={open} onClose={() => setOpen(false)} />
      <ConfirmDialog
        open={!!toDelete}
        message="¿Eliminar este hábito y su historial?"
        onCancel={() => setToDelete(null)}
        onConfirm={() => { if (toDelete) deleteHabit(toDelete); setToDelete(null) }}
      />
    </div>
  )
}
