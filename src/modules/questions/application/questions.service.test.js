import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDb } from '@/shared/db/database';
import { createQuestionsService } from './questions.service';
import { createTaxonomyService } from './taxonomy.service';
import { freshDb, disposeDb } from '@/test/db';
const clock = () => new Date('2024-03-01T09:00:00.000Z');
describe('motor de questões (persistência)', () => {
    let db;
    let questions;
    let taxonomy;
    let disciplineId;
    beforeEach(async () => {
        db = await freshDb();
        questions = createQuestionsService(db);
        taxonomy = createTaxonomyService(db);
        const discipline = await taxonomy.createDiscipline({ name: 'Português' }, clock);
        if (!discipline.ok)
            throw new Error('falha ao criar disciplina');
        disciplineId = discipline.value.id;
    });
    afterEach(async () => {
        await disposeDb(db);
    });
    it('cria e persiste uma questão de múltipla escolha', async () => {
        const result = await questions.createQuestion({
            type: 'multiple_choice',
            statement: 'Qual é a capital do Brasil?',
            disciplineId,
            options: [
                { label: 'A', text: 'Rio de Janeiro', isCorrect: false },
                { label: 'B', text: 'Brasília', isCorrect: true },
                { label: 'C', text: 'Salvador', isCorrect: false },
            ],
        }, clock);
        expect(result.ok).toBe(true);
        if (!result.ok)
            return;
        expect(result.value.question.answerConfirmed).toBe(true);
        expect(result.value.options).toHaveLength(3);
        expect(result.value.options.filter((o) => o.isCorrect)).toHaveLength(1);
        const listed = await questions.listQuestions();
        expect(listed.ok && listed.value).toHaveLength(1);
    });
    it('exige exatamente uma alternativa correta quando o gabarito é confirmado', async () => {
        const result = await questions.createQuestion({
            type: 'multiple_choice',
            statement: 'Sem gabarito definido',
            disciplineId,
            answerConfirmed: true,
            options: [
                { label: 'A', text: 'x', isCorrect: false },
                { label: 'B', text: 'y', isCorrect: false },
            ],
        }, clock);
        expect(result.ok).toBe(false);
        if (!result.ok)
            expect(result.error.code).toBe('validation');
    });
    it('permite rascunho com gabarito não confirmado', async () => {
        const result = await questions.createQuestion({
            type: 'multiple_choice',
            statement: 'Rascunho',
            disciplineId,
            answerConfirmed: false,
            options: [
                { label: 'A', text: 'x', isCorrect: false },
                { label: 'B', text: 'y', isCorrect: false },
            ],
        }, clock);
        expect(result.ok).toBe(true);
        if (result.ok)
            expect(result.value.question.answerConfirmed).toBe(false);
    });
    it('registra tentativas sem sobrescrever o histórico', async () => {
        const created = await questions.createQuestion({
            type: 'true_false',
            statement: 'A Terra é plana.',
            disciplineId,
            options: [
                { label: 'C', text: 'Certo', isCorrect: false },
                { label: 'E', text: 'Errado', isCorrect: true },
            ],
        }, clock);
        if (!created.ok)
            throw new Error('questão não criada');
        const { question, options } = created.value;
        const first = await questions.answerQuestion({
            questionId: question.id,
            selectedOptionId: options[0].id,
            durationMs: 1000,
            clock: () => new Date('2024-03-01T09:00:00.000Z'),
        });
        const second = await questions.answerQuestion({
            questionId: question.id,
            selectedOptionId: options[1].id,
            durationMs: 2000,
            clock: () => new Date('2024-03-01T09:05:00.000Z'),
        });
        expect(first.ok && first.value.outcome).toBe('incorrect');
        expect(second.ok && second.value.outcome).toBe('correct');
        const attempts = await questions.listAttempts(question.id);
        expect(attempts.ok && attempts.value).toHaveLength(2);
        if (attempts.ok) {
            expect(attempts.value.map((a) => a.outcome)).toEqual(['incorrect', 'correct']);
        }
    });
    it('bloqueia tentativa em questão com gabarito não confirmado', async () => {
        const created = await questions.createQuestion({
            type: 'multiple_choice',
            statement: 'Sem gabarito',
            disciplineId,
            answerConfirmed: false,
            options: [
                { label: 'A', text: 'x', isCorrect: false },
                { label: 'B', text: 'y', isCorrect: false },
            ],
        }, clock);
        if (!created.ok)
            throw new Error('questão não criada');
        const answer = await questions.answerQuestion({
            questionId: created.value.question.id,
            selectedOptionId: created.value.options[0].id,
        });
        expect(answer.ok).toBe(false);
    });
    it('edita a questão preservando o histórico e arquivando alternativas removidas', async () => {
        const created = await questions.createQuestion({
            type: 'multiple_choice',
            statement: 'Enunciado original',
            disciplineId,
            options: [
                { label: 'A', text: 'a', isCorrect: true },
                { label: 'B', text: 'b', isCorrect: false },
                { label: 'C', text: 'c', isCorrect: false },
            ],
        }, clock);
        if (!created.ok)
            throw new Error('questão não criada');
        const { question, options } = created.value;
        const removedOptionId = options[2].id;
        await questions.answerQuestion({
            questionId: question.id,
            selectedOptionId: options[0].id,
            clock,
        });
        const updated = await questions.updateQuestion(question.id, {
            type: 'multiple_choice',
            statement: 'Enunciado revisado',
            disciplineId,
            options: [
                { id: options[0].id, label: 'A', text: 'a2', isCorrect: true },
                { id: options[1].id, label: 'B', text: 'b2', isCorrect: false },
            ],
        }, clock);
        expect(updated.ok).toBe(true);
        const attempts = await questions.listAttempts(question.id);
        expect(attempts.ok && attempts.value).toHaveLength(1);
        const allOptions = await questions.getOptions(question.id, true);
        if (allOptions.ok) {
            const removed = allOptions.value.find((o) => o.id === removedOptionId);
            expect(removed?.archived).toBe(true);
        }
    });
    it('não exclui questão com tentativas e preserva histórico ao arquivar', async () => {
        const created = await questions.createQuestion({
            type: 'true_false',
            statement: 'Questão com histórico',
            disciplineId,
            options: [
                { label: 'C', text: 'Certo', isCorrect: true },
                { label: 'E', text: 'Errado', isCorrect: false },
            ],
        }, clock);
        if (!created.ok)
            throw new Error('questão não criada');
        const { question, options } = created.value;
        await questions.answerQuestion({
            questionId: question.id,
            selectedOptionId: options[0].id,
            clock,
        });
        const del = await questions.deleteQuestion(question.id);
        expect(del.ok).toBe(false);
        if (!del.ok)
            expect(del.error.code).toBe('conflict');
        const archived = await questions.archiveQuestion(question.id, clock);
        expect(archived.ok && archived.value.status).toBe('archived');
        const attempts = await questions.listAttempts(question.id);
        expect(attempts.ok && attempts.value).toHaveLength(1);
    });
    it('exclui questão sem tentativas junto com suas alternativas', async () => {
        const created = await questions.createQuestion({
            type: 'true_false',
            statement: 'Sem tentativas',
            disciplineId,
            options: [
                { label: 'C', text: 'Certo', isCorrect: true },
                { label: 'E', text: 'Errado', isCorrect: false },
            ],
        }, clock);
        if (!created.ok)
            throw new Error('questão não criada');
        const del = await questions.deleteQuestion(created.value.question.id);
        expect(del.ok).toBe(true);
        expect(await db.options.where('questionId').equals(created.value.question.id).count()).toBe(0);
        expect(await db.questions.get(created.value.question.id)).toBeUndefined();
    });
    it('mantém integridade referencial na taxonomia', async () => {
        const orphanTopic = await taxonomy.createTopic({ disciplineId: crypto.randomUUID(), name: 'Órfão' }, clock);
        expect(orphanTopic.ok).toBe(false);
        await taxonomy.createTopic({ disciplineId, name: 'Crase' }, clock);
        const delDiscipline = await taxonomy.deleteDiscipline(disciplineId);
        expect(delDiscipline.ok).toBe(false);
        if (!delDiscipline.ok)
            expect(delDiscipline.error.code).toBe('referential_integrity');
    });
    it('persiste após reabrir o banco (reinício do aplicativo)', async () => {
        await questions.createQuestion({
            type: 'true_false',
            statement: 'Persistência',
            disciplineId,
            options: [
                { label: 'C', text: 'Certo', isCorrect: true },
                { label: 'E', text: 'Errado', isCorrect: false },
            ],
        }, clock);
        const name = db.name;
        db.close();
        const reopened = createDb(name);
        await reopened.open();
        const service = createQuestionsService(reopened);
        const listed = await service.listQuestions();
        expect(listed.ok && listed.value).toHaveLength(1);
        reopened.close();
    });
});
