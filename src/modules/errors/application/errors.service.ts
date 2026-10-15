import type { AprovaQuestDatabase } from '@/shared/db/database'
import { getDb } from '@/shared/db/database'
import { toResult } from '@/shared/lib/async'
import { type Result } from '@/shared/lib/result'
import { createErrorsRepo, type CreateErrorNoteInput } from '../data/errors.repo'
import type { ErrorNote } from '@/shared/db/types'
import type { Clock } from '@/shared/lib/dates'

export function createErrorsService(db: AprovaQuestDatabase = getDb()) {
  const repo = createErrorsRepo(db)

  async function createErrorNote(input: CreateErrorNoteInput, clock?: Clock): Promise<Result<ErrorNote>> {
    return toResult(async () => repo.addErrorNote(input, clock))
  }

  async function listErrorNotes(): Promise<Result<ErrorNote[]>> {
    return toResult(async () => repo.listErrorNotes())
  }

  async function resolveErrorNote(id: string, clock?: Clock): Promise<Result<void>> {
    return toResult(async () => repo.resolveErrorNote(id, true, clock))
  }

  return { createErrorNote, listErrorNotes, resolveErrorNote }
}

export type ErrorsService = ReturnType<typeof createErrorsService>
