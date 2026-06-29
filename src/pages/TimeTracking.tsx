import { useEffect, useMemo, useState } from 'react'
import {
  Plus, Clock, Play, Square, Trash2, Pencil, FolderPlus, Timer, X, Target,
} from 'lucide-react'
import { useStore, PROJECT_COLORS } from '../store/useStore'
import { todayKey } from '../lib/format'
import {
  formatMinutes, formatHours, weekKeys, minutesByProject, totalMinutes,
} from '../lib/time'
import type { Project, TimeEntry } from '../types'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import { useToast } from '../components/Toast'

function ProjectForm({ open, initial, onClose }: { open: boolean; initial: Project | null; onClose: () => void }) {
  const addProject = useStore((s) => s.addProject)
  const updateProject = useStore((s) => s.updateProject)
  const projects = useStore((s) => s.projects)
  const [name, setName] = useState('')
  const [color, setColor] = useState<string>(PROJECT_COLORS[0])
  const [target, setTarget] = useState('')
  const [seed, setSeed] = useState<string | null>(null)

  if (open && seed !== (initial?.id ?? 'new')) {
    setSeed(initial?.id ?? 'new')
    setName(initial?.name ?? '')
    // color por defecto: el primero que no esté en uso
    const used = new Set(projects.map((p) => p.color))
    setColor(initial?.color ?? PROJECT_COLORS.find((c) => !used.has(c)) ?? PROJECT_COLORS[0])
    setTarget(initial?.weeklyTargetHours ? String(initial.weeklyTargetHours) : '')
  }
  if (!open && seed !== null) setSeed(null)

  const submit = () => {
    if (!name.trim()) return
    const weeklyTargetHours = target ? Math.max(0, Number(target)) || undefined : undefined
    if (initial) {
      updateProject(initial.id, { name: name.trim(), color, weeklyTargetHours })
    } else {
      addProject({ name: name.trim(), color, weeklyTargetHours })
    }
    onClose()
  }

  return (
    <Modal open={open} title={initial ? 'Editar proyecto' : 'Nuevo proyecto'} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label">Nombre del proyecto</label>
          <input className="input" placeholder="Ej: Cliente X, Estudio, App propia" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="label">Color</label>
          <div className="flex flex-wrap gap-2">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-full transition ${color === c ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900' : ''}`}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>
        <div>
          <label className="label">Objetivo de horas semanales (opcional)</label>
          <input className="input" type="number" min="0" step="0.5" placeholder="Ej: 10" value={target} onChange={(e) => setTarget(e.target.value)} />
        </div>
        <button className="btn-primary w-full" onClick={submit} disabled={!name.trim()}>
          {initial ? 'Guardar cambios' : 'Crear proyecto'}
        </button>
      </div>
    </Modal>
  )
}

function EntryForm({ open, projectId, initial, onClose }: { open: boolean; projectId?: string; initial: TimeEntry | null; onClose: () => void }) {
  const projects = useStore((s) => s.projects)
  const addTimeEntry = useStore((s) => s.addTimeEntry)
  const updateTimeEntry = useStore((s) => s.updateTimeEntry)
  const [pid, setPid] = useState('')
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [date, setDate] = useState(todayKey())
  const [note, setNote] = useState('')
  const [seed, setSeed] = useState<string | null>(null)

  if (open && seed !== (initial?.id ?? 'new')) {
    setSeed(initial?.id ?? 'new')
    setPid(initial?.projectId ?? projectId ?? projects[0]?.id ?? '')
    setHours(initial ? String(Math.floor(initial.minutes / 60)) : '')
    setMinutes(initial ? String(initial.minutes % 60) : '')
    setDate(initial?.date ?? todayKey())
    setNote(initial?.note ?? '')
  }
  if (!open && seed !== null) setSeed(null)

  const total = (Number(hours) || 0) * 60 + (Number(minutes) || 0)

  const submit = () => {
    if (!pid || total <= 0) return
    if (initial) {
      updateTimeEntry(initial.id, { projectId: pid, minutes: total, date, note: note.trim() || undefined })
    } else {
      addTimeEntry(pid, total, date, note)
    }
    onClose()
  }

  return (
    <Modal open={open} title={initial ? 'Editar registro' : 'Registrar tiempo'} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label">Proyecto</label>
          <select className="input" value={pid} onChange={(e) => setPid(e.target.value)}>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Horas</label>
            <input className="input" type="number" min="0" placeholder="0" value={hours} onChange={(e) => setHours(e.target.value)} />
          </div>
          <div>
            <label className="label">Minutos</label>
            <input className="input" type="number" min="0" max="59" placeholder="0" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Fecha</label>
          <input className="input" type="date" value={date} max={todayKey()} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="label">Nota (opcional)</label>
          <input className="input" placeholder="¿En qué trabajaste?" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <button className="btn-primary w-full" onClick={submit} disabled={!pid || total <= 0}>
          {initial ? 'Guardar cambios' : 'Registrar'}
        </button>
      </div>
    </Modal>
  )
}

function RunningTimerCard() {
  const timer = useStore((s) => s.runningTimer)
  const projects = useStore((s) => s.projects)
  const stopTimer = useStore((s) => s.stopTimer)
  const cancelTimer = useStore((s) => s.cancelTimer)
  const [now, setNow] = useState(Date.now())
  const toast = useToast()

  useEffect(() => {
    if (!timer) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [timer])

  if (!timer) return null
  const project = projects.find((p) => p.id === timer.projectId)
  if (!project) return null

  const elapsedSec = Math.max(0, Math.floor((now - new Date(timer.startedAt).getTime()) / 1000))
  const hh = String(Math.floor(elapsedSec / 3600)).padStart(2, '0')
  const mm = String(Math.floor((elapsedSec % 3600) / 60)).padStart(2, '0')
  const ss = String(elapsedSec % 60).padStart(2, '0')

  return (
    <div className="card flex flex-col gap-3 border-l-4 p-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderLeftColor: project.color }}>
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <Timer size={13} /> En curso
        </div>
        <p className="truncate font-bold">{project.name}</p>
        {timer.note && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{timer.note}</p>}
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-2xl font-bold tabular-nums">{hh}:{mm}:{ss}</span>
        <button
          onClick={() => { stopTimer(); toast.notify(`Tiempo guardado en "${project.name}"`) }}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <Square size={16} /> Detener
        </button>
        <button onClick={cancelTimer} aria-label="Cancelar" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
          <X size={18} />
        </button>
      </div>
    </div>
  )
}

/** Barra de distribución apilada por proyecto. */
function DistributionBar({ segments }: { segments: { color: string; minutes: number }[] }) {
  const total = segments.reduce((s, x) => s + x.minutes, 0)
  if (total === 0) return <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800" />
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      {segments.filter((s) => s.minutes > 0).map((s, i) => (
        <div key={i} style={{ backgroundColor: s.color, width: `${(s.minutes / total) * 100}%` }} title={formatMinutes(s.minutes)} />
      ))}
    </div>
  )
}

export default function TimeTracking() {
  const projects = useStore((s) => s.projects)
  const timeEntries = useStore((s) => s.timeEntries)
  const runningTimer = useStore((s) => s.runningTimer)
  const startTimer = useStore((s) => s.startTimer)
  const deleteProject = useStore((s) => s.deleteProject)
  const restoreProject = useStore((s) => s.restoreProject)
  const deleteTimeEntry = useStore((s) => s.deleteTimeEntry)
  const restoreTimeEntry = useStore((s) => s.restoreTimeEntry)
  const toast = useToast()

  const [projectForm, setProjectForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [entryForm, setEntryForm] = useState(false)
  const [entryProjectId, setEntryProjectId] = useState<string | undefined>()
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)

  const today = todayKey()
  const week = useMemo(() => weekKeys(), [])
  const weekSet = useMemo(() => new Set(week), [week])

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects])

  const todayEntries = useMemo(() => timeEntries.filter((e) => e.date === today), [timeEntries, today])
  const weekEntries = useMemo(() => timeEntries.filter((e) => weekSet.has(e.date)), [timeEntries, weekSet])

  const todayByProject = useMemo(() => minutesByProject(todayEntries), [todayEntries])
  const weekByProject = useMemo(() => minutesByProject(weekEntries), [weekEntries])

  const todayTotal = totalMinutes(todayEntries)
  const weekTotal = totalMinutes(weekEntries)

  const todaySegments = projects.map((p) => ({ color: p.color, minutes: todayByProject.get(p.id) ?? 0 }))

  const handleDeleteProject = (p: Project) => {
    const index = projects.findIndex((x) => x.id === p.id)
    const entries = timeEntries.filter((e) => e.projectId === p.id)
    deleteProject(p.id)
    toast.notifyUndo(`Se eliminó "${p.name}"`, () => restoreProject(p, entries, index))
  }

  const handleDeleteEntry = (e: TimeEntry) => {
    const index = timeEntries.findIndex((x) => x.id === e.id)
    deleteTimeEntry(e.id)
    toast.notifyUndo('Registro eliminado', () => restoreTimeEntry(e, index))
  }

  const openEntry = (projectId?: string) => { setEditingEntry(null); setEntryProjectId(projectId); setEntryForm(true) }

  // proyectos ordenados por tiempo de la semana (descendente) para la vista semanal
  const weekRanked = [...projects].sort((a, b) => (weekByProject.get(b.id) ?? 0) - (weekByProject.get(a.id) ?? 0))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tiempo y proyectos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Organizá en qué se va tu día</p>
        </div>
        <button className="btn-primary" onClick={() => openEntry()} disabled={projects.length === 0}>
          <Plus size={18} /> <span className="hidden sm:inline">Registrar</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Sin proyectos todavía"
          description="Creá los proyectos en los que trabajás para registrar y ordenar tu tiempo cada día."
          action={<button className="btn-primary" onClick={() => setProjectForm(true)}><FolderPlus size={18} /> Crear proyecto</button>}
        />
      ) : (
        <>
          <RunningTimerCard />

          {/* Inicio rápido de cronómetro */}
          {!runningTimer && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">Iniciar cronómetro</h2>
              <div className="flex flex-wrap gap-2">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => startTimer(p.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium transition hover:shadow-sm dark:border-slate-700 dark:bg-slate-900"
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                    {p.name}
                    <Play size={14} className="text-slate-400" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Hoy */}
          <section className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold">Hoy</h2>
              <span className="text-sm font-bold text-brand-600 dark:text-brand-300">{formatMinutes(todayTotal)}</span>
            </div>
            <DistributionBar segments={todaySegments} />
            {todayTotal === 0 ? (
              <p className="mt-3 text-sm text-slate-400">Todavía no registraste tiempo hoy.</p>
            ) : (
              <ul className="mt-3 space-y-1.5">
                {projects
                  .filter((p) => (todayByProject.get(p.id) ?? 0) > 0)
                  .sort((a, b) => (todayByProject.get(b.id) ?? 0) - (todayByProject.get(a.id) ?? 0))
                  .map((p) => {
                    const mins = todayByProject.get(p.id) ?? 0
                    return (
                      <li key={p.id} className="flex items-center gap-2 text-sm">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="flex-1 truncate">{p.name}</span>
                        <span className="text-slate-400">{Math.round((mins / todayTotal) * 100)}%</span>
                        <span className="w-16 text-right font-semibold tabular-nums">{formatMinutes(mins)}</span>
                      </li>
                    )
                  })}
              </ul>
            )}
          </section>

          {/* Esta semana */}
          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold">Esta semana</h2>
              <span className="text-sm font-bold text-brand-600 dark:text-brand-300">{formatHours(weekTotal)}</span>
            </div>
            <div className="space-y-3.5">
              {weekRanked.map((p) => {
                const mins = weekByProject.get(p.id) ?? 0
                const targetMin = (p.weeklyTargetHours ?? 0) * 60
                const pct = targetMin > 0 ? Math.min(100, (mins / targetMin) * 100) : 0
                return (
                  <div key={p.id}>
                    <div className="mb-1 flex items-center gap-2 text-sm">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="flex-1 truncate font-medium">{p.name}</span>
                      <span className="tabular-nums text-slate-500 dark:text-slate-400">
                        {formatMinutes(mins)}{targetMin > 0 && <span className="text-slate-400"> / {p.weeklyTargetHours}h</span>}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: targetMin > 0 ? `${pct}%` : weekTotal > 0 ? `${(mins / weekTotal) * 100}%` : '0%',
                          backgroundColor: p.color,
                        }}
                      />
                    </div>
                    {targetMin > 0 && (
                      <p className="mt-0.5 text-right text-[11px] text-slate-400">
                        {pct >= 100 ? '✓ Objetivo cumplido' : `${Math.round(pct)}% del objetivo`}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* Registros de hoy */}
          {todayEntries.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">Registros de hoy</h2>
              <ul className="space-y-2">
                {todayEntries.map((e) => {
                  const p = projectById.get(e.projectId)
                  return (
                    <li key={e.id} className="card flex items-center gap-3 p-3">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: p?.color ?? '#94a3b8' }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{p?.name ?? 'Proyecto eliminado'}</p>
                        {e.note && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{e.note}</p>}
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">{formatMinutes(e.minutes)}</span>
                      <button onClick={() => { setEditingEntry(e); setEntryForm(true) }} aria-label="Editar registro" className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDeleteEntry(e)} aria-label="Eliminar registro" className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950">
                        <Trash2 size={15} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {/* Proyectos */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Proyectos</h2>
              <button onClick={() => { setEditingProject(null); setProjectForm(true) }} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">
                <FolderPlus size={15} /> Nuevo
              </button>
            </div>
            <ul className="space-y-2">
              {projects.map((p) => (
                <li key={p.id} className="card flex items-center gap-3 p-3">
                  <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    {p.weeklyTargetHours ? (
                      <p className="flex items-center gap-1 text-xs text-slate-400"><Target size={11} /> {p.weeklyTargetHours} h/semana</p>
                    ) : null}
                  </div>
                  <button onClick={() => openEntry(p.id)} aria-label={`Registrar en ${p.name}`} className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <Plus size={16} />
                  </button>
                  <button onClick={() => { setEditingProject(p); setProjectForm(true) }} aria-label={`Editar ${p.name}`} className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDeleteProject(p)} aria-label={`Eliminar ${p.name}`} className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950">
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <ProjectForm open={projectForm} initial={editingProject} onClose={() => { setProjectForm(false); setEditingProject(null) }} />
      <EntryForm open={entryForm} projectId={entryProjectId} initial={editingEntry} onClose={() => { setEntryForm(false); setEditingEntry(null); setEntryProjectId(undefined) }} />
    </div>
  )
}
