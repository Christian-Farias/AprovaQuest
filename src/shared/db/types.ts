export type QuestionType = 'multiple_choice' | 'true_false'
export type QuestionStatus = 'active' | 'archived'
export type AttemptOutcome = 'correct' | 'incorrect' | 'unanswered'
export type ErrorCategory =
  | 'falta_conhecimento'
  | 'interpretacao'
  | 'desatencao'
  | 'confusao_conceitual'
export type ReviewStatus = 'pending' | 'done' | 'postponed' | 'cancelled'
export type SessionType = 'theory' | 'questions' | 'review'
export type SessionStatus = 'planned' | 'done' | 'skipped' | 'moved'
export type ImportStatus =
  | 'pending'
  | 'validating'
  | 'extracting'
  | 'ocr'
  | 'parsing'
  | 'review'
  | 'saving'
  | 'completed'
  | 'failed'
  | 'cancelled'
export type PlanStatus = 'active' | 'archived'
export type GoalType = 'weekly_minutes' | 'weekly_questions' | 'edital_topic'

export interface Discipline {
  id: string
  name: string
  color?: string | null
  createdAt: string
  updatedAt: string
}

export interface Topic {
  id: string
  disciplineId: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface Board {
  id: string
  name: string
  createdAt: string
}

export interface Contest {
  id: string
  name: string
  year?: number | null
  createdAt: string
}

export interface Question {
  id: string
  type: QuestionType
  statement: string
  disciplineId: string
  topicId: string | null
  boardId: string | null
  contestId: string | null
  source: string | null
  explanation: string | null
  tags: string[]
  status: QuestionStatus
  annulled: boolean
  answerConfirmed: boolean
  createdAt: string
  updatedAt: string
}

export interface QuestionOption {
  id: string
  questionId: string
  order: number
  label: string
  text: string
  isCorrect: boolean
  archived: boolean
  createdAt: string
}

export interface Attempt {
  id: string
  questionId: string
  selectedOptionId: string | null
  selectedLabel: string | null
  outcome: AttemptOutcome
  durationMs: number | null
  answeredAt: string
}

export interface ErrorNote {
  id: string
  questionId: string
  attemptId: string | null
  category: ErrorCategory
  note: string
  explanation: string
  resolved: boolean
  createdAt: string
  updatedAt: string
}

export interface Review {
  id: string
  questionId: string
  offsetDays: number
  status: ReviewStatus
  dueAt: string
  postponedTo: string | null
  completedAt: string | null
  sourceErrorNoteId: string | null
  createdAt: string
  updatedAt: string
}

export interface StudySession {
  id: string
  planId: string | null
  type: SessionType
  disciplineId: string | null
  topicId: string | null
  title: string
  plannedDurationMin: number
  actualDurationMin: number | null
  status: SessionStatus
  scheduledAt: string
  completedAt: string | null
  priorityReason: string
  createdAt: string
  updatedAt: string
}

export interface Plan {
  id: string
  name: string
  status: PlanStatus
  examDate: string | null
  createdAt: string
  updatedAt: string
}

export interface Availability {
  id: string
  planId: string
  weekday: number
  minutes: number
}

export interface PlanGoal {
  id: string
  planId: string
  type: GoalType
  disciplineId: string | null
  topicId: string | null
  label: string
  target: number
  weight: number | null
}

export interface ImportRecord {
  id: string
  fileName: string
  fileSize: number
  status: ImportStatus
  progress: number
  totalPages: number
  textPages: number
  ocrPages: number
  needsReview: number
  extractedCount: number
  validatedCount: number
  rejectedCount: number
  importedCount: number
  errorMessage: string | null
  hasBlob: boolean
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

export interface ImportPage {
  id: string
  importId: string
  pageNumber: number
  needsOcr: boolean
  charCount: number
  text: string
  createdAt: string
}

/** Blob do PDF temporário, usado apenas para retomar importações interrompidas. */
export interface ImportFile {
  importId: string
  fileName: string
  fileSize: number
  blob: Blob
  createdAt: string
}

export interface Setting {
  key: string
  value: unknown
  updatedAt: string
}
