import type { ImportFile, ImportPage, ImportRecord } from '@/shared/db/types'
import type { AprovaQuestDatabase } from '@/shared/db/database'
import { getDb } from '@/shared/db/database'
import { type Clock, nowIso } from '@/shared/lib/dates'
import { newId } from '@/shared/lib/ids'

export interface CreateImportInput {
  fileName: string
  fileSize: number
  totalPages?: number
}

export function createImportsRepo(db: AprovaQuestDatabase = getDb()) {
  async function createRecord(input: CreateImportInput, clock?: Clock): Promise<ImportRecord> {
    const at = nowIso(clock)
    const record: ImportRecord = {
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
    }
    await db.imports.put(record)
    return record
  }

  async function updateRecord(id: string, patch: Partial<ImportRecord>, clock?: Clock): Promise<void> {
    await db.transaction('rw', db.imports, async () => {
      const current = await db.imports.get(id)
      if (!current) return
      const next: ImportRecord = {
        ...current,
        ...patch,
        updatedAt: nowIso(clock),
      }
      await db.imports.put(next)
    })
  }

  async function savePages(pages: Omit<ImportPage, 'id' | 'createdAt'>[], clock?: Clock): Promise<void> {
    const at = nowIso(clock)
    const rows: ImportPage[] = pages.map((p) => ({ id: newId(), ...p, createdAt: at }))
    await db.importPages.bulkAdd(rows)
  }

  async function saveFile(file: Omit<ImportFile, 'createdAt'>, clock?: Clock): Promise<void> {
    await db.importFiles.put({ ...file, createdAt: nowIso(clock) })
  }

  async function getFile(importId: string): Promise<ImportFile | undefined> {
    return db.importFiles.get(importId)
  }

  async function deleteFile(importId: string): Promise<void> {
    await db.importFiles.delete(importId)
  }

  async function getRecord(id: string): Promise<ImportRecord | undefined> {
    return db.imports.get(id)
  }

  async function getPages(importId: string): Promise<ImportPage[]> {
    return db.importPages.where('importId').equals(importId).sortBy('pageNumber')
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
  }
}

export type ImportsRepo = ReturnType<typeof createImportsRepo>
