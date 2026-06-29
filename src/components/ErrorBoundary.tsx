import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

/** Captura errores de render para que un fallo no deje la pantalla en blanco. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('Error capturado por ErrorBoundary:', error)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[100dvh] items-center justify-center p-6">
          <div className="card max-w-md p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300">
              <AlertTriangle size={28} />
            </div>
            <h1 className="mb-1 text-lg font-bold">Ups, algo se rompió</h1>
            <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
              Tus datos están a salvo en este dispositivo. Probá recargar la app.
            </p>
            <button className="btn-primary w-full" onClick={() => window.location.reload()}>
              Recargar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
