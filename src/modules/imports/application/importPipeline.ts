import { segmentText } from '../domain/segmenter'
import { assertValidPdfFile } from '../domain/validate'
import { createImportsRepo } from '../data/imports.repo'
import { parsedQuestionToDraft } from './segmentToDrafts'
import type { ImportDraft } from '../domain/types'
import type { PdfExtractor } from './pdfExtractor'
import type { OcrEngine } from './ocr'
import { createQuestionsService } from '@/modules/questions/application/questions.service'
import type { AprovaQuestDatabase } from '@/shared/db/database'
import { getDb } from '@/shared/db/database'
import { domainError } from '@/shared/db/errors'
import { nowIso, type Clock } from '@/shared/lib/dates'
import { toResult } from '@/shared/lib/async'
import { type Result } from '@/shared/lib/result'

export interface ImportProgress {
  importId: string
  totalPages: number
  processedPages: number
  stage: 'validating' | 'extracting' | 'ocr' | 'parsing' | 'review' | 'saving' | 'completed'
  textPages: number
  ocrPages: number
  extractedCount: number
}

export interface ImportPipelineOptions {
  disciplineId?: string | null
  source?: string | null
  clock?: Clock
  onProgress?: (progress: ImportProgress) => void
  signal?: AbortSignal
}

export interface ImportCommitInput {
  importId: string
  drafts: Array<ImportDraft & { selected: boolean }>
  clock?: Clock
}

export interface ImportCommitSummary {
  extractedCount: number
  validatedCount: number
  rejectedCount: number
  importedCount: number
}

export function createImportPipeline(
  db: AprovaQuestDatabase = getDb(),
  extractor: PdfExtractor,
  ocr: OcrEngine,
) {
  const repo = createImportsRepo(db)
  const questionsService = createQuestionsService(db)

  async function startImport(file: File, options: ImportPipelineOptions = {}): Promise<Result<string>> {
    return toResult(async () => {
      assertValidPdfFile({
        name: file.name,
        size: file.size,
        arrayBuffer: await file.arrayBuffer(),
      })
      const record = await repo.createRecord({ fileName: file.name, fileSize: file.size }, options.clock)
      await repo.updateRecord(record.id, { status: 'validating' }, options.clock)
      await repo.saveFile(
        { importId: record.id, fileName: file.name, fileSize: file.size, blob: file },
        options.clock,
      )
      await repo.updateRecord(record.id, { status: 'extracting', hasBlob: true }, options.clock)

      const pages = await extractor.extractText(file)
      await repo.updateRecord(
        record.id,
        { totalPages: pages.length, status: 'parsing' },
        options.clock,
      )

      let textPages = 0
      let ocrPages = 0
      let i = 0
      const pageRows: Array<{
        importId: string
        pageNumber: number
        needsOcr: boolean
        charCount: number
        text: string
      }> = []
      for (const page of pages) {
        if (options.signal?.aborted) throw domainError('aborted', 'Importação cancelada.')
        let text = page.text
        if (page.needsOcr) {
          ocrPages += 1
          await repo.updateRecord(record.id, { status: 'ocr' }, options.clock)
          if (page.imageDataUrl) {
            const result = await ocr.recognize(page.imageDataUrl)
            text = result.text
          }
          options.onProgress?.({
            importId: record.id,
            totalPages: pages.length,
            processedPages: i + 1,
            stage: 'ocr',
            textPages,
            ocrPages,
            extractedCount: 0,
          })
        } else {
          textPages += 1
        }
        pageRows.push({
          importId: record.id,
          pageNumber: page.pageNumber,
          needsOcr: page.needsOcr,
          charCount: text.length,
          text,
        })
        i += 1
      }
      await repo.savePages(pageRows, options.clock)

      await repo.updateRecord(
        record.id,
        {
          textPages,
          ocrPages,
          needsReview: pageRows.filter((p) => p.needsOcr).length,
          status: 'review',
        },
        options.clock,
      )
      options.onProgress?.({
        importId: record.id,
        totalPages: pages.length,
        processedPages: pages.length,
        stage: 'review',
        textPages,
        ocrPages,
        extractedCount: 0,
      })
      return record.id
    })
  }

  async function extractDrafts(importId: string, options?: { disciplineId?: string | null }): Promise<Result<ImportDraft[]>> {
    return toResult(async () => {
      const pages = await repo.getPages(importId)
      const combined = pages.map((p) => p.text).join('\n')
      const parsed = segmentText(combined)
      const drafts = parsed.map((p) =>
        parsedQuestionToDraft(p, { disciplineId: options?.disciplineId ?? null }),
      )
      await repo.updateRecord(importId, { extractedCount: drafts.length })
      return drafts
    })
  }

  async function commitImport(input: ImportCommitInput): Promise<Result<ImportCommitSummary>> {
    return toResult(async () => {
      const record = await repo.getRecord(input.importId)
      if (!record) throw domainError('not_found', 'Registro de importação não encontrado.')
      let imported = 0
      let validated = 0
      let rejected = 0
      // Requisito: "Informar quantas questões foram extraídas, validadas, rejeitadas e importadas."
      const all = input.drafts
      validated = all.filter((d) => d.selected && d.answerConfirmed && d.disciplineId).length
      rejected = all.filter((d) => !d.selected || !d.answerConfirmed || !d.disciplineId).length
      await repo.updateRecord(record.id, { status: 'saving' }, input.clock)

      for (const draft of all) {
        if (!draft.selected) continue
        if (!draft.answerConfirmed || !draft.disciplineId) continue
        const result = await questionsService.createQuestion(
          {
            type: 'multiple_choice',
            statement: draft.statement,
            disciplineId: draft.disciplineId,
            topicId: draft.topicId,
            boardId: draft.boardId,
            contestId: draft.contestId,
            source: draft.source,
            explanation: draft.explanation,
            tags: draft.tags,
            options: draft.options,
            answerConfirmed: draft.answerConfirmed,
          },
          input.clock,
        )
        if (result.ok) imported += 1
      }

      await repo.updateRecord(
        record.id,
        {
          status: 'completed',
          completedAt: nowIso(input.clock),
          extractedCount: all.length,
          validatedCount: validated,
          rejectedCount: rejected,
          importedCount: imported,
        },
        input.clock,
      )
      // Limpa blob ao concluir
      await repo.deleteFile(record.id)
      await repo.updateRecord(record.id, { hasBlob: false }, input.clock)
      return { extractedCount: all.length, validatedCount: validated, rejectedCount: rejected, importedCount: imported }
    })
  }

  async function cancelImport(importId: string, clock?: Clock): Promise<Result<void>> {
    return toResult(async () => {
      await repo.updateRecord(importId, { status: 'cancelled' }, clock)
      await repo.deleteFile(importId)
      await repo.updateRecord(importId, { hasBlob: false }, clock)
    })
  }

  return {
    startImport,
    extractDrafts,
    commitImport,
    cancelImport,
    repo,
  }
}

export type ImportPipeline = ReturnType<typeof createImportPipeline>
