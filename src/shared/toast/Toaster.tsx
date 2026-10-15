import { cn } from '@/shared/lib/cn'
import type { ToastTone } from './toast-context'
import { useToast } from './useToast'

const tones: Record<ToastTone, string> = {
  info: 'border-ink-600 bg-ink-800 text-mist-100',
  success: 'border-ok-500/50 bg-ok-500/15 text-ok-400',
  error: 'border-danger-500/50 bg-danger-500/15 text-danger-400',
}

export function Toaster() {
  const { toasts, dismiss } = useToast()
  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-4 sm:items-end"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            'pointer-events-auto w-full max-w-sm rounded-lg border px-4 py-3 shadow-lg',
            tones[toast.tone],
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description ? (
                <p className="mt-0.5 text-xs opacity-90">{toast.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Fechar aviso"
              className="text-xs opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
