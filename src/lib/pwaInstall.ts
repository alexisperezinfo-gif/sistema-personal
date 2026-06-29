// Captura el evento de instalación de la PWA apenas carga la app, de forma global,
// para que cualquier componente (banner o botón en Ajustes) pueda dispararlo después.

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPromptEvent | null = null
let installed = false
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    emit()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    installed = true
    emit()
  })
}

export function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

/** Hay un prompt nativo disponible para instalar. */
export function canInstall() {
  return deferred !== null
}

/** Ya está instalada / corriendo como app. */
export function isInstalled() {
  return installed || isStandalone()
}

/** Dispara el instalador nativo. Devuelve true si quedó instalada. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false
  await deferred.prompt()
  const choice = await deferred.userChoice
  deferred = null
  emit()
  return choice.outcome === 'accepted'
}

/** Suscribe a cambios (prompt disponible / instalada). */
export function subscribeInstall(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}
