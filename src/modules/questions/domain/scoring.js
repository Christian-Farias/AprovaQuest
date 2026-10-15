import { nowIso } from '@/shared/lib/dates';
import { newId } from '@/shared/lib/ids';
import { err, ok } from '@/shared/lib/result';
/**
 * Avalia uma tentativa de forma pura e determinística.
 * Não grava nada — apenas decide o resultado. A gravação é responsabilidade
 * da camada de dados (sempre inserindo, nunca sobrescrevendo).
 */
export function evaluateAttempt(input) {
    const { question, options, selectedOptionId } = input;
    const durationMs = input.durationMs ?? null;
    if (question.annulled) {
        return err('validation', 'Esta questão está anulada e não pode ser respondida.');
    }
    if (!question.answerConfirmed) {
        return err('validation', 'O gabarito desta questão ainda não foi confirmado. Confirme-o antes de responder.');
    }
    if (durationMs !== null && (!Number.isFinite(durationMs) || durationMs < 0)) {
        return err('validation', 'Duração da tentativa inválida.');
    }
    const answeredAt = nowIso(input.clock);
    if (selectedOptionId === null) {
        return ok({
            id: input.id ?? newId(),
            questionId: question.id,
            selectedOptionId: null,
            selectedLabel: null,
            outcome: 'unanswered',
            durationMs,
            answeredAt,
        });
    }
    const option = options.find((o) => o.id === selectedOptionId);
    if (!option || option.questionId !== question.id) {
        return err('validation', 'Alternativa selecionada não pertence a esta questão.');
    }
    return ok({
        id: input.id ?? newId(),
        questionId: question.id,
        selectedOptionId: option.id,
        selectedLabel: option.label,
        outcome: option.isCorrect ? 'correct' : 'incorrect',
        durationMs,
        answeredAt,
    });
}
export function hasConfirmedAnswer(question, options) {
    if (!question.answerConfirmed)
        return false;
    return options.filter((o) => o.isCorrect).length === 1;
}
