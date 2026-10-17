import { z } from 'zod'
import { isValidIso } from '@/shared/lib/dates'
import { isUuid } from '@/shared/lib/ids'
import type {
  AttemptOutcome,
  ErrorCategory,
  QuestionStatus,
  QuestionType,
  ReviewStatus,
} from '@/shared/db/types'
import { validateOptionSet } from './rules'

export const isoString = z.string().refine(isValidIso, 'Data inválida (esperado ISO 8601)')
export const uuid = z.string().refine(isUuid, 'Identificador inválido (esperado UUID)')
export const nonEmpty = (label: string) => z.string().trim().min(1, `${label} é obrigatório`)

export const questionTypeSchema = z.enum(['multiple_choice', 'true_false'])
export const questionStatusSchema = z.enum(['active', 'archived'])
export const attemptOutcomeSchema = z.enum(['correct', 'incorrect', 'unanswered'])
export const errorCategorySchema = z.enum([
  'falta_conhecimento',
  'interpretacao',
  'desatencao',
  'confusao_conceitual',
])
export const reviewStatusSchema = z.enum(['pending', 'done', 'postponed', 'cancelled'])

export type QuestionTypeInput = z.infer<typeof questionTypeSchema>
export type QuestionStatusInput = z.infer<typeof questionStatusSchema>
export type AttemptOutcomeInput = z.infer<typeof attemptOutcomeSchema>
export type ErrorCategoryInput = z.infer<typeof errorCategorySchema>
export type ReviewStatusInput = z.infer<typeof reviewStatusSchema>

// Asserções de tipo em tempo de compilação: enum do Zod deve cobrir a união do domínio.
const _qType: QuestionType = 'multiple_choice' satisfies QuestionTypeInput
const _qStatus: QuestionStatus = 'active' satisfies QuestionStatusInput
const _outcome: AttemptOutcome = 'unanswered' satisfies AttemptOutcomeInput
const _cat: ErrorCategory = 'desatencao' satisfies ErrorCategoryInput
const _rev: ReviewStatus = 'postponed' satisfies ReviewStatusInput
void [_qType, _qStatus, _outcome, _cat, _rev]

export const disciplineSchema = z.object({
  id: uuid,
  name: nonEmpty('Nome da disciplina'),
  color: z.string().nullable().optional().default(null),
  createdAt: isoString,
  updatedAt: isoString,
})

export const subjectSchema = z.object({
  id: uuid,
  disciplineId: uuid,
  name: nonEmpty('Nome do assunto'),
  createdAt: isoString,
  updatedAt: isoString,
})

export const topicSchema = z.object({
  id: uuid,
  disciplineId: uuid,
  subjectId: uuid.nullable().optional().default(null),
  name: nonEmpty('Nome do tópico'),
  createdAt: isoString,
  updatedAt: isoString,
})

export const boardSchema = z.object({
  id: uuid,
  name: nonEmpty('Nome da banca'),
  createdAt: isoString,
})

export const contestSchema = z.object({
  id: uuid,
  name: nonEmpty('Nome do concurso'),
  year: z.number().int().nullable().optional().default(null),
  createdAt: isoString,
})

export const optionSchema = z.object({
  id: uuid,
  questionId: uuid,
  order: z.number().int().min(0),
  label: nonEmpty('Rótulo da alternativa'),
  text: z.string(),
  isCorrect: z.boolean(),
  archived: z.boolean(),
  createdAt: isoString,
})

export const difficultySchema = z.union([z.literal(1), z.literal(2), z.literal(3)])

export const questionSchema = z.object({
  id: uuid,
  type: questionTypeSchema,
  statement: nonEmpty('Enunciado'),
  disciplineId: uuid,
  subjectId: uuid.nullable().optional().default(null),
  topicId: uuid.nullable(),
  boardId: uuid.nullable(),
  contestId: uuid.nullable(),
  source: z.string().nullable(),
  explanation: z.string().nullable(),
  tags: z.array(z.string()),
  difficulty: difficultySchema.optional().default(1),
  status: questionStatusSchema,
  annulled: z.boolean(),
  answerConfirmed: z.boolean(),
  createdAt: isoString,
  updatedAt: isoString,
})

export const attemptSchema = z.object({
  id: uuid,
  questionId: uuid,
  selectedOptionId: uuid.nullable(),
  selectedLabel: z.string().nullable(),
  outcome: attemptOutcomeSchema,
  durationMs: z.number().int().min(0).nullable(),
  answeredAt: isoString,
})

export type DisciplineEntity = z.infer<typeof disciplineSchema>
export type SubjectEntity = z.infer<typeof subjectSchema>
export type TopicEntity = z.infer<typeof topicSchema>
export type BoardEntity = z.infer<typeof boardSchema>
export type ContestEntity = z.infer<typeof contestSchema>
export type OptionEntity = z.infer<typeof optionSchema>
export type QuestionEntity = z.infer<typeof questionSchema>
export type AttemptEntity = z.infer<typeof attemptSchema>

export interface OptionInput {
  id?: string
  label: string
  text: string
  isCorrect: boolean
}

export interface CreateQuestionInput {
  type: QuestionType
  statement: string
  disciplineId: string
  subjectId?: string | null
  topicId?: string | null
  boardId?: string | null
  contestId?: string | null
  source?: string | null
  explanation?: string | null
  tags?: string[]
  difficulty?: 1 | 2 | 3
  options: OptionInput[]
  answerConfirmed?: boolean
}

export type UpdateQuestionInput = CreateQuestionInput

const optionInputSchema = z.object({
  id: uuid.optional(),
  label: nonEmpty('Rótulo da alternativa'),
  text: z.string(),
  isCorrect: z.boolean(),
})

const createQuestionBase = z.object({
  type: questionTypeSchema,
  statement: nonEmpty('Enunciado'),
  disciplineId: uuid,
  subjectId: uuid.nullable().optional().default(null),
  topicId: uuid.nullable().optional().default(null),
  boardId: uuid.nullable().optional().default(null),
  contestId: uuid.nullable().optional().default(null),
  source: z.string().nullable().optional().default(null),
  explanation: z.string().nullable().optional().default(null),
  tags: z.array(z.string().trim().min(1)).optional().default([]),
  difficulty: difficultySchema.optional().default(1),
  options: z.array(optionInputSchema),
  answerConfirmed: z.boolean().optional().default(true),
})

export const createQuestionInputSchema = createQuestionBase.superRefine((input, ctx) => {
  const message = validateOptionSet(input.type, input.options, input.answerConfirmed)
  if (message) {
    ctx.addIssue({ code: 'custom', path: ['options'], message })
  }
})
