import { NavLink } from 'react-router-dom'
import { LayoutDashboard, PiggyBank, Target, Repeat, Settings, Moon, Sun } from 'lucide-react'
import type { ReactNode } from 'react'
import { useStore } from '../store/useStore'

const NAV = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/metas', label: 'Ahorro', icon: PiggyBank },
  { to: '/objetivos', label: 'Objetivos', icon: Target },
  { to: '/habitos', label: 'Hábitos', icon: Repeat },
  { to: '/ajustes', label: 'Ajustes', icon: Settings },
]

function ThemeToggle() {
  const theme = useStore((s) => s.settings.theme)
  const setTheme = useStore((s) => s.setTheme)
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="btn-ghost !px-2.5"
      title="Cambiar tema"
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] sm:flex">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-[100dvh] w-60 shrink-0 flex-col border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <PiggyBank size={20} />
          </div>
          <span className="font-bold leading-tight">Mi Sistema<br /><span className="text-xs font-medium text-slate-400">Personal</span></span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-1">
          <ThemeToggle />
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1">
        {/* Topbar (mobile) */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 sm:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <PiggyBank size={17} />
            </div>
            <span className="font-bold">Mi Sistema</span>
          </div>
          <ThemeToggle />
        </header>

        <main className="mx-auto w-full max-w-4xl px-4 pb-28 pt-5 sm:pb-10 sm:pt-8">{children}</main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:hidden">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                isActive ? 'text-brand-600 dark:text-brand-300' : 'text-slate-500 dark:text-slate-400'
              }`
            }
          >
            <Icon size={21} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
