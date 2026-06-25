import { useEffect, useState } from 'react'
import { Download, X, Share, Plus } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'install-banner-dismissed'

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}
function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIosHelp, setShowIosHelp] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISS_KEY)) return

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)

    // iOS no dispara beforeinstallprompt: mostramos ayuda manual
    if (isIos()) {
      const t = setTimeout(() => setVisible(true), 1500)
      return () => {
        clearTimeout(t)
        window.removeEventListener('beforeinstallprompt', onPrompt)
      }
    }
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const dismiss = () => {
    setVisible(false)
    setShowIosHelp(false)
    localStorage.setItem(DISMISS_KEY, '1')
  }

  const install = async () => {
    if (deferred) {
      await deferred.prompt()
      await deferred.userChoice
      setDeferred(null)
      setVisible(false)
    } else if (isIos()) {
      setShowIosHelp((v) => !v)
    }
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-3 bottom-20 z-40 mx-auto max-w-md animate-fade-in sm:bottom-4">
      <div className="card flex items-center gap-3 border-brand-200 p-3 shadow-lg dark:border-brand-900">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Download size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">Instalá la app</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Accedé directo desde tu pantalla de inicio</p>
        </div>
        <button onClick={install} className="btn-primary !px-3 !py-2 text-xs">Instalar</button>
        <button onClick={dismiss} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
          <X size={16} />
        </button>
      </div>

      {showIosHelp && (
        <div className="card mt-2 space-y-2 p-3 text-sm dark:border-brand-900">
          <p className="font-semibold">Para instalar en iPhone/iPad:</p>
          <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-100 dark:bg-slate-800"><Share size={14} /></span>
            1. Tocá el botón <b>Compartir</b> (abajo en Safari)
          </p>
          <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-100 dark:bg-slate-800"><Plus size={14} /></span>
            2. Elegí <b>“Agregar a inicio”</b>
          </p>
        </div>
      )}
    </div>
  )
}
