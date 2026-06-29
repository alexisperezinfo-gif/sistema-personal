import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, Undo2, X } from 'lucide-react'

interface ToastItem {
  id: string
  message: string
  onUndo?: () => void
}

interface ToastApi {
  /** Muestra un aviso simple. */
  notify: (message: string) => void
  /** Muestra un aviso con botón "Deshacer". */
  notifyUndo: (message: string, onUndo: () => void) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const DURATION = 5000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id))
    const timer = timers.current[id]
    if (timer) {
      clearTimeout(timer)
      delete timers.current[id]
    }
  }, [])

  const push = useCallback(
    (message: string, onUndo?: () => void) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((t) => [...t, { id, message, onUndo }])
      timers.current[id] = setTimeout(() => dismiss(id), DURATION)
    },
    [dismiss],
  )

  const api = useMemo<ToastApi>(
    () => ({
      notify: (message) => push(message),
      notifyUndo: (message, onUndo) => push(message, onUndo),
    }),
    [push],
  )

  useEffect(() => {
    const current = timers.current
    return () => {
      Object.values(current).forEach(clearTimeout)
    }
  }, [])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-3 sm:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex w-full max-w-sm animate-fade-in items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg dark:bg-slate-800"
            role="status"
          >
            <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
            <span className="flex-1 leading-tight">{t.message}</span>
            {t.onUndo && (
              <button
                onClick={() => {
                  t.onUndo!()
                  dismiss(t.id)
                }}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-300 transition hover:bg-white/10"
              >
                <Undo2 size={14} /> Deshacer
              </button>
            )}
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Cerrar aviso"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return ctx
}
