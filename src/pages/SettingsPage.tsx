import { useRef, useState } from 'react'
import { Moon, Sun, Download, Upload, Coins, Trash2, Info } from 'lucide-react'
import { useStore } from '../store/useStore'
import { exportData, importData } from '../lib/backup'
import ConfirmDialog from '../components/ConfirmDialog'

export default function SettingsPage() {
  const settings = useStore((s) => s.settings)
  const goals = useStore((s) => s.goals)
  const objectives = useStore((s) => s.objectives)
  const habits = useStore((s) => s.habits)
  const setTheme = useStore((s) => s.setTheme)
  const setCurrencySymbol = useStore((s) => s.setCurrencySymbol)
  const replaceAll = useStore((s) => s.replaceAll)

  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [confirmWipe, setConfirmWipe] = useState(false)

  const handleExport = () => {
    exportData({ goals, objectives, habits, settings })
    setMsg({ type: 'ok', text: 'Respaldo descargado correctamente.' })
  }

  const handleImport = async (file?: File) => {
    if (!file) return
    try {
      const data = await importData(file)
      replaceAll(data)
      setMsg({ type: 'ok', text: 'Datos importados correctamente.' })
    } catch (e) {
      setMsg({ type: 'err', text: e instanceof Error ? e.message : 'Error al importar.' })
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const wipe = () => {
    replaceAll({ goals: [], objectives: [], habits: [] })
    setConfirmWipe(false)
    setMsg({ type: 'ok', text: 'Se borraron todos los datos.' })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ajustes</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Personalización y respaldo de tus datos</p>
      </div>

      {msg && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300'}`}>
          {msg.text}
        </div>
      )}

      {/* Apariencia */}
      <section className="card p-5">
        <h2 className="mb-4 font-bold">Apariencia</h2>
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium">Tema</span>
          <div className="flex gap-2">
            <button onClick={() => setTheme('light')} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${settings.theme === 'light' ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
              <Sun size={16} /> Claro
            </button>
            <button onClick={() => setTheme('dark')} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${settings.theme === 'dark' ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
              <Moon size={16} /> Oscuro
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm font-medium"><Coins size={16} /> Símbolo de moneda</span>
          <input
            className="input w-24 text-center"
            value={settings.currencySymbol}
            maxLength={4}
            onChange={(e) => setCurrencySymbol(e.target.value || '$')}
          />
        </div>
      </section>

      {/* Datos */}
      <section className="card p-5">
        <h2 className="mb-1 font-bold">Tus datos</h2>
        <p className="mb-4 flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Info size={14} className="mt-0.5 shrink-0" />
          Todo se guarda solo en este dispositivo. Exportá un respaldo cada tanto para no perder nada.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button className="btn-ghost" onClick={handleExport}>
            <Download size={18} /> Exportar respaldo
          </button>
          <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
            <Upload size={18} /> Importar respaldo
          </button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => handleImport(e.target.files?.[0])} />

        <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
          <button className="btn-danger w-full" onClick={() => setConfirmWipe(true)}>
            <Trash2 size={18} /> Borrar todos los datos
          </button>
        </div>
      </section>

      <p className="text-center text-xs text-slate-400">Mi Sistema Personal · v1.0</p>

      <ConfirmDialog
        open={confirmWipe}
        title="Borrar todo"
        message="Se eliminarán todas las metas, objetivos y hábitos de este dispositivo. Esta acción no se puede deshacer. ¿Continuar?"
        confirmLabel="Sí, borrar todo"
        onCancel={() => setConfirmWipe(false)}
        onConfirm={wipe}
      />
    </div>
  )
}
