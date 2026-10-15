import { segmentText } from '../domain/segmenter';
export function parsedQuestionToDraft(parsed, options) {
    const flags = parsed.flags;
    const answerConfirmed = parsed.answerLabel !== null && !flags.answerUnconfirmed;
    const optionsDraft = parsed.options.map((option) => ({
        label: option.label,
        text: option.text,
        isCorrect: parsed.answerLabel === option.label,
    }));
    // Se não confirmou e não marcou nenhuma, opções ficam com isCorrect false.
    const hasCorrect = optionsDraft.some((o) => o.isCorrect);
    const finalOptions = answerConfirmed && hasCorrect ? optionsDraft : optionsDraft.map((o) => ({ ...o, isCorrect: false }));
    return {
        statement: parsed.statement,
        options: finalOptions,
        answerConfirmed,
        disciplineId: options?.disciplineId ?? null,
        topicId: options?.topicId ?? null,
        boardId: null,
        contestId: null,
        source: options?.source ?? null,
        explanation: null,
        tags: [],
        flags,
        raw: parsed.raw,
    };
}
export function textsToDrafts(texts, options) {
    const drafts = [];
    for (const text of texts) {
        const parsed = segmentText(text);
        for (const p of parsed) {
            drafts.push(parsedQuestionToDraft(p, options));
        }
    }
    return drafts;
}
