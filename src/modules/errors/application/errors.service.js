import { getDb } from '@/shared/db/database';
import { toResult } from '@/shared/lib/async';
import {} from '@/shared/lib/result';
import { createErrorsRepo } from '../data/errors.repo';
export function createErrorsService(db = getDb()) {
    const repo = createErrorsRepo(db);
    async function createErrorNote(input, clock) {
        return toResult(async () => repo.addErrorNote(input, clock));
    }
    async function listErrorNotes() {
        return toResult(async () => repo.listErrorNotes());
    }
    async function resolveErrorNote(id, clock) {
        return toResult(async () => repo.resolveErrorNote(id, true, clock));
    }
    return { createErrorNote, listErrorNotes, resolveErrorNote };
}
