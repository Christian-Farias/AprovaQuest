import { getDb } from '@/shared/db/database';
import { domainError } from '@/shared/db/errors';
import { evaluateAttempt } from '@/modules/questions/domain/scoring';
import { createQuestionsRepo } from '@/modules/questions/data/questions.repo';
import { createAttemptsRepo } from '@/modules/questions/data/attempts.repo';
import {} from '@/shared/lib/dates';
import { toResult } from '@/shared/lib/async';
import {} from '@/shared/lib/result';
export function createQuestionsService(db = getDb()) {
    const questions = createQuestionsRepo(db);
    const attempts = createAttemptsRepo(db);
    function listQuestions(filter = {}) {
        return toResult(() => questions.listQuestions(filter));
    }
    function getQuestion(id) {
        return toResult(() => questions.getQuestion(id));
    }
    function getOptions(questionId, includeArchived = false) {
        return toResult(() => questions.getOptions(questionId, includeArchived));
    }
    function getQuestionDetail(id) {
        return toResult(async () => {
            const question = await questions.getQuestion(id);
            if (!question)
                return undefined;
            const [options, history] = await Promise.all([
                questions.getOptions(id, true),
                attempts.listByQuestion(id),
            ]);
            return { question, options, attempts: history };
        });
    }
    function createQuestion(input, clock) {
        return toResult(() => questions.createQuestion(input, clock));
    }
    function updateQuestion(id, input, clock) {
        return toResult(() => questions.updateQuestion(id, input, clock));
    }
    function archiveQuestion(id, clock) {
        return toResult(() => questions.archiveQuestion(id, clock));
    }
    function unarchiveQuestion(id, clock) {
        return toResult(() => questions.unarchiveQuestion(id, clock));
    }
    function setAnnulled(id, annulled, clock) {
        return toResult(() => questions.setAnnulled(id, annulled, clock));
    }
    function deleteQuestion(id) {
        return toResult(() => questions.deleteQuestion(id));
    }
    function listAttempts(questionId) {
        return toResult(() => attempts.listByQuestion(questionId));
    }
    function findPotentialDuplicates(statement, options) {
        return toResult(() => questions.findPotentialDuplicates(statement, options));
    }
    /**
     * Avalia e grava uma tentativa dentro de uma transação.
     * A tentativa é sempre inserida; o histórico nunca é sobrescrito.
     */
    function answerQuestion(input) {
        return toResult(() => db.transaction('rw', db.questions, db.options, db.attempts, async () => {
            const question = await questions.getQuestion(input.questionId);
            if (!question)
                throw domainError('not_found', 'Questão não encontrada.');
            const options = await questions.getOptions(input.questionId, true);
            const evaluation = evaluateAttempt({
                question,
                options,
                selectedOptionId: input.selectedOptionId,
                durationMs: input.durationMs ?? null,
                clock: input.clock,
            });
            if (!evaluation.ok) {
                throw domainError(evaluation.error.code, evaluation.error.message);
            }
            await attempts.insertAttempt(evaluation.value);
            return evaluation.value;
        }));
    }
    return {
        listQuestions,
        getQuestion,
        getOptions,
        getQuestionDetail,
        createQuestion,
        updateQuestion,
        archiveQuestion,
        unarchiveQuestion,
        setAnnulled,
        deleteQuestion,
        listAttempts,
        findPotentialDuplicates,
        answerQuestion,
        // exposto para estatísticas/backup que precisam da mesma instância de banco
        db,
    };
}
