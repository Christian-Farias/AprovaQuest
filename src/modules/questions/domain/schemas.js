import { z } from 'zod';
import { isValidIso } from '@/shared/lib/dates';
import { isUuid } from '@/shared/lib/ids';
import { validateOptionSet } from './rules';
export const isoString = z.string().refine(isValidIso, 'Data inválida (esperado ISO 8601)');
export const uuid = z.string().refine(isUuid, 'Identificador inválido (esperado UUID)');
export const nonEmpty = (label) => z.string().trim().min(1, `${label} é obrigatório`);
export const questionTypeSchema = z.enum(['multiple_choice', 'true_false']);
export const questionStatusSchema = z.enum(['active', 'archived']);
export const attemptOutcomeSchema = z.enum(['correct', 'incorrect', 'unanswered']);
export const errorCategorySchema = z.enum([
    'falta_conhecimento',
    'interpretacao',
    'desatencao',
    'confusao_conceitual',
]);
export const reviewStatusSchema = z.enum(['pending', 'done', 'postponed', 'cancelled']);
// Asserções de tipo em tempo de compilação: enum do Zod deve cobrir a união do domínio.
const _qType = 'multiple_choice';
const _qStatus = 'active';
const _outcome = 'unanswered';
const _cat = 'desatencao';
const _rev = 'postponed';
void [_qType, _qStatus, _outcome, _cat, _rev];
export const disciplineSchema = z.object({
    id: uuid,
    name: nonEmpty('Nome da disciplina'),
    color: z.string().nullable().optional().default(null),
    createdAt: isoString,
    updatedAt: isoString,
});
export const topicSchema = z.object({
    id: uuid,
    disciplineId: uuid,
    name: nonEmpty('Nome do assunto'),
    createdAt: isoString,
    updatedAt: isoString,
});
export const boardSchema = z.object({
    id: uuid,
    name: nonEmpty('Nome da banca'),
    createdAt: isoString,
});
export const contestSchema = z.object({
    id: uuid,
    name: nonEmpty('Nome do concurso'),
    year: z.number().int().nullable().optional().default(null),
    createdAt: isoString,
});
export const optionSchema = z.object({
    id: uuid,
    questionId: uuid,
    order: z.number().int().min(0),
    label: nonEmpty('Rótulo da alternativa'),
    text: z.string(),
    isCorrect: z.boolean(),
    archived: z.boolean(),
    createdAt: isoString,
});
export const questionSchema = z.object({
    id: uuid,
    type: questionTypeSchema,
    statement: nonEmpty('Enunciado'),
    disciplineId: uuid,
    topicId: uuid.nullable(),
    boardId: uuid.nullable(),
    contestId: uuid.nullable(),
    source: z.string().nullable(),
    explanation: z.string().nullable(),
    tags: z.array(z.string()),
    status: questionStatusSchema,
    annulled: z.boolean(),
    answerConfirmed: z.boolean(),
    createdAt: isoString,
    updatedAt: isoString,
});
export const attemptSchema = z.object({
    id: uuid,
    questionId: uuid,
    selectedOptionId: uuid.nullable(),
    selectedLabel: z.string().nullable(),
    outcome: attemptOutcomeSchema,
    durationMs: z.number().int().min(0).nullable(),
    answeredAt: isoString,
});
const optionInputSchema = z.object({
    id: uuid.optional(),
    label: nonEmpty('Rótulo da alternativa'),
    text: z.string(),
    isCorrect: z.boolean(),
});
const createQuestionBase = z.object({
    type: questionTypeSchema,
    statement: nonEmpty('Enunciado'),
    disciplineId: uuid,
    topicId: uuid.nullable().optional().default(null),
    boardId: uuid.nullable().optional().default(null),
    contestId: uuid.nullable().optional().default(null),
    source: z.string().nullable().optional().default(null),
    explanation: z.string().nullable().optional().default(null),
    tags: z.array(z.string().trim().min(1)).optional().default([]),
    options: z.array(optionInputSchema),
    answerConfirmed: z.boolean().optional().default(true),
});
export const createQuestionInputSchema = createQuestionBase.superRefine((input, ctx) => {
    const message = validateOptionSet(input.type, input.options, input.answerConfirmed);
    if (message) {
        ctx.addIssue({ code: 'custom', path: ['options'], message });
    }
});
