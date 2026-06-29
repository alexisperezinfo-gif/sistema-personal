import { useState } from 'react'
import { Plus, CreditCard, Trash2, Check, Pencil, CalendarClock, ImagePlus } from 'lucide-react'
import { useStore } from '../store/useStore'
import { fileToResizedDataUrl } from '../lib/image'
import {
  amountProgress,
  daysUntilDue,
  dueStatus,
  isPaidThisMonth,
  monthlyTotal,
  nextDueDate,
  paidAmountThisMonth,
} from '../lib/subscriptions'
import { formatCurrency, formatDate } from '../lib/format'
import type { Subscription } from '../types'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import { useToast } from '../components/Toast'

function SubscriptionForm({ open, initial, onClose }: { open: boolean; initial: Subscription | null; onClose: () => void }) {
  const addSubscription = useStore((s) => s.addSubscription)
  const updateSubscription = useStore((s) => s.updateSubscription)
  const symbol = useStore((s) => s.settings.currencySymbol)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDay, setDueDay] = useState('1')
  const [note, setNote] = useState('')
  const [image, setImage] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)
  const [seed, setSeed] = useState<string | null>(null)

  if (open && seed !== (initial?.id ?? 'new')) {
    setSeed(initial?.id ?? 'new')
    setName(initial?.name ?? '')
    setAmount(initial ? String(initial.amount) : '')
    setDueDay(initial ? String(initial.dueDay) : '1')
    setNote(initial?.note ?? '')
    setImage(initial?.imageDataUrl)
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
  if (!open && seed !== null) setSeed(null)

  const amountNum = parseFloat(amount.replace(',', '.'))
  const dayNum = Math.min(Math.max(parseInt(dueDay, 10) || 1, 1), 31)
  const valid = name.trim() && isFinite(amountNum) && amountNum > 0

  const submit = () => {
    if (!valid) return
    if (initial) {
      updateSubscription(initial.id, {
        name: name.trim(),
        amount: amountNum,
        dueDay: dayNum,
        note: note.trim() || undefined,
        imageDataUrl: image,
      })
    } else {
      addSubscription({ name: name.trim(), amount: amountNum, dueDay: dayNum, note: note.trim() || undefined, imageDataUrl: image })
    }
    onClose()
  }

  return (
    <Modal open={open} title={initial ? 'Editar pago' : 'Nuevo pago mensual'} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label">Nombre del servicio</label>
          <input className="input" placeholder="Ej: Netflix, Alquiler, Gimnasio" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Monto ({symbol})</label>
            <input className="input" inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="label">Día de cobro</label>
            <input className="input" inputMode="numeric" placeholder="1–31" value={dueDay} onChange={(e) => setDueDay(e.target.value.replace(/\D/g, '').slice(0, 2))} />
          </div>
        </div>
        <div>
          <label className="label">Nota (opcional)</label>
          <input className="input" placeholder="Ej: Plan familiar, tarjeta terminada en 1234" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div>
          <label className="label">Imagen / logo (opcional)</label>
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
              {busy ? 'Procesando...' : 'Subir imagen'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(e.target.files?.[0])} />
            </label>
          )}
        </div>
        <button className="btn-primary w-full" onClick={submit} disabled={!valid}>
          {initial ? 'Guardar cambios' : 'Agregar pago'}
        </button>
      </div>
    </Modal>
  )
}

type Status = ReturnType<typeof dueStatus>

const STATUS_STYLE: Record<Status, { bar: string; chip: string }> = {
  paid: { bar: 'bg-emerald-500', chip: 'text-emerald-600 dark:text-emerald-400' },
  overdue: { bar: 'bg-red-500', chip: 'text-red-600 dark:text-red-400' },
  soon: { bar: 'bg-amber-500', chip: 'text-amber-600 dark:text-amber-500' },
  upcoming: { bar: 'bg-brand-500', chip: 'text-slate-500 dark:text-slate-400' },
}

/** Columnas del tablero kanban, en orden de prioridad. */
const COLUMNS: { status: Status; title: string; dot: string }[] = [
  { status: 'overdue', title: 'Atrasados', dot: 'bg-red-500' },
  { status: 'soon', title: 'Por vencer', dot: 'bg-amber-500' },
  { status: 'upcoming', title: 'Próximos', dot: 'bg-brand-500' },
  { status: 'paid', title: 'Pagados', dot: 'bg-emerald-500' },
]

function dueLabel(sub: Subscription): string {
  if (isPaidThisMonth(sub)) return 'Pagado este mes'
  const days = daysUntilDue(sub)
  if (days === 0) return 'Vence hoy'
  if (days < 0) return `Atrasado ${Math.abs(days)} día${Math.abs(days) !== 1 ? 's' : ''}`
  if (days === 1) return 'Vence mañana'
  return `Faltan ${days} días`
}

