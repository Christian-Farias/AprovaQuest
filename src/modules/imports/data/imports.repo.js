import { getDb } from '@/shared/db/database';
import { nowIso } from '@/shared/lib/dates';
import { newId } from '@/shared/lib/ids';
export function createImportsRepo(db = getDb()) {
    async function createRecord(input, clock) {
        const at = nowIso(clock);
        const record = {
            id: newId(),
            fileName: input.fileName,
            fileSize: input.fileSize,
            status: 'pending',
            progress: 0,
            totalPages: input.totalPages ?? 0,
            textPages: 0,
            ocrPages: 0,
            needsReview: 0,
            extractedCount: 0,
            validatedCount: 0,
            rejectedCount: 0,
            importedCount: 0,
            errorMessage: null,
            hasBlob: false,
            createdAt: at,
            updatedAt: at,
            completedAt: null,
        };
        await db.imports.put(record);
        return record;
    }
    async function updateRecord(id, patch, clock) {
        await db.transaction('rw', db.imports, async () => {
            const current = await db.imports.get(id);
            if (!current)
                return;
            const next = {
                ...current,
                ...patch,
                updatedAt: nowIso(clock),
            };
            await db.imports.put(next);
        });
    }
    async function savePages(pages, clock) {
        const at = nowIso(clock);
        const rows = pages.map((p) => ({ id: newId(), ...p, createdAt: at }));
        await db.importPages.bulkAdd(rows);
    }
    async function saveFile(file, clock) {
        await db.importFiles.put({ ...file, createdAt: nowIso(clock) });
    }
    async function getFile(importId) {
        return db.importFiles.get(importId);
    }
    async function deleteFile(importId) {
        await db.importFiles.delete(importId);
    }
    async function getRecord(id) {
        return db.imports.get(id);
    }
    async function getPages(importId) {
        return db.importPages.where('importId').equals(importId).sortBy('pageNumber');
    }
    return {
        createRecord,
        updateRecord,
        savePages,
        saveFile,
        getFile,
        deleteFile,
        getRecord,
        getPages,
    };
}
