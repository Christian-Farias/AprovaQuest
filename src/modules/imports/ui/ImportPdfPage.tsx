import { useState } from 'react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/Button'
import { Card, CardHeader } from '@/shared/ui/Card'
import { Field, Select } from '@/shared/ui/Field'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useToast } from '@/shared/toast/useToast'
import { useDisciplines } from '@/modules/questions/application/questions.hooks'
import { getDb } from '@/shared/db/database'
import { BrowserPdfExtractor } from '../application/pdfExtractor'
import { createTesseractOcrEngine } from '../application/ocr'
import { createImportPipeline, type ImportPipeline } from '../application/importPipeline'
import type { ImportDraft } from '../domain/types'

type Stage = 'idle' | 'starting' | 'extracting' | 'reviewing' | 'committing' | 'done'

export function ImportPdfPage() {
  const [stage, setStage] = useState<Stage>('idle')
  const [pipeline] = useState<ImportPipeline>(() => createImportPipeline(getDb(), new BrowserPdfExtractor(), createTesseractOcrEngine()))
  const [importId, setImportId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Array<ImportDraft & { selected: boolean }>>([])
  const [disciplineId, setDisciplineId] = useState<string>('')
  const { notify } = useToast()
  const disciplines = useDisciplines()

  const reset = () => {
    setStage('idle')
    setImportId(null)
    setDrafts([])
    setDisciplineId('')
  }

  async function handleFile(file: File) {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      notify({ tone: 'error', title: 'Arquivo inválido', description: 'Selecione um arquivo PDF.' })
      return
    }
    try {
      setStage('starting')
      const res = await pipeline.startImport(file)
      if (!res.ok) throw new Error(res.error.message)
      setImportId(res.value)
      setStage('extracting')
      const d = await pipeline.extractDrafts(res.value, { disciplineId: disciplineId || null })
      if (!d.ok) throw new Error(d.error.message)
      setDrafts(d.value.map((x) => ({ ...x, selected: true })))
      setStage('reviewing')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      notify({ tone: 'error', title: 'Falha na importação', description: msg })
      reset()
    }
  }

  async function handleCommit() {
    if (!importId) return
    try {
      setStage('committing')
      const res = await pipeline.commitImport({ importId, drafts })
      if (!res.ok) throw new Error(res.error.message)
      notify({ tone: 'success', title: 'Importação concluída', description: `${res.value.importedCount} questões importadas.` })
      setStage('done')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      notify({ tone: 'error', title: 'Falha ao gravar', description: msg })
      setStage('reviewing')
    }
  }

  async function handleCancel() {
    if (!importId) return
    await pipeline.cancelImport(importId)
      notify({ tone: 'error', title: 'Importação cancelada' })
    reset()
  }

  const canCommit = drafts.some((d) => d.selected && d.answerConfirmed && (d.disciplineId || disciplineId))

  return (
    <div>
      <PageHeader title="Importar PDFs" description="Extraia questões de um PDF e revise antes de gravar." />

      {stage === 'idle' && (
        <Card className="space-y-4">
          <CardHeader title="Selecionar arquivo PDF" />
          <Field label="Disciplina padrão (opcional)">
            <Select value={disciplineId} onChange={(e) => setDisciplineId(e.target.value)}>
              <option value="">Nenhuma</option>
              {(disciplines ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handleFile(f)
                e.target.value = ''
              }}
            />
          </div>
          <p className="text-xs text-ink-subtle">
            PDFs com até 10MB. Páginas digitalizadas usarão OCR (stub no momento).
          </p>
        </Card>
      )}

      {(stage === 'starting' || stage === 'extracting') && (
        <EmptyState title="Processando PDF" description="Validando, extraindo texto e segmentando questões..." />
      )}

      {stage === 'reviewing' && (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Revisão de rascunhos" />
            <div className="text-sm text-ink-subtle">
              {drafts.filter((d) => d.selected && d.answerConfirmed).length} válidas de {drafts.length}
            </div>
          </Card>
          {drafts.map((d, i) => (
            <Card key={i} className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={d.selected}
                  onChange={(e) => setDrafts((prev) => prev.map((x, j) => (j === i ? { ...x, selected: e.target.checked } : x)))}
                />
                <span className="text-sm font-medium">Questão {i + 1}</span>
              </label>
              <p className="whitespace-pre-wrap text-sm">{d.statement}</p>
              {d.options.map((o) => (
                <div key={o.label} className="flex items-center gap-2 text-sm">
                  <span>{o.label})</span>
                  <span>{o.text}</span>
                  {d.answerConfirmed && o.isCorrect && <span className="text-ok">✓ correto</span>}
                </div>
              ))}
              {!d.answerConfirmed && (
                <div className="text-xs text-warn">Gabarito não confirmado — será rejeitado no commit.</div>
              )}
            </Card>
          ))}
          <div className="flex gap-2">
            <Button onClick={handleCommit} disabled={!canCommit || stage !== 'reviewing'}>
              Gravar selecionadas
            </Button>
            <Button variant="ghost" onClick={handleCancel} disabled={stage !== 'reviewing'}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {stage === 'done' && (
        <Card>
          <CardHeader title="Concluído" />
          <div className="flex justify-between">
            <p className="text-sm text-ink-subtle">Importação finalizada.</p>
            <Button onClick={reset}>Nova importação</Button>
          </div>
        </Card>
      )}
    </div>
  )
}
