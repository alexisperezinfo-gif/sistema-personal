import { clampPercent } from '../lib/format'

interface Props {
  percent: number
  size?: 'sm' | 'lg'
  achieved?: boolean
}

export default function ProgressBar({ percent, size = 'sm', achieved }: Props) {
  const p = clampPercent(percent)
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 ${
        size === 'lg' ? 'h-4' : 'h-2.5'
      }`}
    >
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${
          achieved
            ? 'bg-gradient-to-r from-emerald-500 to-green-500'
            : 'bg-gradient-to-r from-brand-500 to-brand-600'
        }`}
        style={{ width: `${p}%` }}
      />
    </div>
  )
}
