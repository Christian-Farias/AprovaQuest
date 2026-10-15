import { getDb } from '@/shared/db/database';
import { domainError } from '@/shared/db/errors';
import { parseOrThrow } from '@/shared/db/validate';
import { createQuestionInputSchema, optionSchema, questionSchema, } from '@/modules/questions/domain/schemas';
import { validateOptionSet } from '@/modules/questions/domain/rules';
import { nowIso } from '@/shared/lib/dates';
import { newId } from '@/shared/lib/ids';
import { normalizeSkeleton, similarity } from '@/shared/lib/text';
const DUPLICATE_THRESHOLD = 0.82;
function toQuestionRecord(input, clock, existing) {
    const at = nowIso(clock);
    return questionSchema.parse({
        id: existing?.id ?? newId(),
        type: input.type,
        statement: input.statement.trim(),
        disciplineId: input.disciplineId,
        topicId: input.topicId ?? null,
        boardId: input.boardId ?? null,
        contestId: input.contestId ?? null,
        source: input.source ?? null,
        explanation: input.explanation ?? null,
        tags: input.tags ?? [],
        status: existing?.status ?? 'active',
        annulled: existing?.annulled ?? false,
        answerConfirmed: input.answerConfirmed ?? true,
        createdAt: existing?.createdAt ?? at,
        updatedAt: at,
    });
}
export function createQuestionsRepo(db = getDb()) {
    async function listQuestions(filter = {}) {
        const all = await db.questions.orderBy('createdAt').reverse().toArray();
        return all.filter((q) => {
            if (filter.disciplineId && q.disciplineId !== filter.disciplineId)
                return false;
            if (filter.topicId && q.topicId !== filter.topicId)
                return false;
            if (filter.type && q.type !== filter.type)
                return false;
            if (filter.status && q.status !== filter.status)
                return false;
            return true;
        });
    }
    async function getQuestion(id) {
        return db.questions.get(id);
    }
    async function getOptions(questionId, includeArchived = false) {
        const options = await db.options.where('questionId').equals(questionId).sortBy('order');
        return includeArchived ? options : options.filter((o) => !o.archived);
    }
    async function getQuestionWithOptions(id, includeArchived = false) {
        const question = await db.questions.get(id);
        if (!question)
            return undefined;
        const options = await getOptions(id, includeArchived);
        return { question, options };
    }
    async function createQuestion(input, clock) {
        const parsed = parseOrThrow(createQuestionInputSchema, input, 'questão');
        return db.transaction('rw', db.questions, db.options, async () => {
            const question = toQuestionRecord(parsed, clock);
            const at = nowIso(clock);
            const options = parsed.options.map((option, index) => optionSchema.parse({
                id: newId(),
                questionId: question.id,
                order: index,
                label: option.label,
                text: option.text,
                isCorrect: option.isCorrect,
                archived: false,
                createdAt: at,
            }));
            await db.questions.add(question);
            await db.options.bulkAdd(options);
            return { question, options };
        });
    }
    async function updateQuestion(id, input, clock) {
        return db.transaction('rw', db.questions, db.options, async () => {
            const existing = await db.questions.get(id);
            if (!existing)
                throw domainError('not_found', 'Questão não encontrada.');
            const parsed = parseOrThrow(createQuestionInputSchema, input, 'questão');
            const activeInputs = parsed.options;
            const ruleError = validateOptionSet(parsed.type, activeInputs.map((o) => ({ label: o.label, text: o.text, isCorrect: o.isCorrect })), parsed.answerConfirmed ?? true);
            if (ruleError)
                throw domainError('validation', ruleError);
            const at = nowIso(clock);
            const currentOptions = await db.options.where('questionId').equals(id).toArray();
            const byId = new Map(currentOptions.map((o) => [o.id, o]));
            const keptIds = new Set();
            const nextOptions = [];
            activeInputs.forEach((option, index) => {
                if (option.id) {
                    const current = byId.get(option.id);
                    if (!current) {
                        throw domainError('referential_integrity', 'Alternativa informada não existe.');
                    }
                    keptIds.add(option.id);
                    nextOptions.push(optionSchema.parse({
                        ...current,
                        order: index,
                        label: option.label,
                        text: option.text,
                        isCorrect: option.isCorrect,
                        archived: false,
                    }));
                }
                else {
                    nextOptions.push(optionSchema.parse({
                        id: newId(),
                        questionId: id,
                        order: index,
                        label: option.label,
                        text: option.text,
                        isCorrect: option.isCorrect,
                        archived: false,
                        createdAt: at,
                    }));
                }
            });
            // Alternativas removidas são arquivadas (não excluídas) para preservar o
            // histórico de tentativas que as referenciam.
            const archived = currentOptions
                .filter((o) => !keptIds.has(o.id) && !o.archived)
                .map((o) => optionSchema.parse({ ...o, archived: true }));
            const question = toQuestionRecord(parsed, clock, existing);
            await db.questions.put(question);
            await db.options.bulkPut([...nextOptions, ...archived]);
            const options = await getOptions(id);
            return { question, options };
        });
    }
    async function archiveQuestion(id, clock) {
        return db.transaction('rw', db.questions, async () => {
            const current = await db.questions.get(id);
            if (!current)
                throw domainError('not_found', 'Questão não encontrada.');
            const next = questionSchema.parse({
                ...current,
                status: 'archived',
                updatedAt: nowIso(clock),
            });
            await db.questions.put(next);
            return next;
        });
    }
    async function unarchiveQuestion(id, clock) {
        return db.transaction('rw', db.questions, async () => {
            const current = await db.questions.get(id);
            if (!current)
                throw domainError('not_found', 'Questão não encontrada.');
            const next = questionSchema.parse({
                ...current,
                status: 'active',
                updatedAt: nowIso(clock),
            });
            await db.questions.put(next);
            return next;
        });
    }
    async function setAnnulled(id, annulled, clock) {
        return db.transaction('rw', db.questions, async () => {
            const current = await db.questions.get(id);
            if (!current)
                throw domainError('not_found', 'Questão não encontrada.');
            const next = questionSchema.parse({ ...current, annulled, updatedAt: nowIso(clock) });
            await db.questions.put(next);
            return next;
        });
    }
    async function deleteQuestion(id) {
        await db.transaction('rw', db.questions, db.options, db.attempts, async () => {
            const attemptCount = await db.attempts.where('questionId').equals(id).count();
            if (attemptCount > 0) {
                throw domainError('conflict', 'Esta questão possui tentativas registradas. Arquive-a em vez de excluir para preservar o histórico.');
            }
            await db.options.where('questionId').equals(id).delete();
            await db.questions.delete(id);
        });
    }
    async function countByStatus(status) {
        return db.questions.where('status').equals(status).count();
    }
    /**
     * Sinaliza questões semelhantes. Nunca remove automaticamente.
     */
    async function findPotentialDuplicates(statement, options = {}) {
        const threshold = options.threshold ?? DUPLICATE_THRESHOLD;
        const skeleton = normalizeSkeleton(statement);
        if (skeleton.length === 0)
            return [];
        const all = await db.questions.toArray();
        const candidates = [];
        for (const question of all) {
            if (question.id === options.excludeId)
                continue;
            if (normalizeSkeleton(question.statement) === skeleton) {
                candidates.push({ questionId: question.id, statement: question.statement, similarity: 1 });
                continue;
            }
            const score = similarity(statement, question.statement);
            if (score >= threshold) {
                candidates.push({ questionId: question.id, statement: question.statement, similarity: score });
            }
        }
        return candidates.sort((a, b) => b.similarity - a.similarity);
    }
    return {
        listQuestions,
        getQuestion,
        getOptions,
        getQuestionWithOptions,
        createQuestion,
        updateQuestion,
        archiveQuestion,
        unarchiveQuestion,
        setAnnulled,
        deleteQuestion,
        countByStatus,
        findPotentialDuplicates,
    };
}
