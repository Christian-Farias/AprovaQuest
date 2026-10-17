import { useMemo, useState } from 'react'
import type { Question, QuestionStatus } from '@/shared/db/types'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Field, Input, Select } from '@/shared/ui/Field'
import { PageHeader } from '@/shared/ui/PageHeader'
import { SkeletonList } from '@/shared/ui/LoadingState'
import { useToast } from '@/shared/toast/useToast'
import { useConfirm } from '@/shared/ui/ConfirmDialog'
import { useDisciplines, useSubjects, useTopics, useQuestions } from '../application/questions.hooks'
import { useQuestionsService } from '../application/useQuestionsService'
import { QuestionFormModal } from './QuestionFormModal'
import { PracticeModal } from './PracticeModal'

type StatusFilter = QuestionStatus | 'all'

export function QuestionsPage() {
  const [disciplineId, setDisciplineId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [topicId, setTopicId] = useState('')
  const [status, setStatus] = useState<StatusFilter>('active')
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Question | undefined>()
  const [practicing, setPracticing] = useState<Question | undefined>()

  const disciplines = useDisciplines()
  const subjects = useSubjects(disciplineId || undefined)
  const topics = useTopics({ disciplineId: disciplineId || undefined, subjectId: subjectId || undefined })
  const questions = useQuestions({
    disciplineId: disciplineId || undefined,
    subjectId: subjectId || undefined,
    topicId: topicId || undefined,
    status: status === 'all' ? undefined : status,
  })
  const service = useQuestionsService()
  const toast = useToast()
  const confirm = useConfirm()

  const disciplineNames = useMemo(
    () => new Map((disciplines ?? []).map((d) => [d.id, d.name])),
    [disciplines],
  )

  const searchLower = search.trim().toLowerCase()
  const filteredQuestions = useMemo(
    () =>
      !questions || !searchLower
        ? questions
        : questions.filter((q) => q.statement.toLowerCase().includes(searchLower)),
    [questions, searchLower],
  )

  async function handleDelete(question: Question) {
    const ok = await confirm({
      title: 'Excluir esta questão?',
      description:
        'Questões com tentativas registradas não podem ser excluídas — apenas arquivadas. Esta ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
      danger: true,
    })
    if (!ok) return
    const result = await service.deleteQuestion(question.id)
    if (result.ok) {
      toast.notify({ tone: 'success', title: 'Questão excluída' })
    } else {
      toast.notify({ tone: 'error', title: 'Não foi possível excluir', description: result.error.message })
    }
  }

  async function handleToggleArchive(question: Question) {
    const action = question.status === 'archived' ? service.unarchiveQuestion : service.archiveQuestion
    const result = await action(question.id)
    if (result.ok) {
      toast.notify({
        tone: 'success',
        title: question.status === 'archived' ? 'Questão reativada' : 'Questão arquivada',
      })
    } else {
      toast.notify({ tone: 'error', title: 'Falha na operação', description: result.error.message })
    }
  }

  return (
    <div>
      <PageHeader
        title="Questões"
        description="Seu banco de questões. Todas as tentativas ficam registradas no histórico e nunca são sobrescritas."
        action={
          <Button
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
          >
            + Nova questão
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:max-w-5xl">
        <Field label="Busca textual">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar no enunciado…"
          />
        </Field>
        <Field label="Disciplina">
          <Select value={disciplineId} onChange={(e) => { setDisciplineId(e.target.value); setSubjectId(''); setTopicId('') }}>
            <option value="">Todas</option>
            {(disciplines ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Assunto">
          <Select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setTopicId('') }} disabled={!disciplineId}>
            <option value="">Todos</option>
            {(subjects ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tópico">
          <Select value={topicId} onChange={(e) => setTopicId(e.target.value)} disabled={!disciplineId && !subjectId}>
            <option value="">Todos</option>
            {(topics ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Situação">
          <Select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
            <option value="active">Ativas</option>
            <option value="archived">Arquivadas</option>
            <option value="all">Todas</option>
          </Select>
        </Field>
      </div>

      {questions === undefined ? (
        <SkeletonList />
      ) : filteredQuestions !== undefined && filteredQuestions.length === 0 ? (
        <EmptyState
          title={search ? 'Nenhuma questão encontrada' : 'Nenhuma questão por aqui'}
          description={
            search
              ? `Nenhuma questão contém "${search}" no enunciado. Tente outros termos ou limpe a busca.`
              : 'Cadastre uma questão manualmente ou importe um PDF na página "Importar PDFs". Nada é criado automaticamente.'
          }
          action={
            !search ? (
              <Button
                onClick={() => {
                  setEditing(undefined)
                  setFormOpen(true)
                }}
              >
                Cadastrar questão
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-3">
          {(filteredQuestions ?? []).map((question) => (
            <li key={question.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge tone="brand">
                        {question.type === 'true_false' ? 'Certo/Errado' : 'Múltipla escolha'}
                      </Badge>
                      <Badge>{disciplineNames.get(question.disciplineId) ?? 'Disciplina removida'}</Badge>
                      {question.status === 'archived' ? <Badge tone="warn">Arquivada</Badge> : null}
                      {question.annulled ? <Badge tone="danger">Anulada</Badge> : null}
                      {!question.answerConfirmed ? (
                        <Badge tone="warn">Gabarito não confirmado</Badge>
                      ) : null}
                    </div>
                    <p className="line-clamp-3 text-sm text-mist-200">{question.statement}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={!question.answerConfirmed || question.annulled}
                    onClick={() => setPracticing(question)}
                  >
                    Responder
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditing(question)
                      setFormOpen(true)
                    }}
                  >
                    Editar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleToggleArchive(question)}>
                    {question.status === 'archived' ? 'Reativar' : 'Arquivar'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(question)}>
                    Excluir
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <QuestionFormModal open={formOpen} onClose={() => setFormOpen(false)} question={editing} />
      {practicing ? (
        <PracticeModal open onClose={() => setPracticing(undefined)} question={practicing} />
      ) : null}
    </div>
  )
}