function SubscriptionCard({
  sub,
  symbol,
  onToggle,
  onEdit,
  onDelete,
}: {
  sub: Subscription
  symbol: string
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const paid = isPaidThisMonth(sub)
  const status = dueStatus(sub)
  const style = STATUS_STYLE[status]
  const pct = paid ? 100 : amountProgress(sub)

  return (
    <div className="card p-3">
      {sub.imageDataUrl && (
        <img src={sub.imageDataUrl} alt="" className="mb-2.5 h-24 w-full rounded-lg object-cover" />
      )}
      <div className="flex items-start gap-2.5">
        <button
          onClick={onToggle}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition active:scale-90 ${
            paid
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-slate-300 text-transparent hover:border-brand-400 dark:border-slate-600'
          }`}
          title={paid ? 'Pagado este mes' : 'Marcar como pagado'}
        >
          <Check size={18} strokeWidth={3} />
        </button>
        <div className="min-w-0 flex-1">
          <h3 className={`truncate font-semibold leading-tight ${paid ? 'text-slate-400' : ''}`}>{sub.name}</h3>
          <p className="font-bold">{formatCurrency(sub.amount, symbol)}</p>
          {sub.note && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{sub.note}</p>}
        </div>
        <div className="flex shrink-0 flex-col gap-0.5">
          <button onClick={onEdit} aria-label={`Editar ${sub.name}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Pencil size={14} />
          </button>
          <button onClick={onDelete} aria-label={`Eliminar ${sub.name}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
        <span className={`inline-flex items-center gap-1 font-semibold ${style.chip}`}>
          <CalendarClock size={12} /> {dueLabel(sub)}
        </span>
        <span className="text-slate-400">{formatDate(nextDueDate(sub).toISOString())}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={`h-full rounded-full transition-all ${style.bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function Subscriptions() {
  const subscriptions = useStore((s) => s.subscriptions)
  const symbol = useStore((s) => s.settings.currencySymbol)
  const togglePaidMonth = useStore((s) => s.togglePaidMonth)
  const deleteSubscription = useStore((s) => s.deleteSubscription)
  const restoreSubscription = useStore((s) => s.restoreSubscription)
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Subscription | null>(null)

  const handleDelete = (id: string) => {
    const index = subscriptions.findIndex((s) => s.id === id)
    const sub = subscriptions[index]
    if (!sub) return
    deleteSubscription(id)
    toast.notifyUndo(`Se eliminó "${sub.name}"`, () => restoreSubscription(sub, index))
  }

  const total = monthlyTotal(subscriptions)
  const paidCount = subscriptions.filter((s) => isPaidThisMonth(s)).length
  const paidAmount = subscriptions.reduce((sum, s) => sum + paidAmountThisMonth(s), 0)

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pagos y suscripciones</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Controlá tus gastos fijos mensuales</p>
        </div>
        <button className="btn-primary" onClick={() => setOpen(true)}>
          <Plus size={18} /> <span className="hidden sm:inline">Nuevo</span>
        </button>
      </div>

      {subscriptions.length > 0 && (
        <div className="card mb-4 grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total mensual</p>
            <p className="text-xl font-bold">{formatCurrency(total, symbol)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pagado este mes</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(paidAmount, symbol)}</p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Progreso</p>
            <p className="text-xl font-bold">{paidCount}/{subscriptions.length} {paidCount === subscriptions.length && '🎉'}</p>
          </div>
        </div>
      )}

      {subscriptions.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Sin pagos registrados"
          description="Agregá tus suscripciones y gastos fijos para no perder de vista cuándo vence cada uno."
          action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={18} /> Agregar pago</button>}
        />
      ) : (
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible">
          {COLUMNS.map((col) => {
            const items = subscriptions.filter((s) => dueStatus(s) === col.status)
            return (
              <div key={col.status} className="flex w-72 shrink-0 flex-col lg:w-auto">
                <div className="mb-2.5 flex items-center gap-2 px-1">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
                  <h2 className="text-sm font-semibold">{col.title}</h2>
                  <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {items.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {items.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400 dark:border-slate-700">
                      Sin pagos
                    </p>
                  ) : (
                    items.map((sub) => (
                      <SubscriptionCard
                        key={sub.id}
                        sub={sub}
                        symbol={symbol}
                        onToggle={() => togglePaidMonth(sub.id)}
                        onEdit={() => setEditing(sub)}
                        onDelete={() => handleDelete(sub.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <SubscriptionForm open={open || !!editing} initial={editing} onClose={() => { setOpen(false); setEditing(null) }} />
    </div>
  )
}
