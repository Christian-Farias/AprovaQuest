import type { AprovaQuestDatabase } from '@/shared/db/database'
import { getDb } from '@/shared/db/database'
import { parseOrThrow } from '@/shared/db/validate'
import { attemptSchema } from '@/modules/questions/domain/schemas'
import type { Attempt } from '@/shared/db/types'
import { compareIso } from '@/shared/lib/dates'

/**
 * Repositório de tentativas. O histórico é imutável:
 * apenas inserções são expostas — nunca atualização ou remoção.
 */
export function createAttemptsRepo(db: AprovaQuestDatabase = getDb()) {
  async function insertAttempt(attempt: Attempt): Promise<Attempt> {
    const record = parseOrThrow(attemptSchema, attempt, 'tentativa')
    await db.attempts.add(record)
    return record
  }

  async function listByQuestion(questionId: string): Promise<Attempt[]> {
    const attempts = await db.attempts.where('questionId').equals(questionId).toArray()
    return attempts.sort(
      (a, b) =>
        compareIso(a.answeredAt, b.answeredAt) ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    )
  }

  async function listAll(): Promise<Attempt[]> {
    return db.attempts.toArray()
  }

  async function latestByQuestion(questionId: string): Promise<Attempt | undefined> {
    const attempts = await listByQuestion(questionId)
    return attempts.at(-1)
  }

  async function countAll(): Promise<number> {
    return db.attempts.count()
  }

  return {
    insertAttempt,
    listByQuestion,
    listAll,
    latestByQuestion,
    countAll,
  }
}

export type AttemptsRepo = ReturnType<typeof createAttemptsRepo>
