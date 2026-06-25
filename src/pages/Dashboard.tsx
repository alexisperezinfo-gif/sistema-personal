import { Link } from 'react-router-dom'
import { PiggyBank, Target, Repeat, TrendingUp, Check, ChevronRight, Trophy } from 'lucide-react'
import { useStore, goalTotal } from '../store/useStore'
import { formatCurrency, clampPercent } from '../lib/format'
import { doneToday, currentStreak } from '../lib/habits'
import ProgressBar from '../components/ProgressBar'

const MOTIVATION = [
  'Cada peso cuenta. ¡Seguí así! 💪',
  'El progreso constante vence al talento.',
  'Pequeños pasos, grandes logros.',
  'Hoy es un buen día para avanzar.',
  'Tu yo del futuro te lo agradecerá.',
]

function StatCard({ icon: Icon, label, value, to, color }: { icon: typeof Target; label: string; value: string; to: string; color: string }) {
  return (
    <Link to={to} className="card flex items-center gap-3 p-4 transition hover:shadow-md">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xl font-bold leading-tight">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const goals = useStore((s) => s.goals)
  const objectives = useStore((s) => s.objectives)
  const habits = useStore((s) => s.habits)
  const symbol = useStore((s) => s.settings.currencySymbol)
  const toggleHabit = useStore((s) => s.toggleHabitToday)

  const totalSaved = goals.reduce((sum, g) => sum + goalTotal(g), 0)
  const activeObjectives = objectives.filter((o) => o.status !== 'logrado').length
  const achievedGoals = goals.filter((g) => g.achievedAt).length
  const pendingHabits = habits.filter((h) => !doneToday(h))
  const doneHabits = habits.length - pendingHabits.length

  const topGoals = [...goals]
    .filter((g) => !g.achievedAt)
    .map((g) => ({ g, pct: g.targetAmount > 0 ? (goalTotal(g) / g.targetAmount) * 100 : 0 }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3)

  const motivation = MOTIVATION[new Date().getDate() % MOTIVATION.length]
  const hour = new Date().getHours()
  const greeting = hour < 6 ? 'Buenas noches' : hour < 13 ? 'Buen día' : hour < 20 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{greeting} 👋</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{motivation}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label="Total ahorrado" value={formatCurrency(totalSaved, symbol)} to="/metas" color="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300" />
        <StatCard icon={PiggyBank} label="Metas activas" value={String(goals.length - achievedGoals)} to="/metas" color="bg-brand-100 text-brand-600 dark:bg-brand-900/50 dark:text-brand-300" />
        <StatCard icon={Target} label="Objetivos activos" value={String(activeObjectives)} to="/objetivos" color="bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300" />
        <StatCard icon={Repeat} label="Hábitos hoy" value={`${doneHabits}/${habits.length}`} to="/habitos" color="bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-300" />
      </div>

      {/* Metas cercanas */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Metas más cercanas</h2>
          <Link to="/metas" className="flex items-center text-sm font-medium text-brand-600 hover:underline">Ver todas <ChevronRight size={16} /></Link>
        </div>
        {topGoals.length === 0 ? (
          <div className="card px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {goals.length === 0 ? (
              <>No tenés metas todavía. <Link to="/metas" className="font-semibold text-brand-600">Creá la primera →</Link></>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600"><Trophy size={16} /> ¡Completaste todas tus metas!</span>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {topGoals.map(({ g, pct }) => (
              <Link key={g.id} to={`/metas/${g.id}`} className="card flex items-center gap-3 p-3.5 transition hover:shadow-md">
                {g.imageDataUrl ? (
                  <img src={g.imageDataUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-500 dark:bg-brand-900/50"><PiggyBank size={22} /></div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <h3 className="truncate text-sm font-semibold">{g.title}</h3>
                    <span className="shrink-0 text-xs font-bold text-brand-600 dark:text-brand-300">{clampPercent(pct).toFixed(0)}%</span>
                  </div>
                  <ProgressBar percent={pct} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Hábitos de hoy */}
      {habits.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Hábitos de hoy</h2>
            <Link to="/habitos" className="flex items-center text-sm font-medium text-brand-600 hover:underline">Ver todos <ChevronRight size={16} /></Link>
          </div>
          {pendingHabits.length === 0 ? (
            <div className="card px-4 py-6 text-center text-sm font-medium text-emerald-600">
              ¡Completaste todos tus hábitos de hoy! 🎉
            </div>
          ) : (
            <ul className="space-y-2">
              {pendingHabits.slice(0, 4).map((h) => {
                const streak = currentStreak(h)
                return (
                  <li key={h.id} className="card flex items-center gap-3 p-3">
                    <button onClick={() => toggleHabit(h.id)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 text-transparent transition hover:border-brand-400 hover:text-brand-400 active:scale-90 dark:border-slate-600">
                      <Check size={18} strokeWidth={3} />
                    </button>
                    <span className="flex-1 text-sm font-medium">{h.title}</span>
                    {streak > 0 && <span className="text-xs font-semibold text-orange-500">🔥 {streak}</span>}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
