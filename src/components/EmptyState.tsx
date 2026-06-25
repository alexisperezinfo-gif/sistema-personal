import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}

export default function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
        <Icon size={30} />
      </div>
      <h3 className="mb-1 text-base font-semibold">{title}</h3>
      <p className="mb-5 max-w-xs text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {action}
    </div>
  )
}
