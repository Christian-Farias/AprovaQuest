import { useLiveQuery } from 'dexie-react-hooks'
import { getDb } from '@/shared/db/database'
import { useMemo } from 'react'
import { newId } from '@/shared/lib/ids'
import { nowIso, addDays } from '@/shared/lib/dates'
import { toResult } from '@/shared/lib/async'
import type { Review, ReviewStatus } from '@/shared/db/types'
import type { Result } from '@/shared/lib/result'

const REVIEW_SCHEDULE_DAYS = [1, 7, 30] as const

// ── Hooks ─────────────────────────────────────────────────────

export function usePendingReviews() {
  return useLiveQuery(async () => {
    const db = getDb()
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)
    const allPending = await db.reviews.where('status').equals('pending').toArray()
    return allPending.filter((r) => new Date(r.dueAt) <= todayEnd)
  }, [])
}

export function useAllReviews() {
  return useLiveQuery(
    () => getDb().reviews.orderBy('dueAt').toArray(),
    [],
  )
}

// ── Service ───────────────────────────────────────────────────

export function createReviewsService(db = getDb()) {
  function scheduleReviews(questionId: string, errorNoteId?: string): Promise<Result<Review[]>> {
    return toResult(async () => {
      const at = nowIso()
      const reviews: Review[] = REVIEW_SCHEDULE_DAYS.map((offset) => ({
        id: newId(),
        questionId,
        offsetDays: offset,
        status: 'pending' as ReviewStatus,
        dueAt: addDays(at, offset),
        postponedTo: null,
        completedAt: null,
        sourceErrorNoteId: errorNoteId ?? null,
        createdAt: at,
        updatedAt: at,
      }))
      await db.reviews.bulkAdd(reviews)
      return reviews
    })
  }

  function markReview(id: string, status: 'done' | 'postponed' | 'cancelled', postponeDays = 1): Promise<Result<void>> {
    return toResult(async () => {
      const at = nowIso()
      const patch: Partial<Review> = { status, updatedAt: at }
      if (status === 'done') patch.completedAt = at
      if (status === 'postponed') patch.postponedTo = addDays(at, postponeDays)
      await db.reviews.update(id, patch)
    })
  }

  return { scheduleReviews, markReview }
}

export function useReviewsService() {
  const db = getDb()
  return useMemo(() => createReviewsService(db), [db])
}
