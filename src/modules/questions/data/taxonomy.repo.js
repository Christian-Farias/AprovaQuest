import { getDb } from '@/shared/db/database';
import { domainError } from '@/shared/db/errors';
import { boardSchema, contestSchema, disciplineSchema, topicSchema, } from '@/modules/questions/domain/schemas';
import { nowIso } from '@/shared/lib/dates';
import { newId } from '@/shared/lib/ids';
export function createTaxonomyRepo(db = getDb()) {
    async function listDisciplines() {
        const rows = await db.disciplines.orderBy('name').toArray();
        return rows;
    }
    async function getDiscipline(id) {
        return db.disciplines.get(id);
    }
    async function createDiscipline(input, clock) {
        const at = nowIso(clock);
        const record = disciplineSchema.parse({
            id: newId(),
            name: input.name.trim(),
            color: input.color ?? null,
            createdAt: at,
            updatedAt: at,
        });
        await db.disciplines.add(record);
        return record;
    }
    async function updateDiscipline(id, input, clock) {
        return db.transaction('rw', db.disciplines, async () => {
            const current = await db.disciplines.get(id);
            if (!current)
                throw domainError('not_found', 'Disciplina não encontrada.');
            const next = disciplineSchema.parse({
                ...current,
                name: input.name.trim(),
                color: input.color ?? current.color ?? null,
                updatedAt: nowIso(clock),
            });
            await db.disciplines.put(next);
            return next;
        });
    }
    async function deleteDiscipline(id) {
        await db.transaction('rw', db.disciplines, db.topics, db.questions, async () => {
            const topicCount = await db.topics.where('disciplineId').equals(id).count();
            if (topicCount > 0) {
                throw domainError('referential_integrity', 'Existem assuntos vinculados a esta disciplina. Remova-os antes.');
            }
            const questionCount = await db.questions.where('disciplineId').equals(id).count();
            if (questionCount > 0) {
                throw domainError('referential_integrity', 'Existem questões vinculadas a esta disciplina. Arquive-as ou remova-as antes.');
            }
            await db.disciplines.delete(id);
        });
    }
    async function listTopics(disciplineId) {
        if (disciplineId) {
            return db.topics.where('disciplineId').equals(disciplineId).toArray();
        }
        return db.topics.toArray();
    }
    async function createTopic(input, clock) {
        return db.transaction('rw', db.disciplines, db.topics, async () => {
            const discipline = await db.disciplines.get(input.disciplineId);
            if (!discipline)
                throw domainError('referential_integrity', 'Disciplina inexistente.');
            const at = nowIso(clock);
            const record = topicSchema.parse({
                id: newId(),
                disciplineId: input.disciplineId,
                name: input.name.trim(),
                createdAt: at,
                updatedAt: at,
            });
            await db.topics.add(record);
            return record;
        });
    }
    async function updateTopic(id, input, clock) {
        return db.transaction('rw', db.topics, async () => {
            const current = await db.topics.get(id);
            if (!current)
                throw domainError('not_found', 'Assunto não encontrado.');
            const next = topicSchema.parse({
                ...current,
                name: input.name?.trim() ?? current.name,
                updatedAt: nowIso(clock),
            });
            await db.topics.put(next);
            return next;
        });
    }
    async function deleteTopic(id) {
        await db.transaction('rw', db.topics, db.questions, async () => {
            const questionCount = await db.questions.where('topicId').equals(id).count();
            if (questionCount > 0) {
                throw domainError('referential_integrity', 'Existem questões vinculadas a este assunto. Ajuste-as antes de remover.');
            }
            await db.topics.delete(id);
        });
    }
    async function listBoards() {
        return db.boards.orderBy('name').toArray();
    }
    async function createBoard(input, clock) {
        const record = boardSchema.parse({
            id: newId(),
            name: input.name.trim(),
            createdAt: nowIso(clock),
        });
        await db.boards.add(record);
        return record;
    }
    async function deleteBoard(id) {
        await db.transaction('rw', db.boards, db.questions, async () => {
            const questionCount = await db.questions.where('boardId').equals(id).count();
            if (questionCount > 0) {
                throw domainError('referential_integrity', 'Existem questões vinculadas a esta banca.');
            }
            await db.boards.delete(id);
        });
    }
    async function listContests() {
        return db.contests.orderBy('name').toArray();
    }
    async function createContest(input, clock) {
        const record = contestSchema.parse({
            id: newId(),
            name: input.name.trim(),
            year: input.year ?? null,
            createdAt: nowIso(clock),
        });
        await db.contests.add(record);
        return record;
    }
    async function deleteContest(id) {
        await db.transaction('rw', db.contests, db.questions, async () => {
            const questionCount = await db.questions.where('contestId').equals(id).count();
            if (questionCount > 0) {
                throw domainError('referential_integrity', 'Existem questões vinculadas a este concurso.');
            }
            await db.contests.delete(id);
        });
    }
    return {
        listDisciplines,
        getDiscipline,
        createDiscipline,
        updateDiscipline,
        deleteDiscipline,
        listTopics,
        createTopic,
        updateTopic,
        deleteTopic,
        listBoards,
        createBoard,
        deleteBoard,
        listContests,
        createContest,
        deleteContest,
    };
}
