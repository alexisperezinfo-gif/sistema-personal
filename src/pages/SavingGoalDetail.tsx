import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Pencil, Trophy, PiggyBank, ImagePlus, TrendingUp, CalendarClock } from 'lucide-react'
import { useStore, goalTotal } from '../store/useStore'
import { formatCurrency, formatDate, todayKey, clampPercent } from '../lib/format'
import { savedThisMonth, savingProjection } from '../lib/savings'
import { fileToResizedDataUrl } from '../lib/image'
import type { Contribution } from '../types'
import ProgressBar from '../components/ProgressBar'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Confetti from '../components/Confetti'
import { useToast } from '../components/Toast'

export default function SavingGoalDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const goal = useStore((s) => s.goals.find((g) => g.id === id))
  const symbol = useStore((s) => s.settings.currencySymbol)
  const addContribution = useStore((s) => s.addContribution)
  const updateContribution = useStore((s) => s.updateContribution)
  const deleteContribution = useStore((s) => s.deleteContribution)
  const updateGoal = useStore((s) => s.updateGoal)
  const deleteGoal = useStore((s) => s.deleteGoal)
  const restoreGoal = useStore((s) => s.restoreGoal)
  const restoreContribution = useStore((s) => s.restoreContribution)
  const toast = useToast()

  const [addOpen, setAddOpen] = useState(false)
  const [editGoalOpen, setEditGoalOpen] = useState(false)
  const [editContrib, setEditContrib] = useState<Contribution | null>(null)
  const [delContrib, setDelContrib] = useState<string | null>(null)
  const [delGoalOpen, setDelGoalOpen] = useState(false)
  const [celebrate, setCelebrate] = useState(false)

  // Dispara confeti al pasar de "no logrado" a "logrado".
  const wasAchieved = useRef<boolean | null>(null)
  const isAchieved = !!goal?.achievedAt
  useEffect(() => {
    if (wasAchieved.current === false && isAchieved) {
      setCelebrate(true)
      toast.notify('🎉 ¡Meta lograda! Felicitaciones')
    }
    if (goal) wasAchieved.current = isAchieved
  }, [isAchieved, goal, toast])

  if (!goal) {
    return (
      <div className="card p-8 text-center">
        <p className="mb-4 text-slate-500">Esta meta no existe.</p>
        <Link to="/metas" className="btn-primary inline-flex">Volver a metas</Link>
      </div>
    )
  }

  const saved = goalTotal(goal)
  const percent = goal.targetAmount > 0 ? (saved / goal.targetAmount) * 100 : 0
  const remaining = Math.max(0, goal.targetAmount - saved)
  const achieved = !!goal.achievedAt
  const thisMonth = savedThisMonth(goal)
  const projection = achieved ? null : savingProjection(goal)

  return (
    <div>
      <Confetti active={celebrate} />
      <button onClick={() => navigate('/metas')} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600">
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="card overflow-hidden">
        {goal.imageDataUrl ? (
          <img src={goal.imageDataUrl} alt="" className="h-56 w-full object-cover" />
        ) : (
          <div className="flex h-40 items-center justify-center bg-gradient-to-br from-brand-100 to-brand-200 text-brand-500 dark:from-brand-900/40 dark:to-brand-800/40">
            <PiggyBank size={52} />
          </div>
        )}
        <div className="p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">{goal.title}</h1>
              {goal.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{goal.description}</p>}
            </div>
            <div className="flex shrink-0 gap-1">
              <button onClick={() => setEditGoalOpen(true)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" title="Editar meta">
                <Pencil size={17} />
              </button>
              <button onClick={() => setDelGoalOpen(true)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950" title="Eliminar meta">
                <Trash2 size={17} />
              </button>
            </div>
          </div>

          {achieved && (
            <div className="mb-4 flex animate-pop items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <Trophy size={18} /> ¡Meta lograda! Felicitaciones 🎉
            </div>
          )}

          <div className="mb-2 flex items-end justify-between">
            <span className="text-2xl font-bold text-brand-600 dark:text-brand-300">{formatCurrency(saved, symbol)}</span>
            <span className="text-sm text-slate-400">de {formatCurrency(goal.targetAmount, symbol)}</span>
          </div>
          <ProgressBar percent={percent} size="lg" achieved={achieved} />
          <div className="mt-2 flex justify-between text-sm text-slate-500 dark:text-slate-400">
            <span className="font-semibold">{clampPercent(percent).toFixed(1)}%</span>
            <span>{achieved ? '¡Completado!' : `Faltan ${formatCurrency(remaining, symbol)}`}</span>
          </div>

          <button className="btn-primary mt-5 w-full" onClick={() => setAddOpen(true)}>
            <Plus size={18} /> Agregar monto
          </button>
        </div>
      </div>

      {/* Resumen y proyección */}
      {!achieved && (goal.contributions.length > 0) && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="card flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
              <TrendingUp size={18} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-bold leading-tight">{formatCurrency(thisMonth, symbol)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ahorrado este mes</p>
            </div>
          </div>
          {projection && projection.etaDate && (
            <div className="card flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/50 dark:text-brand-300">
                <CalendarClock size={18} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-bold leading-tight">{formatDate(projection.etaDate.toISOString())}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  A tu ritmo (~{formatCurrency(Math.round(projection.monthlyRate), symbol)}/mes)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Historial */}
      <h2 className="mb-3 mt-7 text-lg font-bold">Historial de aportes</h2>
      {goal.contributions.length === 0 ? (
        <p className="card px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Todavía no cargaste ningún monto. Tocá “Agregar monto” para empezar.
        </p>
      ) : (
        <ul className="space-y-2">
          {goal.contributions.map((c) => (
            <li key={c.id} className="card flex items-center justify-between p-3.5">
              <div>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400">+ {formatCurrency(c.amount, symbol)}</p>
                <p className="text-xs text-slate-400">{formatDate(c.date)}{c.note ? ` · ${c.note}` : ''}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditContrib(c)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <Pencil size={15} />
                </button>
                <button onClick={() => setDelContrib(c.id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950">
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal agregar/editar aporte */}
      <ContributionForm
        open={addOpen || !!editContrib}
        initial={editContrib}
        onClose={() => { setAddOpen(false); setEditContrib(null) }}
        onSubmit={(amount, date, note) => {
          if (editContrib) updateContribution(goal.id, editContrib.id, amount, date, note)
          else addContribution(goal.id, amount, date, note)
          setAddOpen(false); setEditContrib(null)
        }}
      />

      {/* Modal editar meta */}
      <EditGoalForm
        open={editGoalOpen}
        goalTitle={goal.title}
        goalDesc={goal.description}
        goalTarget={goal.targetAmount}
        goalImage={goal.imageDataUrl}
        onClose={() => setEditGoalOpen(false)}
        onSubmit={(patch) => { updateGoal(goal.id, patch); setEditGoalOpen(false) }}
      />

      <ConfirmDialog
        open={!!delContrib}
        message="¿Eliminar este aporte? El saldo se recalculará."
        onCancel={() => setDelContrib(null)}
        onConfirm={() => {
          if (delContrib) {
            const index = goal.contributions.findIndex((c) => c.id === delContrib)
            const contribution = goal.contributions[index]
            deleteContribution(goal.id, delContrib)
            if (contribution) {
              toast.notifyUndo('Aporte eliminado', () => restoreContribution(goal.id, contribution, index))
            }
          }
          setDelContrib(null)
        }}
      />
      <ConfirmDialog
        open={delGoalOpen}
        title="Eliminar meta"
        message="Se eliminará la meta y todo su historial."
        onCancel={() => setDelGoalOpen(false)}
        onConfirm={() => {
          const index = useStore.getState().goals.findIndex((g) => g.id === goal.id)
          const snapshot = goal
          deleteGoal(goal.id)
          toast.notifyUndo(`Se eliminó "${snapshot.title}"`, () => restoreGoal(snapshot, index))
          navigate('/metas')
        }}
      />
    </div>
  )
}

function ContributionForm({
  open, initial, onClose, onSubmit,
}: {
  open: boolean
  initial: Contribution | null
  onClose: () => void
  onSubmit: (amount: number, date: string, note?: string) => void
}) {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayKey())
  const [note, setNote] = useState('')
  const [seed, setSeed] = useState<string | null>(null)

  // sincroniza cuando se abre con un aporte distinto
  if (open && seed !== (initial?.id ?? 'new')) {
    setSeed(initial?.id ?? 'new')
    setAmount(initial ? String(initial.amount) : '')
    setDate(initial?.date ?? todayKey())
    setNote(initial?.note ?? '')
  }
  if (!open && seed !== null) setSeed(null)

  const submit = () => {
    const n = Number(amount)
    if (!n || n <= 0) return
    onSubmit(n, date, note)
  }

  return (
    <Modal open={open} title={initial ? 'Editar aporte' : 'Agregar monto'} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label">Monto</label>
          <input className="input text-lg" type="number" inputMode="decimal" placeholder="0" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} />
          <div className="mt-2 flex flex-wrap gap-2">
            {[1000, 5000, 10000, 50000].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setAmount(String((Number(amount) || 0) + q))}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-brand-900/40"
              >
                +{q.toLocaleString('es-AR')}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Fecha</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="label">Nota (opcional)</label>
          <input className="input" placeholder="Ej: sueldo, venta, ahorro" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <button className="btn-primary w-full" onClick={submit} disabled={!Number(amount)}>
          {initial ? 'Guardar cambios' : 'Agregar'}
        </button>
      </div>
    </Modal>
  )
}

function EditGoalForm({
  open, goalTitle, goalDesc, goalTarget, goalImage, onClose, onSubmit,
}: {
  open: boolean
  goalTitle: string
  goalDesc: string
  goalTarget: number
  goalImage?: string
  onClose: () => void
  onSubmit: (patch: { title: string; description: string; targetAmount: number; imageDataUrl?: string }) => void
}) {
  const [title, setTitle] = useState(goalTitle)
  const [desc, setDesc] = useState(goalDesc)
  const [target, setTarget] = useState(String(goalTarget))
  const [image, setImage] = useState<string | undefined>(goalImage)
  const [seed, setSeed] = useState(false)
  const [busy, setBusy] = useState(false)

  if (open && !seed) {
    setSeed(true)
    setTitle(goalTitle); setDesc(goalDesc); setTarget(String(goalTarget)); setImage(goalImage)
  }
  if (!open && seed) setSeed(false)

  const handleImage = async (file?: File) => {
    if (!file) return
    setBusy(true)
    try { setImage(await fileToResizedDataUrl(file)) } finally { setBusy(false) }
  }

  const submit = () => {
    const n = Number(target)
    if (!title.trim() || !n || n <= 0) return
    onSubmit({ title: title.trim(), description: desc.trim(), targetAmount: n, imageDataUrl: image })
  }

  return (
    <Modal open={open} title="Editar meta" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label">Título</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="label">Descripción</label>
          <textarea className="input min-h-[72px]" value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <div>
          <label className="label">Monto objetivo</label>
          <input className="input" type="number" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} />
        </div>
        <div>
          <label className="label">Imagen</label>
          {image ? (
            <div className="relative">
              <img src={image} alt="" className="h-40 w-full rounded-xl object-cover" />
              <button onClick={() => setImage(undefined)} className="absolute right-2 top-2 rounded-lg bg-slate-900/70 px-2 py-1 text-xs text-white">Quitar</button>
            </div>
          ) : (
            <label className="flex h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 text-sm text-slate-500 hover:border-brand-400 dark:border-slate-700">
              <ImagePlus size={22} />
              {busy ? 'Procesando...' : 'Subir foto'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(e.target.files?.[0])} />
            </label>
          )}
        </div>
        <button className="btn-primary w-full" onClick={submit} disabled={!title.trim() || !Number(target)}>Guardar cambios</button>
      </div>
    </Modal>
  )
}
