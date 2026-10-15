import type { StreakResult } from '@/modules/statistics/domain/streak'
import { DAILY_GOAL } from '@/modules/statistics/domain/streak'
import { useStreak } from '@/modules/statistics/application/useStreak'

/**
 * Exibe o foguinho de sequência no estilo Duolingo.
 * - Chama quando a sequência está ativa (fogo laranja pulsando).
 * - Cinza quando não há sequência.
 * - Mostra progresso diário (ex.: 7/10) abaixo do número.
 */
export function StreakBadge({ compact = false }: { compact?: boolean }) {
  const streak = useStreak()

  if (streak === undefined) return null

  const { current, todayCount, goal, completedToday } = streak
  const isAlive = current > 0
  const progressPct = Math.min((todayCount / goal) * 100, 100)

  if (compact) {
    // Versão compacta para topbar mobile
    return (
      <div className="flex items-center gap-1.5" title={`Sequência: ${current} dias`}>
        <FlameIcon alive={isAlive} size={20} />
        <span
          className={`text-sm font-bold tabular-nums ${isAlive ? 'text-orange-400' : 'text-ink-500'}`}
        >
          {current}
        </span>
      </div>
    )
  }

  // Versão completa para sidebar
  return (
    <div className="streak-widget rounded-xl border border-ink-700 bg-ink-800 p-3">
      <div className="flex items-center gap-2.5">
        <div className={`relative ${isAlive ? 'flame-pulse' : ''}`}>
          <FlameIcon alive={isAlive} size={28} />
          {completedToday && (
            <span className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-ok-500 text-[8px] font-bold text-ink-950">
              ✓
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1">
            <span
              className={`text-2xl font-extrabold tabular-nums leading-none ${
                isAlive ? 'text-orange-400' : 'text-ink-500'
              }`}
            >
              {current}
            </span>
            <span className={`text-xs font-medium ${isAlive ? 'text-orange-500/70' : 'text-ink-600'}`}>
              {current === 1 ? 'dia' : 'dias'}
            </span>
          </div>
          <p className={`text-[11px] leading-tight ${isAlive ? 'text-orange-500/60' : 'text-ink-600'}`}>
            sequência
          </p>
        </div>

        <div className="text-right">
          <span className={`text-xs font-semibold tabular-nums ${completedToday ? 'text-ok-400' : 'text-ink-400'}`}>
            {todayCount}/{goal}
          </span>
          <p className="text-[10px] text-ink-600 leading-tight">hoje</p>
        </div>
      </div>

      {/* Barra de progresso diária */}
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            completedToday ? 'bg-ok-500' : isAlive ? 'bg-orange-500' : 'bg-ink-600'
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {!completedToday && (
        <p className="mt-1.5 text-[10px] text-ink-500">
          {goal - todayCount} questões para manter a sequência
        </p>
      )}
      {completedToday && (
        <p className="mt-1.5 text-[10px] text-ok-500/70">Meta de hoje concluída! 🎉</p>
      )}
    </div>
  )
}

function FlameIcon({ alive, size = 24 }: { alive: boolean; size?: number }) {
  const color = alive ? '#fb923c' : '#3d5069'
  const innerColor = alive ? '#fde68a' : '#1f2b39'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      {/* Outer flame */}
      <path
        d="M12 2C12 2 6 8 6 13.5C6 16.8 8.7 19.5 12 19.5C15.3 19.5 18 16.8 18 13.5C18 8 12 2 12 2Z"
        fill={color}
        opacity={alive ? 1 : 0.5}
      />
      {/* Inner flame highlight */}
      <path
        d="M12 7C12 7 9 11 9 13.5C9 15.2 10.3 16.5 12 16.5C13.7 16.5 15 15.2 15 13.5C15 11 12 7 12 7Z"
        fill={innerColor}
        opacity={alive ? 0.9 : 0.4}
      />
    </svg>
  )
}

/** Card grande para a página do Painel */
export function StreakDashboardCard({ streak }: { streak: StreakResult }) {
  const { current, best, todayCount, goal, completedToday } = streak
  const isAlive = current > 0
  const progressPct = Math.min((todayCount / goal) * 100, 100)

  function motivationalMessage() {
    if (completedToday && current >= 7) return '🔥 Incrível! Você é imparável!'
    if (completedToday && current >= 3) return '⚡ Meta batida! Continue assim!'
    if (completedToday) return '✅ Meta de hoje concluída!'
    if (current > 0 && todayCount > 0) return `💪 Quase lá! ${goal - todayCount} questões restantes`
    if (current > 0) return `🎯 Não perca sua sequência de ${current} dias!`
    if (todayCount > 0) return `📚 Bom começo! ${goal - todayCount} questões para iniciar sua sequência`
    return '🚀 Responda 10 questões hoje para começar sua sequência!'
  }

  // Últimos 7 dias para o mini-calendário
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d
  })

  return (
    <div
      className={`mb-6 overflow-hidden rounded-2xl border ${
        isAlive
          ? 'border-orange-500/30 bg-gradient-to-br from-orange-950/40 via-ink-850 to-ink-850'
          : 'border-ink-700 bg-ink-850'
      }`}
    >
      <div className="flex items-start gap-4 p-4">
        {/* Flame hero */}
        <div
          className={`flex size-16 shrink-0 items-center justify-center rounded-2xl ${
            isAlive ? 'bg-orange-500/15 ring-1 ring-orange-500/30' : 'bg-ink-800 ring-1 ring-ink-700'
          } ${isAlive ? 'flame-pulse' : ''}`}
        >
          <FlameIcon alive={isAlive} size={38} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span
              className={`text-4xl font-black tabular-nums leading-none ${
                isAlive ? 'text-orange-400' : 'text-ink-500'
              }`}
            >
              {current}
            </span>
            <span className={`text-sm font-semibold ${isAlive ? 'text-orange-500/70' : 'text-ink-600'}`}>
              {current === 1 ? 'dia' : 'dias'} seguidos
            </span>
            {best > 0 && (
              <span className="ml-auto text-xs text-ink-500 shrink-0">
                recorde: {best}
              </span>
            )}
          </div>

          <p className={`mt-1 text-sm ${isAlive ? 'text-orange-200/80' : 'text-ink-400'}`}>
            {motivationalMessage()}
          </p>

          {/* Daily progress bar */}
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-ink-400">Progresso de hoje</span>
              <span className={`font-semibold tabular-nums ${completedToday ? 'text-ok-400' : 'text-ink-300'}`}>
                {todayCount}/{goal}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-ink-700">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  completedToday
                    ? 'bg-gradient-to-r from-ok-500 to-ok-400'
                    : isAlive
                      ? 'bg-gradient-to-r from-orange-600 to-orange-400'
                      : 'bg-ink-600'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mini-calendar: last 7 days */}
      <div className="border-t border-ink-700/60 px-4 py-3">
        <div className="flex items-center gap-1.5">
          {days.map((day, i) => {
            const isToday = i === 6
            // We only check completion status for visual; actual data comes from streak domain
            // For the calendar we show completed (green) vs active-today (orange progress) vs empty
            const isTodayCompleted = isToday && completedToday
            const isPastActivated = !isToday && i >= 6 - Math.min(current - (completedToday ? 1 : 0), 6)
            const isTodayInProgress = isToday && !completedToday && todayCount > 0

            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] text-ink-500">
                  {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][day.getDay()]}
                </span>
                <div
                  title={`${day.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric' })}`}
                  className={`flex size-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isTodayCompleted
                      ? 'bg-ok-500 text-ink-950 ring-2 ring-ok-400/50'
                      : isPastActivated
                        ? 'bg-orange-500 text-ink-950'
                        : isTodayInProgress
                          ? 'bg-orange-500/30 text-orange-300 ring-1 ring-orange-500/50'
                          : isToday
                            ? 'bg-ink-700 text-ink-300 ring-1 ring-ink-600'
                            : 'bg-ink-800 text-ink-600'
                  }`}
                >
                  {isTodayCompleted ? '🔥' : isPastActivated ? '🔥' : day.getDate()}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Re-export so other components can use
export { DAILY_GOAL }
