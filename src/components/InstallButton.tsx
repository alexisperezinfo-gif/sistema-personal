import { useEffect, useState } from 'react'
import { Download, Share, Plus, CheckCircle2, Smartphone } from 'lucide-react'
import {
  canInstall,
  isInstalled,
  isIos,
  promptInstall,
  subscribeInstall,
} from '../lib/pwaInstall'

/** Botón fijo para instalar la app, siempre disponible desde Ajustes. */
export default function InstallButton() {
  const [, force] = useState(0)
  const [showIosHelp, setShowIosHelp] = useState(false)

  useEffect(() => subscribeInstall(() => force((n) => n + 1)), [])

  if (isInstalled()) {
    return (
      <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 size={18} /> La app ya está instalada en este dispositivo.
      </p>
    )
  }

  const handle = async () => {
    if (canInstall()) {
      await promptInstall()
    } else {
      // iOS (y navegadores sin prompt nativo): mostramos instrucciones
      setShowIosHelp((v) => !v)
    }
  }

  return (
    <div className="space-y-3">
      <button className="btn-primary w-full" onClick={handle}>
        <Download size={18} /> Instalar aplicación
      </button>

      {showIosHelp && (
        <div className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
          {isIos() ? (
            <>
              <p className="mb-2 font-semibold">Para instalar en iPhone/iPad:</p>
              <p className="mb-1.5 flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-200 dark:bg-slate-700"><Share size={14} /></span>
                1. Tocá <b>Compartir</b> (abajo en Safari)
              </p>
              <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-200 dark:bg-slate-700"><Plus size={14} /></span>
                2. Elegí <b>“Agregar a inicio”</b>
              </p>
            </>
          ) : (
            <p className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
              <Smartphone size={16} className="mt-0.5 shrink-0" />
              Usá el menú de tu navegador (⋮) y elegí <b className="mx-1">“Instalar app”</b> o
              <b className="mx-1">“Agregar a pantalla de inicio”</b>.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
