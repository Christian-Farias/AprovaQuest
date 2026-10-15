export const BACKUP_VERSION = '1.0.0';
export function createEmptyBackup(exportedAt, includePdfBlobs) {
    return {
        meta: {
            version: BACKUP_VERSION,
            exportedAt,
            includePdfBlobs,
        },
        data: {},
    };
}
export function validateBackup(backup) {
    if (!backup || typeof backup !== 'object') {
        return { ok: false, reason: 'Backup inválido (formato desconhecido).' };
    }
    const b = backup;
    if (!b.meta || typeof b.meta !== 'object') {
        return { ok: false, reason: 'Backup sem metadados.' };
    }
    if (b.meta.version !== BACKUP_VERSION) {
        return { ok: false, reason: `Versão incompatível: ${b.meta.version ?? 'desconhecida'}` };
    }
    if (typeof b.meta.exportedAt !== 'string') {
        return { ok: false, reason: 'Data de exportação inválida.' };
    }
    if (typeof b.data !== 'object' || b.data === null) {
        return { ok: false, reason: 'Dados do backup inválidos.' };
    }
    return { ok: true, backup: b };
}
