import type { ReactNode } from 'react'
import { Button } from './Button'

export function ErrorState({
  title = 'Algo deu errado',
  description,
  onRetry,
  action,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  action?: ReactNode
}) {
  return (
    <div
      role="alert"
      className="rounded-card border border-danger-500/40 bg-danger-500/10 px-5 py-6 text-center"
    >
      <h3 className="text-base font-semibold text-danger-400">{title}</h3>
      {description ? <p className="mx-auto mt-1 max-w-md text-sm text-mist-300">{description}</p> : null}
      {onRetry || action ? (
        <div className="mt-4 flex justify-center gap-2">
          {onRetry ? (
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Tentar novamente
            </Button>
          ) : null}
          {action}
        </div>
      ) : null}
    </div>
  )
}
