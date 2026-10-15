import { useMemo } from 'react'
import { getDb } from '@/shared/db/database'
import { createBackupService } from './backup.service'

export function useBackupService() {
  const db = getDb()
  return useMemo(() => createBackupService(db), [db])
}
