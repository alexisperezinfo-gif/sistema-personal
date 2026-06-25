import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, PiggyBank, ImagePlus, Trophy } from 'lucide-react'
import { useStore, goalTotal } from '../store/useStore'
import { formatCurrency, clampPercent } from '../lib/format'
import { fileToResizedDataUrl } from '../lib/image'
import type { SavingGoal } from '../types'
import ProgressBar from '../components/ProgressBar'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'

function GoalForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addGoal = useStore((s) => s.addGoal)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [target, setTarget] = useState('')
  const [image, setImage] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)

  const reset = () => {
    setTitle(''); setDescription(''); setTarget(''); setImage(undefined)
  }

  const handleImage = async (file?: File) => {
    if (!file) return
    setBusy(true)
    try {
      setImage(await fileToResizedDataUrl(file))
    } finally {
      setBusy(false)
    }
  }

  const submit = () => {
    const amount = Number(target)
    if (!title.trim() || !amount || amount <= 0) return
    addGoal({ title: title.trim(), description: description.trim(), targetAmount: amount, imageDataUrl: image })
    reset()
    onClose()
  }

  return (
    <Modal open={open} title="Nueva meta de ahorro" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label">¿Qué querés lograr?</label>
          <input className="input" placeholder="Ej: Comprar una notebook" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="label">Descripción (opcional)</label>
          <textarea className="input min-h-[72px]" placeholder="Modelo, detalles, por qué lo querés..." value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="label">Monto objetivo</label>
          <input className="input" type="number" inputMode="decimal" placeholder="0" value={target} onChange={(e) => setTarget(e.target.value)} />
        </div>
        <div>
          <label className="label">Imagen (opcional)</label>
          {image ? (
            <div className="relative">
              <img src={image} alt="" className="h-40 w-full rounded-xl object-cover" />
              <button onClick={() => setImage(undefined)} className="absolute right-2 top-2 rounded-lg bg-slate-900/70 px-2 py-1 text-xs text-white">
                Quitar
              </button>
            </div>
          ) : (
            <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 text-sm text-slate-500 transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-700">
              <ImagePlus size={24} />
              {busy ? 'Procesando...' : 'Subir foto del objetivo'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(e.target.files?.[0])} />
            </label>
          )}
        </div>
        <button className="btn-primary w-full" onClick={submit} disabled={!title.trim() || !Number(target)}>
          Crear meta
        </button>
      </div>
    </Modal>
  )
}

function GoalCard({ goal }: { goal: SavingGoal }) {
  const saved = goalTotal(goal)
  const percent = goal.targetAmount > 0 ? (saved / goal.targetAmount) * 100 : 0
  const symbol = useStore((s) => s.settings.currencySymbol)
  const remaining = Math.max(0, goal.targetAmount - saved)
  const achieved = !!goal.achievedAt

  return (
    <Link to={`/metas/${goal.id}`} className="card group overflow-hidden transition hover:shadow-md">
      {goal.imageDataUrl ? (
        <div className="relative h-36 w-full overflow-hidden">
          <img src={goal.imageDataUrl} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
          {achieved && (
            <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white">
              <Trophy size={13} /> Logrado
            </span>
          )}
        </div>
      ) : (
        <div className="flex h-36 items-center justify-center bg-gradient-to-br from-brand-100 to-brand-200 text-brand-500 dark:from-brand-900/40 dark:to-brand-800/40">
          <PiggyBank size={44} />
        </div>
      )}
      <div className="p-4">
        <h3 className="mb-1 font-semibold leading-tight">{goal.title}</h3>
        <div className="mb-3 flex items-baseline justify-between text-sm">
          <span className="font-bold text-brand-600 dark:text-brand-300">{formatCurrency(saved, symbol)}</span>
          <span className="text-slate-400">de {formatCurrency(goal.targetAmount, symbol)}</span>
        </div>
        <ProgressBar percent={percent} achieved={achieved} />
        <div className="mt-2 flex justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{clampPercent(percent).toFixed(0)}%</span>
          <span>{achieved ? '¡Completado!' : `Faltan ${formatCurrency(remaining, symbol)}`}</span>
        </div>
      </div>
    </Link>
  )
}

export default function SavingGoals() {
  const goals = useStore((s) => s.goals)
  const [open, setOpen] = useState(false)

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Metas de ahorro</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Definí tus objetivos y andá sumando montos</p>
        </div>
        <button className="btn-primary" onClick={() => setOpen(true)}>
          <Plus size={18} /> <span className="hidden sm:inline">Nueva meta</span>
        </button>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="Todavía no tenés metas"
          description="Creá tu primera meta de ahorro, como 'Comprar una notebook', y mirá cómo avanzás."
          action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={18} /> Crear meta</button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} />
          ))}
        </div>
      )}

      <GoalForm open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
