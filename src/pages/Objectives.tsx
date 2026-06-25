import { useState } from 'react'
import { Plus, Target, Trash2, Briefcase, User } from 'lucide-react'
import { useStore, OBJECTIVE_STATUS_LABEL } from '../store/useStore'
import { formatDate } from '../lib/format'
import type { ObjectiveCategory, ObjectiveStatus } from '../types'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'

const STATUSES: ObjectiveStatus[] = ['pendiente', 'en_progreso', 'logrado']

const statusStyle: Record<ObjectiveStatus, string> = {
  pendiente: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  en_progreso: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  logrado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
}

function ObjectiveForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addObjective = useStore((s) => s.addObjective)
  const updateObjective = useStore((s) => s.updateObjective)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<ObjectiveCategory>('personal')
  const [notes, setNotes] = useState('')
  const [dueDate, setDueDate] = useState('')

  const submit = () => {
    if (!title.trim()) return
    addObjective(title.trim(), category)
    // aplica notas/fecha al recién creado: lo tomamos del store
    const created = useStore.getState().objectives[0]
    if (created && (notes.trim() || dueDate)) {
      updateObjective(created.id, { notes: notes.trim() || undefined, dueDate: dueDate || undefined })
    }
    setTitle(''); setCategory('personal'); setNotes(''); setDueDate('')
    onClose()
  }

  return (
    <Modal open={open} title="Nuevo objetivo" onClose={onClose}>
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
          <label className="label">Notas (opcional)</label>
          <textarea className="input min-h-[64px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div>
          <label className="label">Fecha límite (opcional)</label>
          <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <button className="btn-primary w-full" onClick={submit} disabled={!title.trim()}>Crear objetivo</button>
      </div>
    </Modal>
  )
}

export default function Objectives() {
  const objectives = useStore((s) => s.objectives)
  const updateObjective = useStore((s) => s.updateObjective)
  const deleteObjective = useStore((s) => s.deleteObjective)
  const [open, setOpen] = useState(false)
  const [filterCat, setFilterCat] = useState<'todas' | ObjectiveCategory>('todas')
  const [filterStatus, setFilterStatus] = useState<'todos' | ObjectiveStatus>('todos')
  const [toDelete, setToDelete] = useState<string | null>(null)

  const filtered = objectives.filter(
    (o) =>
      (filterCat === 'todas' || o.category === filterCat) &&
      (filterStatus === 'todos' || o.status === filterStatus),
  )

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
          {filtered.map((o) => (
            <li key={o.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${o.category === 'personal' ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300' : 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'}`}>
                      {o.category === 'personal' ? <User size={11} /> : <Briefcase size={11} />}
                      {o.category}
                    </span>
                    {o.dueDate && <span className="text-[11px] text-slate-400">📅 {formatDate(o.dueDate)}</span>}
                  </div>
                  <h3 className={`font-semibold ${o.status === 'logrado' ? 'text-slate-400 line-through' : ''}`}>{o.title}</h3>
                  {o.notes && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{o.notes}</p>}
                </div>
                <button onClick={() => setToDelete(o.id)} className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950">
                  <Trash2 size={16} />
                </button>
              </div>
              <button
                onClick={() => updateObjective(o.id, { status: cycleStatus(o.status) })}
                className={`mt-3 rounded-full px-3 py-1 text-xs font-semibold transition ${statusStyle[o.status]}`}
                title="Tocar para cambiar estado"
              >
                {OBJECTIVE_STATUS_LABEL[o.status]} ↻
              </button>
            </li>
          ))}
        </ul>
      )}

      <ObjectiveForm open={open} onClose={() => setOpen(false)} />
      <ConfirmDialog
        open={!!toDelete}
        message="¿Eliminar este objetivo?"
        onCancel={() => setToDelete(null)}
        onConfirm={() => { if (toDelete) deleteObjective(toDelete); setToDelete(null) }}
      />
    </div>
  )
}
