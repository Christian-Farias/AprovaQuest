import { useEffect, useMemo, useState } from 'react'
import type { Question, QuestionType } from '@/shared/db/types'
import { Button } from '@/shared/ui/Button'
import { Field, Input, Select, Textarea } from '@/shared/ui/Field'
import { Modal } from '@/shared/ui/Modal'
import { useToast } from '@/shared/toast/useToast'
import { useDisciplines, useTopics } from '../application/questions.hooks'
import { useTaxonomyService } from '../application/useTaxonomyService'
import { useQuestionsService } from '../application/useQuestionsService'

interface OptionDraft {
  id?: string
  label: string
  text: string
  isCorrect: boolean
}

interface FormState {
  type: QuestionType
  statement: string
  disciplineId: string
  topicId: string
  source: string
  explanation: string
  tags: string
  options: OptionDraft[]
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

function defaultOptions(type: QuestionType): OptionDraft[] {
  if (type === 'true_false') {
    return [
      { label: 'C', text: 'Certo', isCorrect: false },
      { label: 'E', text: 'Errado', isCorrect: false },
    ]
  }
  return LETTERS.slice(0, 4).map((label) => ({ label, text: '', isCorrect: false }))
}

export function QuestionFormModal({
  open,
  onClose,
  question,
}: {
  open: boolean
  onClose: () => void
  question?: Question
}) {
  const questionsService = useQuestionsService()
  const taxonomyService = useTaxonomyService()
  const disciplines = useDisciplines()
  const toast = useToast()

  const [form, setForm] = useState<FormState>(() => ({
    type: 'multiple_choice',
    statement: '',
    disciplineId: '',
    topicId: '',
    source: '',
    explanation: '',
    tags: '',
    options: defaultOptions('multiple_choice'),
  }))
  const [saving, setSaving] = useState(false)

  const topics = useTopics(form.disciplineId || undefined)

  useEffect(() => {
    if (!open) return
    if (question) {
      setForm({
        type: question.type,
        statement: question.statement,
        disciplineId: question.disciplineId,
        topicId: question.topicId ?? '',
        source: question.source ?? '',
        explanation: question.explanation ?? '',
        tags: question.tags.join(', '),
        options:
          question.type === 'true_false'
            ? defaultOptions('true_false')
            : defaultOptions('multiple_choice'),
      })
      void questionsService.getOptions(question.id).then((result) => {
        if (result.ok && result.value.length > 0) {
          setForm((current) => ({
            ...current,
            options: result.value.map((o) => ({
              id: o.id,
              label: o.label,
              text: o.text,
              isCorrect: o.isCorrect,
            })),
          }))
        }
      })
    } else {
      setForm({
        type: 'multiple_choice',
        statement: '',
        disciplineId: '',
        topicId: '',
        source: '',
        explanation: '',
        tags: '',
        options: defaultOptions('multiple_choice'),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, question?.id])

  const answerConfirmed = form.options.some((o) => o.isCorrect)

  const canSubmit = useMemo(
    () => form.statement.trim().length > 0 && form.disciplineId.length > 0,
    [form.statement, form.disciplineId],
  )

  function updateOption(index: number, patch: Partial<OptionDraft>) {
    setForm((current) => ({
      ...current,
      options: current.options.map((option, i) => (i === index ? { ...option, ...patch } : option)),
    }))
  }

  function markCorrect(index: number) {
    setForm((current) => ({
      ...current,
      options: current.options.map((option, i) => ({ ...option, isCorrect: i === index })),
    }))
  }

  function changeType(type: QuestionType) {
    setForm((current) => ({ ...current, type, options: defaultOptions(type) }))
  }

  async function quickCreateDiscipline(name: string) {
    const result = await taxonomyService.createDiscipline({ name })
    if (result.ok) {
      setForm((current) => ({ ...current, disciplineId: result.value.id }))
    } else {
      toast.notify({ tone: 'error', title: 'Não foi possível criar a disciplina', description: result.error.message })
    }
  }

  async function handleSubmit() {
    if (!canSubmit) return
    setSaving(true)
    const input = {
      type: form.type,
      statement: form.statement.trim(),
      disciplineId: form.disciplineId,
      topicId: form.topicId || null,
      source: form.source.trim() || null,
      explanation: form.explanation.trim() || null,
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      options: form.options.map((option) => ({
        id: option.id,
        label: option.label,
        text: option.text,
        isCorrect: option.isCorrect,
      })),
      answerConfirmed,
    }
    const result = question
      ? await questionsService.updateQuestion(question.id, input)
      : await questionsService.createQuestion(input)
    setSaving(false)

    if (result.ok) {
      toast.notify({
        tone: 'success',
        title: question ? 'Questão atualizada' : 'Questão criada',
        description: answerConfirmed
          ? undefined
          : 'Gabarito não confirmado: ela não poderá ser respondida até a confirmação.',
      })
      onClose()
    } else {
      toast.notify({
        tone: 'error',
        title: 'Não foi possível salvar',
        description: result.error.message,
      })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={question ? 'Editar questão' : 'Nova questão'}
      description="Cadastro manual. As questões importadas de PDFs passam pela tela de revisão."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={saving} disabled={!canSubmit}>
            Salvar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo" required>
            <Select value={form.type} onChange={(e) => changeType(e.target.value as QuestionType)}>
              <option value="multiple_choice">Múltipla escolha</option>
              <option value="true_false">Certo / Errado</option>
            </Select>
          </Field>
          <Field label="Disciplina" required>
            <Select
              value={form.disciplineId}
              onChange={(e) => setForm((c) => ({ ...c, disciplineId: e.target.value, topicId: '' }))}
            >
              <option value="">Selecione…</option>
              {(disciplines ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {disciplines && disciplines.length === 0 ? (
          <QuickDiscipline onCreate={quickCreateDiscipline} />
        ) : null}

        <Field label="Assunto" hint="Opcional">
          <Select
            value={form.topicId}
            onChange={(e) => setForm((c) => ({ ...c, topicId: e.target.value }))}
            disabled={!form.disciplineId}
          >
            <option value="">Sem assunto</option>
            {(topics ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Enunciado" required>
          <Textarea
            value={form.statement}
            onChange={(e) => setForm((c) => ({ ...c, statement: e.target.value }))}
            placeholder="Digite o enunciado da questão"
          />
        </Field>

        <div>
          <p className="mb-1 text-sm font-medium text-mist-200">
            Alternativas <span className="text-danger-400">*</span>
          </p>
          <p className="mb-2 text-xs text-ink-400">
            Marque a alternativa correta para confirmar o gabarito. Sem marcação, a questão fica como
            rascunho e não pode ser respondida.
          </p>
          <div className="space-y-2">
            {form.options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct-option"
                    checked={option.isCorrect}
                    onChange={() => markCorrect(index)}
                    aria-label={`Marcar alternativa ${option.label} como correta`}
                    className="size-4 accent-[var(--color-accent-500)]"
                  />
                  <span className="w-5 text-sm font-semibold text-ink-300">{option.label}</span>
                </label>
                <Input
                  value={option.text}
                  onChange={(e) => updateOption(index, { text: e.target.value })}
                  placeholder={`Alternativa ${option.label}`}
                />
                {form.type === 'multiple_choice' && form.options.length > 2 ? (
                  <button
                    type="button"
                    aria-label={`Remover alternativa ${option.label}`}
                    onClick={() =>
                      setForm((c) => ({
                        ...c,
                        options: c.options.filter((_, i) => i !== index),
                      }))
                    }
                    className="rounded-md px-2 py-1 text-ink-400 hover:bg-ink-750 hover:text-danger-400"
                  >
                    ✕
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          {form.type === 'multiple_choice' && form.options.length < 6 ? (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() =>
                setForm((c) => ({
                  ...c,
                  options: [
                    ...c.options,
                    { label: LETTERS[c.options.length] ?? '?', text: '', isCorrect: false },
                  ],
                }))
              }
            >
              + Adicionar alternativa
            </Button>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Fonte / banca" hint="Opcional">
            <Input
              value={form.source}
              onChange={(e) => setForm((c) => ({ ...c, source: e.target.value }))}
              placeholder="Ex.: CESPE 2024"
            />
          </Field>
          <Field label="Tags" hint="Separadas por vírgula">
            <Input
              value={form.tags}
              onChange={(e) => setForm((c) => ({ ...c, tags: e.target.value }))}
            />
          </Field>
        </div>

        <Field label="Comentário / explicação" hint="Opcional">
          <Textarea
            value={form.explanation}
            onChange={(e) => setForm((c) => ({ ...c, explanation: e.target.value }))}
          />
        </Field>
      </div>
    </Modal>
  )
}

function QuickDiscipline({ onCreate }: { onCreate: (name: string) => void }) {
  const [name, setName] = useState('')
  return (
    <div className="rounded-lg border border-ink-600 bg-ink-800 p-3">
      <p className="text-sm text-mist-200">Nenhuma disciplina cadastrada ainda.</p>
      <div className="mt-2 flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Direito Constitucional"
        />
        <Button
          variant="secondary"
          disabled={name.trim().length === 0}
          onClick={() => {
            onCreate(name.trim())
            setName('')
          }}
        >
          Criar
        </Button>
      </div>
    </div>
  )
}
