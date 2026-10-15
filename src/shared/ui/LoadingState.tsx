export function LoadingState({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-12 text-ink-300">
      <span
        aria-hidden
        className="size-5 animate-spin rounded-full border-2 border-ink-500 border-t-accent-400"
      />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="aq-card h-20 animate-pulse bg-ink-800" />
      ))}
    </div>
  )
}
