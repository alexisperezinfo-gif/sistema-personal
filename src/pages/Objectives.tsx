import { useState } from 'react'
import { Plus, Target, Trash2, Briefcase, User, Pencil, X, AlertTriangle } from 'lucide-react'
import { useStore, OBJECTIVE_STATUS_LABEL, objectiveProgress } from '../store/useStore'
import { formatDate, todayKey } from '../lib/format'
import type { Objective, ObjectiveCategory, ObjectivePriority, ObjectiveStatus } from '../types'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import ProgressBar from '../components/ProgressBar'
import { useToast } from '../components/Toast'

const STATUSES: ObjectiveStatus[] = ['pendiente', 'en_progreso', 'logrado']
const PRIORITIES: ObjectivePriority[] = ['baja', 'media', 'alta']

const statusStyle: Record<ObjectiveStatus, string> = {
  pendiente: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  en_progreso: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  logrado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
}

const priorityStyle: Record<ObjectivePriority, string> = {
  baja: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  media: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
  alta: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300',
}

const PRIORITY_RANK: Record<ObjectivePriority, number> = { alta: 0, media: 1, baja: 2 }

function ObjectiveForm({ open, initial, onClose }: { open: boolean; initial: Objective | null; onClose: () => void }) {
  const addObjective = useStore((s) => s.addObjective)
  const updateObjective = useStore((s) => s.updateObjective)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<ObjectiveCategory>('personal')
  const [priority, setPriority] = useState<ObjectivePriority>('media')
  const [notes, setNotes] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [seed, setSeed] = useState<string | null>(null)

  // sincroniza el formulario al abrir (creación o edición)
  if (open && seed !== (initial?.id ?? 'new')) {
    setSeed(initial?.id ?? 'new')
    setTitle(initial?.title ?? '')
    setCategory(initial?.category ?? 'personal')
    setPriority(initial?.priority ?? 'media')
    setNotes(initial?.notes ?? '')
    setDueDate(initial?.dueDate ?? '')
  }
  if (!open && seed !== null) setSeed(null)

  const submit = () => {
    if (!title.trim()) return
    if (initial) {
      updateObjective(initial.id, {
        title: title.trim(),
        category,
        priority,
        notes: notes.trim() || undefined,
        dueDate: dueDate || undefined,
      })
    } else {
      addObjective(title.trim(), category)
      const created = useStore.getState().objectives[0]
      if (created) {
        updateObjective(created.id, {
          priority,
          notes: notes.trim() || undefined,
          dueDate: dueDate || undefined,
        })
      }
    }
    onClose()
  }

  return (
    <Modal open={open} title={initial ? 'Editar objetivo' : 'Nuevo objetivo'} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label">Objetivo</label>
          <input className="input" placeholder="Ej: Aprender React" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="label">Categoría</label>
          <div className="grid grid-cols-2 gap-2">
            {(['personal', 'profesional'] as ObjectiveCategory[]).map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                  category === c
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200'
                    : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                {c === 'personal' ? <User size={16} /> : <Briefcase size={16} />}
                {c === 'personal' ? 'Personal' : 'Profesional'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Prioridad</label>
          <div className="grid grid-cols-3 gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-medium capitalize transition ${
                  priority === p
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200'
                    : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Notas (opcional)</label>
          <textarea className="input min-h-[64px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div>
          <label className="label">Fecha límite (opcional)</label>
          <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <button className="btn-primary w-full" onClick={submit} disabled={!title.trim()}>{initial ? 'Guardar cambios' : 'Crear objetivo'}</button>
      </div>
    </Modal>
  )
}

function Subtasks({ objective }: { objective: Objective }) {
  const addSubtask = useStore((s) => s.addSubtask)
  const toggleSubtask = useStore((s) => s.toggleSubtask)
  const deleteSubtask = useStore((s) => s.deleteSubtask)
  const [text, setText] = useState('')
  const { done, total, pct } = objectiveProgress(objective)

  const add = () => {
    if (!text.trim()) return
    addSubtask(objective.id, text.trim())
    setText('')
  }

  return (
    <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
      {total > 0 && (
        <div className="mb-2">
          <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Subtareas</span>
            <span className="font-semibold">{done}/{total}</span>
          </div>
          <ProgressBar percent={pct} achieved={pct === 100} />
        </div>
      )}
      <ul className="space-y-1">
        {(objective.subtasks ?? []).map((t) => (
          <li key={t.id} className="group flex items-center gap-2">
            <button
              onClick={() => toggleSubtask(objective.id, t.id)}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
                t.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 text-transparent dark:border-slate-600'
              }`}
            >
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="4"><path d="M20 6 9 17l-5-5" /></svg>
            </button>
            <span className={`flex-1 text-sm ${t.done ? 'text-slate-400 line-through' : ''}`}>{t.title}</span>
            <button
              onClick={() => deleteSubtask(objective.id, t.id)}
              className="shrink-0 rounded p-1 text-slate-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
              aria-label="Eliminar subtarea"
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex gap-2">
        <input
          className="input !py-1.5 text-sm"
          placeholder="Agregar subtarea…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button onClick={add} disabled={!text.trim()} className="btn-ghost shrink-0 !px-3 !py-1.5">
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}

export default function Objectives() {
  const objectives = useStore((s) => s.objectives)
  const updateObjective = useStore((s) => s.updateObjective)
  const deleteObjective = useStore((s) => s.deleteObjective)
  const restoreObjective = useStore((s) => s.restoreObjective)
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Objective | null>(null)
  const [filterCat, setFilterCat] = useState<'todas' | ObjectiveCategory>('todas')
  const [filterStatus, setFilterStatus] = useState<'todos' | ObjectiveStatus>('todos')

  const handleDelete = (id: string) => {
    const index = objectives.findIndex((o) => o.id === id)
    const objective = objectives[index]
    if (!objective) return
    deleteObjective(id)
    toast.notifyUndo(`Se eliminó "${objective.title}"`, () => restoreObjective(objective, index))
  }

  const today = todayKey()
  const isOverdue = (o: Objective) => !!o.dueDate && o.status !== 'logrado' && o.dueDate < today

  const filtered = objectives
    .filter(
      (o) =>
        (filterCat === 'todas' || o.category === filterCat) &&
        (filterStatus === 'todos' || o.status === filterStatus),
    )
    // logrados al final; luego por prioridad; luego por fecha límite más próxima
    .sort((a, b) => {
      if ((a.status === 'logrado') !== (b.status === 'logrado')) return a.status === 'logrado' ? 1 : -1
      const pr = PRIORITY_RANK[a.priority ?? 'media'] - PRIORITY_RANK[b.priority ?? 'media']
      if (pr !== 0) return pr
      if (a.dueDate && b.dueDate) return a.dueDate < b.dueDate ? -1 : 1
      if (a.dueDate) return -1
      if (b.dueDate) return 1
      return 0
    })

  const cycleStatus = (current: ObjectiveStatus): ObjectiveStatus => {
    const i = STATUSES.indexOf(current)
    return STATUSES[(i + 1) % STATUSES.length]
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Objetivos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Tus metas personales y profesionales</p>
        </div>
        <button className="btn-primary" onClick={() => setOpen(true)}>
          <Plus size={18} /> <span className="hidden sm:inline">Nuevo</span>
        </button>
      </div>

      {objectives.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {(['todas', 'personal', 'profesional'] as const).map((c) => (
            <button key={c} onClick={() => setFilterCat(c)} className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${filterCat === c ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
              {c}
            </button>
          ))}
          <span className="mx-1 self-center text-slate-300">|</span>
          {(['todos', ...STATUSES] as const).map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${filterStatus === s ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
              {s === 'todos' ? 'Todos' : OBJECTIVE_STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      )}

      {objectives.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Sin objetivos aún"
          description="Anotá lo que querés lograr en lo personal y lo profesional para no perderlo de vista."
          action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={18} /> Crear objetivo</button>}
        />
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((o) => {
            const overdue = isOverdue(o)
            return (
              <li key={o.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${o.category === 'personal' ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300' : 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'}`}>
                        {o.category === 'personal' ? <User size={11} /> : <Briefcase size={11} />}
                        {o.category}
                      </span>
                      {o.priority && (
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${priorityStyle[o.priority]}`}>
                          {o.priority}
                        </span>
                      )}
                      {o.dueDate && (
                        <span className={`inline-flex items-center gap-1 text-[11px] ${overdue ? 'font-semibold text-red-500' : 'text-slate-400'}`}>
                          {overdue && <AlertTriangle size={11} />}📅 {formatDate(o.dueDate)}
                        </span>
                      )}
                    </div>
                    <h3 className={`font-semibold ${o.status === 'logrado' ? 'text-slate-400 line-through' : ''}`}>{o.title}</h3>
                    {o.notes && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{o.notes}</p>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button onClick={() => setEditing(o)} aria-label={`Editar ${o.title}`} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(o.id)} aria-label={`Eliminar ${o.title}`} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => updateObjective(o.id, { status: cycleStatus(o.status) })}
                  className={`mt-3 rounded-full px-3 py-1 text-xs font-semibold transition ${statusStyle[o.status]}`}
                  title="Tocar para cambiar estado"
                >
                  {OBJECTIVE_STATUS_LABEL[o.status]} ↻
                </button>
                <Subtasks objective={o} />
              </li>
            )
          })}
        </ul>
      )}

      <ObjectiveForm open={open || !!editing} initial={editing} onClose={() => { setOpen(false); setEditing(null) }} />
    </div>
  )
}
