import { useState } from 'react'
import { Plus, Repeat, Trash2, Check, Flame, Pencil, Trophy } from 'lucide-react'
import { useStore } from '../store/useStore'
import {
  currentStreak,
  bestStreak,
  completionRate,
  doneToday,
  lastDays,
  scheduledToday,
  WEEKDAY_LABELS,
} from '../lib/habits'
import type { Habit, HabitFrequency } from '../types'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import { useToast } from '../components/Toast'

// orden de lunes a domingo para el selector, con su índice getDay()
const WEEKDAY_PICKER = [1, 2, 3, 4, 5, 6, 0]

function HabitForm({ open, initial, onClose }: { open: boolean; initial: Habit | null; onClose: () => void }) {
  const addHabit = useStore((s) => s.addHabit)
  const updateHabit = useStore((s) => s.updateHabit)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState<HabitFrequency>('diaria')
  const [weekdays, setWeekdays] = useState<number[]>([])
  const [seed, setSeed] = useState<string | null>(null)

  if (open && seed !== (initial?.id ?? 'new')) {
    setSeed(initial?.id ?? 'new')
    setTitle(initial?.title ?? '')
    setDescription(initial?.description ?? '')
    setFrequency(initial?.frequency ?? 'diaria')
    setWeekdays(initial?.weekdays ?? [])
  }
  if (!open && seed !== null) setSeed(null)

  const toggleDay = (d: number) =>
    setWeekdays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))

  const submit = () => {
    if (!title.trim()) return
    // weekdays solo aplica a hábitos diarios; vacío = todos los días
    const wd = frequency === 'diaria' && weekdays.length > 0 && weekdays.length < 7 ? [...weekdays].sort() : undefined
    if (initial) {
      updateHabit(initial.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        frequency,
        weekdays: wd,
      })
    } else {
      addHabit(title.trim(), frequency, { description: description.trim() || undefined, weekdays: wd })
    }
    onClose()
  }

  return (
    <Modal open={open} title={initial ? 'Editar hábito' : 'Nuevo hábito'} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label">Hábito / rutina</label>
          <input className="input" placeholder="Ej: Hacer ejercicio" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="label">Detalle (opcional)</label>
          <input className="input" placeholder="Ej: 30 minutos de cardio" value={description} onChange={(e) => setDescription(e.target.value)} />
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
        {frequency === 'diaria' && (
          <div>
            <label className="label">Días (opcional)</label>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAY_PICKER.map((d) => {
                const active = weekdays.includes(d)
                return (
                  <button
                    key={d}
                    onClick={() => toggleDay(d)}
                    className={`h-9 w-9 rounded-lg text-sm font-semibold transition ${
                      active
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {WEEKDAY_LABELS[d]}
                  </button>
                )
              })}
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              {weekdays.length === 0 || weekdays.length === 7 ? 'Todos los días' : 'Solo los días marcados'}
            </p>
          </div>
        )}
        <button className="btn-primary w-full" onClick={submit} disabled={!title.trim()}>
          {initial ? 'Guardar cambios' : 'Crear hábito'}
        </button>
      </div>
    </Modal>
  )
}

export default function Habits() {
  const habits = useStore((s) => s.habits)
  const toggle = useStore((s) => s.toggleHabitToday)
  const deleteHabit = useStore((s) => s.deleteHabit)
  const restoreHabit = useStore((s) => s.restoreHabit)
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Habit | null>(null)

  const handleDelete = (id: string) => {
    const index = habits.findIndex((h) => h.id === id)
    const habit = habits[index]
    if (!habit) return
    deleteHabit(id)
    toast.notifyUndo(`Se eliminó "${habit.title}"`, () => restoreHabit(habit, index))
  }

  const doneCount = habits.filter((h) => doneToday(h) || !scheduledToday(h)).length

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

      {habits.length > 0 && (
        <div className="card mb-4 flex items-center justify-between p-4">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Progreso de hoy</span>
          <span className="text-sm font-bold">
            {doneCount}/{habits.length} {doneCount === habits.length && '🎉'}
          </span>
        </div>
      )}

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
            const scheduled = scheduledToday(h)
            const streak = currentStreak(h)
            const best = bestStreak(h)
            const rate = completionRate(h, 30)
            const custom = h.frequency === 'diaria' && h.weekdays && h.weekdays.length > 0 && h.weekdays.length < 7
            return (
              <li key={h.id} className={`card flex items-center gap-3 p-4 ${!scheduled ? 'opacity-70' : ''}`}>
                <button
                  onClick={() => toggle(h.id)}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition active:scale-90 ${
                    done
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-slate-300 text-transparent hover:border-brand-400 dark:border-slate-600'
                  }`}
                  title={done ? 'Cumplido hoy' : scheduled ? 'Marcar como cumplido' : 'Hoy no toca, pero podés marcarlo'}
                >
                  <Check size={22} strokeWidth={3} />
                </button>
                <div className="min-w-0 flex-1">
                  <h3 className={`font-semibold ${done ? 'text-slate-400' : ''}`}>{h.title}</h3>
                  {h.description && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{h.description}</p>}
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400">
                    <span className="capitalize">{custom ? 'Días fijos' : h.frequency}</span>
                    {streak > 0 && (
                      <span className="inline-flex items-center gap-0.5 font-semibold text-orange-500">
                        <Flame size={12} /> {streak} {h.frequency === 'semanal' ? `seman${streak !== 1 ? 'as' : 'a'}` : `día${streak !== 1 ? 's' : ''}`}
                      </span>
                    )}
                    {best > 1 && (
                      <span className="inline-flex items-center gap-0.5 text-slate-400" title="Mejor racha">
                        <Trophy size={11} /> {best}
                      </span>
                    )}
                    {rate > 0 && <span title="Cumplimiento últimos 30 días">{rate}%</span>}
                  </div>
                  <div className="mt-2 flex gap-1" aria-hidden>
                    {lastDays(h, 7).map((d) => (
                      <span
                        key={d.key}
                        title={d.key}
                        className={`flex h-5 w-5 items-center justify-center rounded-md text-[9px] font-semibold ${
                          d.done
                            ? 'bg-emerald-500 text-white'
                            : d.scheduled
                              ? 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                              : 'bg-transparent text-slate-300 dark:text-slate-600'
                        }`}
                      >
                        {d.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button onClick={() => setEditing(h)} aria-label={`Editar ${h.title}`} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(h.id)} aria-label={`Eliminar ${h.title}`} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950">
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <HabitForm open={open || !!editing} initial={editing} onClose={() => { setOpen(false); setEditing(null) }} />
    </div>
  )
}
