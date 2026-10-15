import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

type Tone = 'neutral' | 'accent' | 'brand' | 'danger' | 'warn' | 'ok'

const tones: Record<Tone, string> = {
  neutral: 'bg-ink-750 text-mist-300',
  accent: 'bg-accent-600/20 text-accent-300',
  brand: 'bg-brand-600/20 text-brand-400',
  danger: 'bg-danger-500/20 text-danger-400',
  warn: 'bg-warn-500/20 text-warn-400',
  ok: 'bg-ok-500/20 text-ok-400',
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
