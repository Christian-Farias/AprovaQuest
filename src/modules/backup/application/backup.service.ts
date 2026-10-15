import type { AprovaQuestDatabase } from '@/shared/db/database'
import { getDb } from '@/shared/db/database'
import { toResult } from '@/shared/lib/async'
import { type Result } from '@/shared/lib/result'
import { createBackupRepo } from '../data/backup.repo'
import { validateBackup, type BackupFile } from '../domain/backup'
import type { Clock } from '@/shared/lib/dates'

export function createBackupService(db: AprovaQuestDatabase = getDb()) {
  const repo = createBackupRepo(db)

  async function exportBackup(includePdfBlobs = false, clock?: Clock): Promise<Result<BackupFile>> {
    return toResult(async () => repo.exportAll(includePdfBlobs, clock))
  }

  async function importBackup(backupJson: unknown, clock?: Clock): Promise<Result<void>> {
    const validated = validateBackup(backupJson)
    if (!validated.ok) return { ok: false, error: { code: 'validation', message: validated.reason } }
    return toResult(async () => repo.importFromBackup(validated.backup, clock))
  }

  function downloadBackupFile(backup: BackupFile): void {
    const json = JSON.stringify(backup, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aprovaquest-backup-${backup.meta.exportedAt.slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return { exportBackup, importBackup, downloadBackupFile }
}

export type BackupService = ReturnType<typeof createBackupService>
