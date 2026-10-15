import { newId } from '@/shared/lib/ids';
import { nowIso, addDays } from '@/shared/lib/dates';
import { domainError } from '@/shared/db/errors';
import { getDb } from '@/shared/db/database';
const REVIEW_SCHEDULE = [1, 7, 30];
export function createErrorsRepo(db = getDb()) {
    async function addErrorNote(input, clock) {
        const at = nowIso(clock);
        const note = {
            id: newId(),
            questionId: input.questionId,
            attemptId: input.attemptId ?? null,
            category: input.category,
            note: input.note ?? '',
            explanation: input.explanation ?? '',
            resolved: false,
            createdAt: at,
            updatedAt: at,
        };
        await db.errorNotes.put(note);
        return note;
    }
    async function listErrorNotes() {
        return db.errorNotes.toArray();
    }
    async function getErrorNote(id) {
        return db.errorNotes.get(id);
    }
    async function resolveErrorNote(id, resolved = true, clock) {
        await db.transaction('rw', db.errorNotes, db.reviews, async () => {
            const note = await db.errorNotes.get(id);
            if (!note)
                throw domainError('not_found', 'Nota de erro não encontrada.');
            const next = { ...note, resolved, updatedAt: nowIso(clock) };
            await db.errorNotes.put(next);
        });
    }
    return { addErrorNote, listErrorNotes, getErrorNote, resolveErrorNote };
}
export function scheduleReviewsForError(errorNoteId, baseDateIso, clock) {
    const at = nowIso(clock);
    return REVIEW_SCHEDULE.map((offset) => ({
        id: newId(),
        questionId: '',
        offsetDays: offset,
        status: 'pending',
        dueAt: addDays(baseDateIso, offset),
        postponedTo: null,
        completedAt: null,
        sourceErrorNoteId: errorNoteId,
        createdAt: at,
        updatedAt: at,
    }));
}
