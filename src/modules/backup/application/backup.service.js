import { getDb } from '@/shared/db/database';
import { toResult } from '@/shared/lib/async';
import {} from '@/shared/lib/result';
import { createBackupRepo } from '../data/backup.repo';
import { validateBackup } from '../domain/backup';
export function createBackupService(db = getDb()) {
    const repo = createBackupRepo(db);
    async function exportBackup(includePdfBlobs = false, clock) {
        return toResult(async () => repo.exportAll(includePdfBlobs, clock));
    }
    async function importBackup(backupJson, clock) {
        const validated = validateBackup(backupJson);
        if (!validated.ok)
            return { ok: false, error: { code: 'validation', message: validated.reason } };
        return toResult(async () => repo.importFromBackup(validated.backup, clock));
    }
    function downloadBackupFile(backup) {
        const json = JSON.stringify(backup, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aprovaquest-backup-${backup.meta.exportedAt.slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    return { exportBackup, importBackup, downloadBackupFile };
}
