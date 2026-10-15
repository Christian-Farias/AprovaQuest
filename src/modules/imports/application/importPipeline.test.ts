import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { type AprovaQuestDatabase } from '@/shared/db/database'
import { freshDb, disposeDb } from '@/test/db'
import { StubPdfExtractor } from './pdfExtractor'
import { StubOcrEngine } from './ocr'
import { createImportPipeline } from './importPipeline'
import { createQuestionsService } from '@/modules/questions/application/questions.service'
import { createTaxonomyService } from '@/modules/questions/application/taxonomy.service'

const clock = () => new Date('2024-06-01T12:00:00.000Z')

/** Gera um PDF sintético real (com assinatura %PDF) contendo o texto informado. */
async function pdfFile(text: string, name = 'teste.pdf'): Promise<File> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595, 842])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  page.drawText(text, { x: 50, y: 800, size: 10, font })
  const bytes = await doc.save()
  const buffer = new Uint8Array(bytes).buffer as ArrayBuffer
  return new File([buffer], name, { type: 'application/pdf' })
}

function stubPipeline(db: AprovaQuestDatabase, text: string) {
  const extractor = new StubPdfExtractor([
    { pageNumber: 1, text, charCount: text.length, needsOcr: false },
  ])
  const ocr = new StubOcrEngine()
  return createImportPipeline(db, extractor, ocr)
}

describe('pipeline de importação de PDFs', () => {
  let db: AprovaQuestDatabase
  let questions: ReturnType<typeof createQuestionsService>
  let taxonomy: ReturnType<typeof createTaxonomyService>

  beforeEach(async () => {
    db = await freshDb()
    questions = createQuestionsService(db)
    taxonomy = createTaxonomyService(db)
  })

  afterEach(async () => {
    await disposeDb(db)
  })

  it('extrai e segmenta questões a partir de páginas com texto suficiente', async () => {
    const text = `Questão 1) Qual a capital do Brasil?
A) São Paulo
B) Brasília
C) Rio de Janeiro
D) Salvador

Gabarito: B`

    const file = await pdfFile(text)
    const pipeline = stubPipeline(db, text)

    const start = await pipeline.startImport(file, { clock })
    expect(start.ok).toBe(true)
    if (!start.ok) return

    const drafts = await pipeline.extractDrafts(start.value)
    expect(drafts.ok).toBe(true)
    if (!drafts.ok) return
    expect(drafts.value).toHaveLength(1)
    const d = drafts.value[0]
    expect(d.statement).toMatch(/capital do Brasil/)
    expect(d.options).toHaveLength(4)
    expect(d.answerConfirmed).toBe(true)
    expect(d.options.find((o) => o.label === 'B')?.isCorrect).toBe(true)
  })

  it('não marca importação como concluída antes da gravação confirmada', async () => {
    const text = 'Questão 1) Enunciado\nA) X\nB) Y\nGabarito: A'
    const file = await pdfFile(text)
    const pipeline = stubPipeline(db, text)

    const start = await pipeline.startImport(file, { clock })
    expect(start.ok).toBe(true)
    if (!start.ok) return
    const drafts = await pipeline.extractDrafts(start.value)
    if (!drafts.ok) return
    const recordBefore = await pipeline.repo.getRecord(start.value)
    expect(recordBefore?.status).not.toBe('completed')
    const dis = await taxonomy.createDiscipline({ name: 'Geral' }, clock)
    if (!dis.ok) throw new Error('disciplina não criada')
    const commit = await pipeline.commitImport({
      importId: start.value,
      drafts: drafts.value.map((d) => ({ ...d, disciplineId: dis.value.id, selected: true })),
      clock,
    })
    expect(commit.ok).toBe(true)
    const recordAfter = await pipeline.repo.getRecord(start.value)
    expect(recordAfter?.status).toBe('completed')
  })

  it('detecta duplicatas (apenas sinaliza) — não exclui automaticamente', async () => {
    const dis = await taxonomy.createDiscipline({ name: 'Geral' }, clock)
    if (!dis.ok) throw new Error('disciplina não criada')
    const existing = await questions.createQuestion(
      {
        type: 'multiple_choice',
        statement: 'Qual a capital do Brasil?',
        disciplineId: dis.value.id,
        options: [
          { label: 'A', text: 'SP', isCorrect: false },
          { label: 'B', text: 'Brasília', isCorrect: true },
          { label: 'C', text: 'RJ', isCorrect: false },
        ],
      },
      clock,
    )
    if (!existing.ok) throw new Error('questão existente não criada')
    const dups = await questions.findPotentialDuplicates('Qual é a capital do Brasil?')
    expect(dups.ok).toBe(true)
    if (dups.ok) expect(dups.value.length).toBeGreaterThan(0)
  })

  it('cancela importação sem marcar como concluída e remove blob', async () => {
    const text = 'Questão 1) Enunciado\nA) X\nB) Y'
    const file = await pdfFile(text)
    const pipeline = stubPipeline(db, text)

    const start = await pipeline.startImport(file, { clock })
    if (!start.ok) throw new Error('start falhou')
    const cancel = await pipeline.cancelImport(start.value, clock)
    expect(cancel.ok).toBe(true)
    const record = await pipeline.repo.getRecord(start.value)
    expect(record?.status).toBe('cancelled')
    const blob = await pipeline.repo.getFile(start.value)
    expect(blob).toBeUndefined()
  })

  it('rejeita gravação de rascunho com gabarito não confirmado', async () => {
    const text = 'Questão 1) Enunciado com alternativas mas sem gabarito\nA) X\nB) Y'
    const file = await pdfFile(text)
    const pipeline = stubPipeline(db, text)

    const start = await pipeline.startImport(file, { clock })
    if (!start.ok) throw new Error('start falhou')
    const drafts = await pipeline.extractDrafts(start.value)
    if (!drafts.ok) throw new Error('drafts falhou')
    const dis = await taxonomy.createDiscipline({ name: 'Geral' }, clock)
    if (!dis.ok) throw new Error('disciplina não criada')
    const draft = drafts.value[0]
    const commit = await pipeline.commitImport({
      importId: start.value,
      drafts: [{ ...draft, disciplineId: dis.value.id, selected: true }],
      clock,
    })
    expect(commit.ok).toBe(true)
    if (!commit.ok) return
    // Sem gabarito confirmado → nada importado, mas registrado como rejeitado.
    expect(commit.value.importedCount).toBe(0)
    expect(commit.value.rejectedCount).toBeGreaterThanOrEqual(1)
  })
})
