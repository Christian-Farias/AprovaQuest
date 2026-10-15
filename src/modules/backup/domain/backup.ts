export const BACKUP_VERSION = '1.0.0' as const

export interface BackupMeta {
  version: typeof BACKUP_VERSION
  exportedAt: string
  deviceId?: string | null
  includePdfBlobs: boolean
}

export interface BackupData {
  meta: BackupMeta
  disciplines?: any[]
  topics?: any[]
  boards?: any[]
  contests?: any[]
  questions?: any[]
  options?: any[]
  attempts?: any[]
  errorNotes?: any[]
  reviews?: any[]
  studySessions?: any[]
  plans?: any[]
  availability?: any[]
  planGoals?: any[]
  imports?: any[]
  importPages?: any[]
  importFiles?: any[]
  settings?: any[]
}

export interface BackupFile {
  meta: BackupMeta
  data: BackupData
}

export function createEmptyBackup(exportedAt: string, includePdfBlobs: boolean): BackupFile {
  return {
    meta: {
      version: BACKUP_VERSION,
      exportedAt,
      includePdfBlobs,
    },
    data: {} as any,
  }
}

export function validateBackup(backup: unknown): { ok: true; backup: BackupFile } | { ok: false; reason: string } {
  if (!backup || typeof backup !== 'object') {
    return { ok: false, reason: 'Backup inválido (formato desconhecido).' }
  }
  const b = backup as any
  if (!b.meta || typeof b.meta !== 'object') {
    return { ok: false, reason: 'Backup sem metadados.' }
  }
  if (b.meta.version !== BACKUP_VERSION) {
    return { ok: false, reason: `Versão incompatível: ${b.meta.version ?? 'desconhecida'}` }
  }
  if (typeof b.meta.exportedAt !== 'string') {
    return { ok: false, reason: 'Data de exportação inválida.' }
  }
  if (typeof b.data !== 'object' || b.data === null) {
    return { ok: false, reason: 'Dados do backup inválidos.' }
  }
  return { ok: true, backup: b as BackupFile }
}
