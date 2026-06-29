import { useState } from 'react'
import { Plus, CreditCard, Trash2, Check, Pencil, CalendarClock } from 'lucide-react'
import { useStore } from '../store/useStore'
import {
  cycleProgress,
  daysUntilDue,
  dueStatus,
  isPaidThisMonth,
  monthlyTotal,
  nextDueDate,
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
  const [seed, setSeed] = useState<string | null>(null)

  if (open && seed !== (initial?.id ?? 'new')) {
    setSeed(initial?.id ?? 'new')
    setName(initial?.name ?? '')
    setAmount(initial ? String(initial.amount) : '')
    setDueDay(initial ? String(initial.dueDay) : '1')
    setNote(initial?.note ?? '')
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
      })
    } else {
      addSubscription({ name: name.trim(), amount: amountNum, dueDay: dayNum, note: note.trim() || undefined })
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
        <button className="btn-primary w-full" onClick={submit} disabled={!valid}>
          {initial ? 'Guardar cambios' : 'Agregar pago'}
        </button>
      </div>
    </Modal>
  )
}

const STATUS_STYLE: Record<ReturnType<typeof dueStatus>, { bar: string; chip: string }> = {
  paid: { bar: 'bg-emerald-500', chip: 'text-emerald-600 dark:text-emerald-400' },
  overdue: { bar: 'bg-red-500', chip: 'text-red-600 dark:text-red-400' },
  soon: { bar: 'bg-amber-500', chip: 'text-amber-600 dark:text-amber-500' },
  upcoming: { bar: 'bg-brand-500', chip: 'text-slate-500 dark:text-slate-400' },
}

function dueLabel(sub: Subscription): string {
  if (isPaidThisMonth(sub)) return 'Pagado este mes'
  const days = daysUntilDue(sub)
  if (days === 0) return 'Vence hoy'
  if (days < 0) return `Atrasado ${Math.abs(days)} día${Math.abs(days) !== 1 ? 's' : ''}`
  if (days === 1) return 'Vence mañana'
  return `Faltan ${days} días`
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
  const paidAmount = subscriptions.filter((s) => isPaidThisMonth(s)).reduce((sum, s) => sum + s.amount, 0)

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
        <ul className="space-y-2.5">
          {subscriptions.map((sub) => {
            const paid = isPaidThisMonth(sub)
            const status = dueStatus(sub)
            const style = STATUS_STYLE[status]
            const pct = paid ? 100 : cycleProgress(sub)
            return (
              <li key={sub.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => togglePaidMonth(sub.id)}
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition active:scale-90 ${
                      paid
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-slate-300 text-transparent hover:border-brand-400 dark:border-slate-600'
                    }`}
                    title={paid ? 'Pagado este mes' : 'Marcar como pagado'}
                  >
                    <Check size={22} strokeWidth={3} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className={`truncate font-semibold ${paid ? 'text-slate-400' : ''}`}>{sub.name}</h3>
                      <span className="shrink-0 font-bold">{formatCurrency(sub.amount, symbol)}</span>
                    </div>
                    {sub.note && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{sub.note}</p>}
                    <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs">
                      <span className={`inline-flex items-center gap-1 font-semibold ${style.chip}`}>
                        <CalendarClock size={12} /> {dueLabel(sub)}
                      </span>
                      <span className="text-slate-400">Próximo: {formatDate(nextDueDate(sub).toISOString())}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button onClick={() => setEditing(sub)} aria-label={`Editar ${sub.name}`} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(sub.id)} aria-label={`Eliminar ${sub.name}`} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {/* Barra progresiva del ciclo mensual */}
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all ${style.bar}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <SubscriptionForm open={open || !!editing} initial={editing} onClose={() => { setOpen(false); setEditing(null) }} />
    </div>
  )
}
