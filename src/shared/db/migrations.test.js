import Dexie, {} from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { AprovaQuestDatabase, SCHEMA_VERSION, createDb } from './database';
import { migrateErrorNoteV1ToV2, migrateReviewV1ToV2, migrateStudySessionV1ToV3, } from './migrations';
import { disposeDb } from '@/test/db';
describe('transformações puras de migração', () => {
    it('errorNote v1 -> v2 preenche categoria, textos e updatedAt', () => {
        const migrated = migrateErrorNoteV1ToV2({
            id: 'n1',
            questionId: 'q1',
            resolved: true,
            createdAt: '2024-01-01T00:00:00.000Z',
        });
        expect(migrated.category).toBe('falta_conhecimento');
        expect(migrated.resolved).toBe(true);
        expect(migrated.note).toBe('');
        expect(migrated.explanation).toBe('');
        expect(migrated.attemptId).toBeNull();
        expect(migrated.updatedAt).toBe('2024-01-01T00:00:00.000Z');
    });
    it('review v1 -> v2 calcula o offset em dias', () => {
        const migrated = migrateReviewV1ToV2({
            id: 'r1',
            questionId: 'q1',
            status: 'pending',
            dueAt: '2024-01-08T00:00:00.000Z',
            createdAt: '2024-01-01T00:00:00.000Z',
        });
        expect(migrated.offsetDays).toBe(7);
        expect(migrated.postponedTo).toBeNull();
        expect(migrated.completedAt).toBeNull();
        expect(migrated.sourceErrorNoteId).toBeNull();
    });
    it('review v1 concluída define completedAt', () => {
        const migrated = migrateReviewV1ToV2({
            id: 'r1',
            questionId: 'q1',
            status: 'done',
            dueAt: '2024-01-08T00:00:00.000Z',
            createdAt: '2024-01-01T00:00:00.000Z',
        });
        expect(migrated.status).toBe('done');
        expect(migrated.completedAt).toBe('2024-01-08T00:00:00.000Z');
    });
    it('studySession v1 -> v3 adiciona prioridade e timestamps', () => {
        const migrated = migrateStudySessionV1ToV3({
            scheduledAt: '2024-02-01T10:00:00.000Z',
        });
        expect(migrated.priorityReason).toBe('');
        expect(migrated.createdAt).toBe('2024-02-01T10:00:00.000Z');
        expect(migrated.updatedAt).toBe('2024-02-01T10:00:00.000Z');
    });
});
class LegacyV1Database extends Dexie {
    errorNotes;
    reviews;
    studySessions;
    constructor(name) {
        super(name);
        this.version(1).stores({
            errorNotes: '&id, questionId, attemptId, resolved, createdAt',
            reviews: '&id, questionId, status, dueAt',
            studySessions: '&id, planId, type, status, scheduledAt',
        });
    }
}
describe('migração real do esquema (Dexie + IndexedDB)', () => {
    let db;
    afterEach(async () => {
        if (db)
            await disposeDb(db);
        db = undefined;
    });
    it('atualiza dados da v1 para a v3 preservando e preenchendo campos', async () => {
        const name = `aprovaquest_mig_${crypto.randomUUID()}`;
        const legacy = new LegacyV1Database(name);
        await legacy.open();
        await legacy.errorNotes.add({
            id: 'n1',
            questionId: 'q1',
            resolved: false,
            createdAt: '2024-01-01T00:00:00.000Z',
        });
        await legacy.reviews.add({
            id: 'r1',
            questionId: 'q1',
            status: 'pending',
            dueAt: '2024-01-08T00:00:00.000Z',
            createdAt: '2024-01-01T00:00:00.000Z',
        });
        await legacy.studySessions.add({
            id: 's1',
            planId: null,
            type: 'questions',
            status: 'planned',
            scheduledAt: '2024-02-01T10:00:00.000Z',
        });
        legacy.close();
        db = createDb(name);
        await db.open();
        expect(db.verno).toBe(SCHEMA_VERSION);
        const note = await db.errorNotes.get('n1');
        expect(note?.category).toBe('falta_conhecimento');
        expect(note?.updatedAt).toBe('2024-01-01T00:00:00.000Z');
        const review = await db.reviews.get('r1');
        expect(review?.offsetDays).toBe(7);
        expect(review?.postponedTo).toBeNull();
        const session = await db.studySessions.get('s1');
        expect(session?.priorityReason).toBe('');
    });
});
