import type { ErrorCategory, ReviewStatus } from './types'

/**
 * Transformações puras usadas nas migrações do Dexie.
 * Mantidas fora da classe para permitir teste unitário direto.
 */

export interface ErrorNoteV1 {
  id: string
  questionId: string
  attemptId?: string | null
  resolved?: boolean
  createdAt: string
}

export interface ErrorNoteV2Fields {
  attemptId: string | null
  category: ErrorCategory
  note: string
  explanation: string
  resolved: boolean
  updatedAt: string
}

export function migrateErrorNoteV1ToV2(note: ErrorNoteV1): ErrorNoteV2Fields {
  return {
    attemptId: note.attemptId ?? null,
    category: 'falta_conhecimento',
    note: '',
    explanation: '',
    resolved: note.resolved ?? false,
    updatedAt: note.createdAt,
  }
}

export interface ReviewV1 {
  id: string
  questionId: string
  status?: ReviewStatus
  dueAt: string
  createdAt?: string
}

export interface ReviewV2Fields {
  offsetDays: number
  status: ReviewStatus
  postponedTo: string | null
  completedAt: string | null
  sourceErrorNoteId: string | null
  createdAt: string
  updatedAt: string
}

export function migrateReviewV1ToV2(review: ReviewV1): ReviewV2Fields {
  const createdAt = review.createdAt ?? review.dueAt
  const diffMs = Date.parse(review.dueAt) - Date.parse(createdAt)
  const offsetDays = Number.isFinite(diffMs) ? Math.max(0, Math.round(diffMs / 86_400_000)) : 0
  const status = review.status ?? 'pending'
  return {
    offsetDays,
    status,
    postponedTo: null,
    completedAt: status === 'done' ? review.dueAt : null,
    sourceErrorNoteId: null,
    createdAt,
    updatedAt: createdAt,
  }
}

export interface StudySessionV1 {
  priorityReason?: string
  scheduledAt: string
  createdAt?: string
}

export interface StudySessionV3Fields {
  priorityReason: string
  createdAt: string
  updatedAt: string
}

export function migrateStudySessionV1ToV3(session: StudySessionV1): StudySessionV3Fields {
  return {
    priorityReason: session.priorityReason ?? '',
    createdAt: session.createdAt ?? session.scheduledAt,
    updatedAt: session.createdAt ?? session.scheduledAt,
  }
}
