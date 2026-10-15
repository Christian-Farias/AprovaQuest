import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getDb } from '@/shared/db/database'
import { computeStreak, type StreakResult } from '../domain/streak'

/**
 * Hook reativo que calcula a sequência de estudos em tempo real.
 * Atualiza automaticamente sempre que uma nova tentativa é registrada.
 */
export function useStreak(): StreakResult | undefined {
  const attempts = useLiveQuery(() => getDb().attempts.toArray(), [])

  return useMemo(() => {
    if (attempts === undefined) return undefined
    return computeStreak(attempts)
  }, [attempts])
}
