import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-card border border-dashed border-ink-600 bg-ink-850/60 px-6 py-12 text-center',
        className,
      )}
    >
      {icon ? <div className="mb-3 text-3xl text-ink-400">{icon}</div> : null}
      <h3 className="text-base font-semibold text-mist-100">{title}</h3>
      {description ? <p className="mt-1 max-w-md text-sm text-ink-300">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
