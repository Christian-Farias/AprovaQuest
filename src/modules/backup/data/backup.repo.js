import { getDb } from '@/shared/db/database';
import { nowIso } from '@/shared/lib/dates';
import { BACKUP_VERSION } from '../domain/backup';
export function createBackupRepo(db = getDb()) {
    async function exportAll(includePdfBlobs, clock) {
        const exportedAt = nowIso(clock);
        const [disciplines, topics, boards, contests, questions, options, attempts, errorNotes, reviews, studySessions, plans, availability, planGoals, imports, importPages, importFiles, settings,] = await Promise.all([
            db.disciplines.toArray(),
            db.topics.toArray(),
            db.boards.toArray(),
            db.contests.toArray(),
            db.questions.toArray(),
            db.options.toArray(),
            db.attempts.toArray(),
            db.errorNotes.toArray(),
            db.reviews.toArray(),
            db.studySessions.toArray(),
            db.plans.toArray(),
            db.availability.toArray(),
            db.planGoals.toArray(),
            db.imports.toArray(),
            db.importPages.toArray(),
            db.importFiles.toArray(),
            db.settings.toArray(),
        ]);
        return {
            meta: {
                version: BACKUP_VERSION,
                exportedAt,
                includePdfBlobs,
            },
            data: {
                disciplines,
                topics,
                boards,
                contests,
                questions,
                options,
                attempts,
                errorNotes,
                reviews,
                studySessions,
                plans,
                availability,
                planGoals,
                imports,
                importPages,
                importFiles: includePdfBlobs ? importFiles : [],
                settings,
            },
        };
    }
    async function importFromBackup(backup, _clock) {
        const tables = [
            'disciplines',
            'topics',
            'boards',
            'contests',
            'questions',
            'options',
            'attempts',
            'errorNotes',
            'reviews',
            'studySessions',
            'plans',
            'availability',
            'planGoals',
            'imports',
            'importPages',
            'importFiles',
            'settings',
        ];
        await db.transaction('rw', tables, async () => {
            // substituição simples: limpa e restaura
            for (const t of tables) {
                await db[t].clear();
            }
            const d = backup.data;
            if (d.disciplines?.length)
                await db.disciplines.bulkPut(d.disciplines);
            if (d.topics?.length)
                await db.topics.bulkPut(d.topics);
            if (d.boards?.length)
                await db.boards.bulkPut(d.boards);
            if (d.contests?.length)
                await db.contests.bulkPut(d.contests);
            if (d.questions?.length)
                await db.questions.bulkPut(d.questions);
            if (d.options?.length)
                await db.options.bulkPut(d.options);
            if (d.attempts?.length)
                await db.attempts.bulkPut(d.attempts);
            if (d.errorNotes?.length)
                await db.errorNotes.bulkPut(d.errorNotes);
            if (d.reviews?.length)
                await db.reviews.bulkPut(d.reviews);
            if (d.studySessions?.length)
                await db.studySessions.bulkPut(d.studySessions);
            if (d.plans?.length)
                await db.plans.bulkPut(d.plans);
            if (d.availability?.length)
                await db.availability.bulkPut(d.availability);
            if (d.planGoals?.length)
                await db.planGoals.bulkPut(d.planGoals);
            if (d.imports?.length)
                await db.imports.bulkPut(d.imports);
            if (d.importPages?.length)
                await db.importPages.bulkPut(d.importPages);
            if (d.importFiles?.length)
                await db.importFiles.bulkPut(d.importFiles);
            if (d.settings?.length)
                await db.settings.bulkPut(d.settings);
        });
    }
    return { exportAll, importFromBackup };
}
