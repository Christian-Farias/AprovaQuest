import { useState } from 'react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Card, CardHeader } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { Field, Input, Select, Textarea } from '@/shared/ui/Field'
import { useConfirm } from '@/shared/ui/ConfirmDialog'
import { useToast } from '@/shared/toast/useToast'
import { useErrorNotes } from '../application/errors.hooks'
import { useErrorsService } from '../application/useErrorsService'
import type { ErrorNote, ErrorCategory } from '@/shared/db/types'

const CATEGORY_LABELS: Record<ErrorCategory, string> = {
  falta_conhecimento: 'Falta de conhecimento',
  interpretacao: 'Interpretação',
  desatencao: 'Desatenção',
  confusao_conceitual: 'Confusão conceitual',
}

const CATEGORY_COLORS: Record<ErrorCategory, 'danger' | 'warn' | 'neutral' | 'brand'> = {
  falta_conhecimento: 'danger',
  interpretacao: 'brand',
  desatencao: 'warn',
  confusao_conceitual: 'neutral',
}

interface CreateNoteForm {
  questionId: string
  category: ErrorCategory
  note: string
  explanation: string
}

function CreateNoteModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const service = useErrorsService()
  const toast = useToast()
  const [form, setForm] = useState<CreateNoteForm>({
    questionId: '',
    category: 'falta_conhecimento',
    note: '',
    explanation: '',
  })
  const [saving, setSaving] = useState(false)

  function update<K extends keyof CreateNoteForm>(key: K, value: CreateNoteForm[K]) {
    setForm((c) => ({ ...c, [key]: value }))
  }

  async function handleSubmit() {
    setSaving(true)
    const result = await service.createErrorNote({
      questionId: form.questionId.trim() || 'manual',
      category: form.category,
      note: form.note.trim(),
      explanation: form.explanation.trim(),
    })
    setSaving(false)
    if (result.ok) {
      toast.notify({ tone: 'success', title: 'Nota de erro criada' })
      setForm({ questionId: '', category: 'falta_conhecimento', note: '', explanation: '' })
      onClose()
    } else {
      toast.notify({ tone: 'error', title: 'Erro ao criar nota', description: result.error.message })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nova nota de erro"
      description="Registre manualmente um erro para acompanhar e revisar."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={saving} disabled={!form.category}>
            Salvar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Categoria" required>
          <Select
            value={form.category}
            onChange={(e) => update('category', e.target.value as ErrorCategory)}
          >
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="ID da questão" hint="Opcional — deixe em branco para nota avulsa">
          <Input
            value={form.questionId}
            onChange={(e) => update('questionId', e.target.value)}
            placeholder="Ex.: uuid da questão"
          />
        </Field>
        <Field label="Observação" hint="Descreva o erro cometido">
          <Textarea
            value={form.note}
            onChange={(e) => update('note', e.target.value)}
            placeholder="O que aconteceu?"
          />
        </Field>
        <Field label="Explicação / correção" hint="Como evitar este erro no futuro">
          <Textarea
            value={form.explanation}
            onChange={(e) => update('explanation', e.target.value)}
            placeholder="Conceito correto, dica de revisão…"
          />
        </Field>
      </div>
    </Modal>
  )
}

export function ErrorNotebookPage() {
  const notes = useErrorNotes()
  const service = useErrorsService()
  const toast = useToast()
  const confirm = useConfirm()
  const [createOpen, setCreateOpen] = useState(false)
  const [filterResolved, setFilterResolved] = useState<'all' | 'pending' | 'resolved'>('all')

  async function handleResolve(note: ErrorNote) {
    const result = await service.resolveErrorNote(note.id)
    if (result.ok) {
      toast.notify({ tone: 'success', title: 'Erro marcado como resolvido' })
    } else {
      toast.notify({ tone: 'error', title: 'Falha ao atualizar', description: result.error.message })
    }
  }

  async function handleDelete(note: ErrorNote) {
    const ok = await confirm({
      title: 'Excluir nota de erro?',
      description: 'Esta ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
      danger: true,
    })
    if (!ok) return
    const result = await service.deleteErrorNote(note.id)
    if (result.ok) {
      toast.notify({ tone: 'success', title: 'Nota excluída' })
    } else {
      toast.notify({ tone: 'error', title: 'Erro ao excluir', description: result.error.message })
    }
  }

  const filtered = (notes ?? []).filter((n) => {
    if (filterResolved === 'pending') return !n.resolved
    if (filterResolved === 'resolved') return n.resolved
    return true
  })

  return (
    <div>
      <PageHeader
        title="Caderno de Erros"
        description="Erros registrados com categorias, anotações e revisão prevista."
        action={
          <Button onClick={() => setCreateOpen(true)}>+ Nova nota</Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', 'pending', 'resolved'] as const).map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => setFilterResolved(val)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filterResolved === val
                ? 'bg-accent-500/15 text-accent-300'
                : 'text-ink-300 hover:bg-ink-750 hover:text-mist-100'
            }`}
          >
            {val === 'all' ? 'Todos' : val === 'pending' ? 'Pendentes' : 'Resolvidos'}
          </button>
        ))}
        {notes !== undefined && (
          <span className="ml-auto text-sm text-ink-400 self-center">
            {filtered.length} nota{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {!notes || filtered.length === 0 ? (
        <EmptyState
          title={notes?.length === 0 ? 'Nenhum erro registrado' : 'Nenhuma nota com este filtro'}
          description={
            notes?.length === 0
              ? 'Erros são registrados automaticamente ao revisar tentativas incorretas, ou você pode criar uma nota manual.'
              : 'Altere o filtro acima para ver outras notas.'
          }
          action={
            notes?.length === 0 ? (
              <Button onClick={() => setCreateOpen(true)}>Criar nota manual</Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((note) => (
            <li key={note.id}>
              <Card>
                <CardHeader
                  title={
                    <span className="flex items-center gap-2">
                      {CATEGORY_LABELS[note.category]}
                      <Badge tone={CATEGORY_COLORS[note.category]}>{note.category.replace(/_/g, ' ')}</Badge>
                    </span>
                  }
                  action={
                    <Badge tone={note.resolved ? 'ok' : 'warn'}>
                      {note.resolved ? 'Resolvido' : 'Pendente'}
                    </Badge>
                  }
                />
                <div className="space-y-2 text-sm text-ink-subtle">
                  {note.note && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-ink-500 mb-1">Observação</p>
                      <p className="text-mist-300">{note.note}</p>
                    </div>
                  )}
                  {note.explanation && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-ink-500 mb-1">Explicação</p>
                      <p className="text-mist-300">{note.explanation}</p>
                    </div>
                  )}
                  <p className="text-xs text-ink-500">
                    Criado em {new Date(note.createdAt).toLocaleDateString('pt-BR')}
                    {note.questionId && note.questionId !== 'manual' && (
                      <> · questão <code className="font-mono text-ink-400">{note.questionId.slice(0, 8)}…</code></>
                    )}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {!note.resolved && (
                    <Button size="sm" variant="secondary" onClick={() => handleResolve(note)}>
                      ✓ Marcar resolvido
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(note)}
                  >
                    Excluir
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <CreateNoteModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
