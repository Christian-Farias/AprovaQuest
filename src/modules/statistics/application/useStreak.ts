import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getDb } from '@/shared/db/database'
import { DEFAULT_DAILY_GOAL, SETTING_KEYS } from '@/shared/db/settings'
import { computeStreak, type StreakResult } from '../domain/streak'

/**
 * Hook reativo que calcula a sequência de estudos em tempo real.
 * Atualiza automaticamente sempre que uma nova tentativa é registrada
 * ou quando a meta diária é alterada nas configurações.
 */
export function useStreak(): StreakResult | undefined {
  const attempts = useLiveQuery(() => getDb().attempts.toArray(), [])
  const goal = useLiveQuery(
    () => getDb().settings.get(SETTING_KEYS.dailyGoal).then((s) => s?.value),
    [],
  )

  return useMemo(() => {
    if (attempts === undefined) return undefined
    const effectiveGoal =
      typeof goal === 'number' && goal > 0 ? goal : DEFAULT_DAILY_GOAL
    return computeStreak(attempts, new Date(), effectiveGoal)
  }, [attempts, goal])
}
