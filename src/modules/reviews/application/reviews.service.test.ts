import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { freshDb, disposeDb } from '@/test/db'
import type { AprovaQuestDatabase } from '@/shared/db/database'
import { createReviewsService } from './reviews.service'

describe('reviews.service', () => {
  let db: AprovaQuestDatabase
  let service: ReturnType<typeof createReviewsService>

  beforeEach(async () => {
    db = await freshDb()
    service = createReviewsService(db)
  })

  afterEach(async () => {
    await disposeDb(db)
  })

  it('agenda revisões de 1, 7 e 30 dias para uma questão', async () => {
    const res = await service.scheduleReviews('question-123')
    expect(res.ok).toBe(true)
    if (!res.ok) return

    expect(res.value).toHaveLength(3)
    expect(res.value[0].offsetDays).toBe(1)
    expect(res.value[1].offsetDays).toBe(7)
    expect(res.value[2].offsetDays).toBe(30)

    const stored = await db.reviews.where('questionId').equals('question-123').toArray()
    expect(stored).toHaveLength(3)
  })

  it('marca revisão como concluída', async () => {
    const res = await service.scheduleReviews('question-456')
    if (!res.ok) throw new Error('Falha ao agendar')
    const firstReview = res.value[0]

    const markRes = await service.markReview(firstReview.id, 'done')
    expect(markRes.ok).toBe(true)

    const inDb = await db.reviews.get(firstReview.id)
    expect(inDb?.status).toBe('done')
    expect(inDb?.completedAt).toBeTruthy()
  })

  it('adia uma revisão por N dias', async () => {
    const res = await service.scheduleReviews('question-789')
    if (!res.ok) throw new Error('Falha ao agendar')
    const firstReview = res.value[0]

    const postponeRes = await service.markReview(firstReview.id, 'postponed', 2)
    expect(postponeRes.ok).toBe(true)

    const inDb = await db.reviews.get(firstReview.id)
    expect(inDb?.status).toBe('postponed')
    expect(inDb?.postponedTo).toBeTruthy()
  })
})
