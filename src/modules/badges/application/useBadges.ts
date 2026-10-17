import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getDb } from '@/shared/db/database'
import { useStreak } from '@/modules/statistics/application/useStreak'
import { computeBadgeStats, computeBadges, type BadgeProgress, type BadgeStats } from '../domain/badges'
import { computeXp, levelFromXp } from './xp'

export interface BadgesSummary {
  stats: BadgeStats
  badges: BadgeProgress[]
  unlockedCount: number
  xp: number
  level: ReturnType<typeof levelFromXp>
}

export function useBadges(): BadgesSummary | undefined {
  const attempts = useLiveQuery(() => getDb().attempts.toArray(), [])
  const questions = useLiveQuery(() => getDb().questions.toArray(), [])
  const streak = useStreak()
  const currentStreak = streak?.current
  const bestStreak = streak?.best

  return useMemo(() => {
    if (attempts === undefined || questions === undefined || bestStreak === undefined) {
      return undefined
    }
    const stats = computeBadgeStats(attempts, questions, {
      current: currentStreak ?? 0,
      best: bestStreak,
    })
    const badges = computeBadges(stats)
    const xp = computeXp(attempts, questions, bestStreak)
    return {
      stats,
      badges,
      unlockedCount: badges.filter((b) => b.unlocked).length,
      xp,
      level: levelFromXp(xp),
    }
  }, [attempts, questions, currentStreak, bestStreak])
}
