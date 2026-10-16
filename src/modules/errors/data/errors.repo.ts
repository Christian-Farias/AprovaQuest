import { newId } from '@/shared/lib/ids'
import { nowIso, addDays, type Clock } from '@/shared/lib/dates'
import { domainError } from '@/shared/db/errors'
import type { ErrorNote, Review, ErrorCategory } from '@/shared/db/types'
import type { AprovaQuestDatabase } from '@/shared/db/database'
import { getDb } from '@/shared/db/database'

const REVIEW_SCHEDULE = [1, 7, 30] as const

export interface CreateErrorNoteInput {
  questionId: string
  attemptId?: string | null
  category: ErrorCategory
  note?: string
  explanation?: string
}

export function createErrorsRepo(db: AprovaQuestDatabase = getDb()) {
  async function addErrorNote(input: CreateErrorNoteInput, clock?: Clock): Promise<ErrorNote> {
    const at = nowIso(clock)
    const note: ErrorNote = {
      id: newId(),
      questionId: input.questionId,
      attemptId: input.attemptId ?? null,
      category: input.category,
      note: input.note ?? '',
      explanation: input.explanation ?? '',
      resolved: false,
      createdAt: at,
      updatedAt: at,
    }
    await db.errorNotes.put(note)
    return note
  }

  async function listErrorNotes(): Promise<ErrorNote[]> {
    return db.errorNotes.toArray()
  }

  async function getErrorNote(id: string): Promise<ErrorNote | undefined> {
    return db.errorNotes.get(id)
  }

  async function resolveErrorNote(id: string, resolved = true, clock?: Clock): Promise<void> {
    await db.transaction('rw', db.errorNotes, db.reviews, async () => {
      const note = await db.errorNotes.get(id)
      if (!note) throw domainError('not_found', 'Nota de erro não encontrada.')
      const next: ErrorNote = { ...note, resolved, updatedAt: nowIso(clock) }
      await db.errorNotes.put(next)
    })
  }

  async function deleteErrorNote(id: string): Promise<void> {
    await db.errorNotes.delete(id)
  }

  return { addErrorNote, listErrorNotes, getErrorNote, resolveErrorNote, deleteErrorNote }
}

export function scheduleReviewsForError(errorNoteId: string, baseDateIso: string, clock?: Clock): Review[] {
  const at = nowIso(clock)
  return REVIEW_SCHEDULE.map((offset) => ({
    id: newId(),
    questionId: '',
    offsetDays: offset,
    status: 'pending' as const,
    dueAt: addDays(baseDateIso, offset),
    postponedTo: null,
    completedAt: null,
    sourceErrorNoteId: errorNoteId,
    createdAt: at,
    updatedAt: at,
  }))
}