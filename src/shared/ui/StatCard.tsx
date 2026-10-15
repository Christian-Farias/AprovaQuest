import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export function StatCard({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string
  value: ReactNode
  hint?: string
  tone?: 'neutral' | 'accent' | 'danger' | 'ok' | 'brand'
}) {
  const toneClass = {
    neutral: 'text-mist-100',
    accent: 'text-accent-300',
    danger: 'text-danger-400',
    ok: 'text-ok-400',
    brand: 'text-brand-400',
  }[tone]

  return (
    <div className="aq-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</p>
      <p className={cn('mt-1 text-2xl font-semibold tabular-nums', toneClass)}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-400">{hint}</p> : null}
    </div>
  )
}
