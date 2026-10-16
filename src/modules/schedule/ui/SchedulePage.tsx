import { useState } from 'react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Card, CardHeader } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Button } from '@/shared/ui/Button'
import { Badge } from '@/shared/ui/Badge'
import { Modal } from '@/shared/ui/Modal'
import { Field, Input, Select } from '@/shared/ui/Field'
import { useToast } from '@/shared/toast/useToast'
import { useConfirm } from '@/shared/ui/ConfirmDialog'
import { useDisciplines } from '@/modules/questions/application/questions.hooks'
import { useActivePlan, usePlans, useSessions, useAvailability } from '../application/schedule.hooks'
import { useScheduleService } from '../application/schedule.service'
import type { StudySession, SessionStatus } from '@/shared/db/types'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const SESSION_TYPE_LABELS = {
  theory: 'Teoria',
  questions: 'Questões',
  review: 'Revisão',
} as const

const STATUS_BADGE: Record<SessionStatus, { label: string; tone: 'ok' | 'warn' | 'neutral' | 'danger' | 'brand' }> = {
  planned: { label: 'Planejada', tone: 'brand' },
  done: { label: 'Concluída', tone: 'ok' },
  skipped: { label: 'Pulada', tone: 'warn' },
  moved: { label: 'Movida', tone: 'neutral' },
}

function CreatePlanModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const service = useScheduleService()
  const toast = useToast()
  const [name, setName] = useState('')
  const [examDate, setExamDate] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!name.trim()) return
    setSaving(true)
    const result = await service.createPlan({ name, examDate: examDate || null })
    setSaving(false)
    if (result.ok) {
      toast.notify({ tone: 'success', title: 'Plano criado' })
      setName('')
      setExamDate('')
      onClose()
    } else {
      toast.notify({ tone: 'error', title: 'Erro ao criar plano', description: result.error.message })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo plano de estudos"
      description="Crie um plano para organizar suas sessões de estudo."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSubmit} loading={saving} disabled={!name.trim()}>Criar plano</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nome do plano" required>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Concurso TJSP 2025"
            autoFocus
          />
        </Field>
        <Field label="Data do exame" hint="Opcional">
          <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}

function CreateSessionModal({
  open,
  onClose,
  planId,
}: {
  open: boolean
  onClose: () => void
  planId?: string
}) {
  const service = useScheduleService()
  const toast = useToast()
  const disciplines = useDisciplines()
  const [form, setForm] = useState({
    title: '',
    type: 'questions' as StudySession['type'],
    disciplineId: '',
    scheduledAt: new Date().toISOString().slice(0, 16),
    plannedDurationMin: 60,
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!form.title.trim()) return
    setSaving(true)
    const result = await service.createSession({
      planId: planId ?? null,
      type: form.type,
      disciplineId: form.disciplineId || null,
      title: form.title,
      plannedDurationMin: form.plannedDurationMin,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
    })
    setSaving(false)
    if (result.ok) {
      toast.notify({ tone: 'success', title: 'Sessão criada' })
      setForm({
        title: '',
        type: 'questions',
        disciplineId: '',
        scheduledAt: new Date().toISOString().slice(0, 16),
        plannedDurationMin: 60,
      })
      onClose()
    } else {
      toast.notify({ tone: 'error', title: 'Erro ao criar sessão', description: result.error.message })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nova sessão de estudo"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSubmit} loading={saving} disabled={!form.title.trim()}>Criar sessão</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Título" required>
          <Input
            value={form.title}
            onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))}
            placeholder="Ex.: Revisão de Direito Constitucional"
            autoFocus
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo">
            <Select
              value={form.type}
              onChange={(e) => setForm((c) => ({ ...c, type: e.target.value as StudySession['type'] }))}
            >
              <option value="questions">Questões</option>
              <option value="theory">Teoria</option>
              <option value="review">Revisão</option>
            </Select>
          </Field>
          <Field label="Disciplina" hint="Opcional">
            <Select
              value={form.disciplineId}
              onChange={(e) => setForm((c) => ({ ...c, disciplineId: e.target.value }))}
            >
              <option value="">Geral</option>
              {(disciplines ?? []).map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data e hora">
            <Input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => setForm((c) => ({ ...c, scheduledAt: e.target.value }))}
            />
          </Field>
          <Field label="Duração planejada (min)">
            <Input
              type="number"
              min={5}
              max={480}
              value={form.plannedDurationMin}
              onChange={(e) => setForm((c) => ({ ...c, plannedDurationMin: Number(e.target.value) }))}
            />
          </Field>
        </div>
      </div>
    </Modal>
  )
}

function AvailabilityCard({ planId }: { planId: string }) {
  const service = useScheduleService()
  const toast = useToast()
  const availability = useAvailability(planId)
  const byWeekday = new Map((availability ?? []).map((a) => [a.weekday, a.minutes]))

  async function handleChange(weekday: number, value: string) {
    const minutes = Math.max(0, Math.min(720, Number(value) || 0))
    const result = await service.setAvailability(planId, weekday, minutes)
    if (!result.ok) {
      toast.notify({ tone: 'error', title: 'Erro ao salvar disponibilidade', description: result.error.message })
    }
  }

  return (
    <Card>
      <CardHeader
        title="Disponibilidade semanal"
        description="Quantos minutos por dia você tem para estudar? (0 = dia livre)"
      />
      <div className="grid grid-cols-7 gap-2">
        {WEEKDAYS.map((day, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-xs font-medium text-ink-400">{day}</span>
            <input
              type="number"
              min={0}
              max={720}
              defaultValue={byWeekday.get(i) ?? 0}
              onBlur={(e) => handleChange(i, e.target.value)}
              className="w-full rounded-lg border border-ink-600 bg-ink-900 px-2 py-1.5 text-center text-sm text-mist-100 focus:border-brand-500 focus:outline-none"
            />
            <span className="text-[10px] text-ink-500">min</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function SessionCard({
  session,
  onStatusChange,
  onDelete,
}: {
  session: StudySession
  onStatusChange: (id: string, status: SessionStatus) => void
  onDelete: (id: string) => void
}) {
  const badge = STATUS_BADGE[session.status]
  const scheduledDate = new Date(session.scheduledAt)

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge>{SESSION_TYPE_LABELS[session.type]}</Badge>
            <Badge tone={badge.tone}>{badge.label}</Badge>
          </div>
          <p className="font-medium text-mist-100">{session.title}</p>
          <p className="mt-0.5 text-xs text-ink-400">
            {scheduledDate.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
            {' · '}
            {scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            {' · '}
            {session.plannedDurationMin} min planejados
            {session.actualDurationMin ? ` · ${session.actualDurationMin} min reais` : ''}
          </p>
        </div>
      </div>
      {session.status === 'planned' && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onStatusChange(session.id, 'done')}>
            ✓ Concluída
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onStatusChange(session.id, 'skipped')}>
            Pular
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(session.id)}>
            Excluir
          </Button>
        </div>
      )}
    </Card>
  )
}

export function SchedulePage() {
  const service = useScheduleService()
  const toast = useToast()
  const confirm = useConfirm()

  const plans = usePlans()
  const activePlan = useActivePlan()
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>()

  const currentPlanId = selectedPlanId ?? activePlan?.id
  const sessions = useSessions(currentPlanId)

  const [createPlanOpen, setCreatePlanOpen] = useState(false)
  const [createSessionOpen, setCreateSessionOpen] = useState(false)
  const [viewTab, setViewTab] = useState<'upcoming' | 'all'>('upcoming')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const filtered = (sessions ?? []).filter((s) => {
    if (viewTab === 'upcoming') {
      return s.status === 'planned' || new Date(s.scheduledAt) >= today
    }
    return true
  })

  async function handleStatusChange(id: string, status: SessionStatus) {
    const result = await service.updateSessionStatus(id, status)
    if (!result.ok) {
      toast.notify({ tone: 'error', title: 'Erro ao atualizar sessão', description: result.error.message })
    }
  }

  async function handleDelete(id: string) {
    const ok = await confirm({
      title: 'Excluir sessão?',
      description: 'Esta ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
      danger: true,
    })
    if (!ok) return
    const result = await service.deleteSession(id)
    if (!result.ok) {
      toast.notify({ tone: 'error', title: 'Erro ao excluir sessão', description: result.error.message })
    }
  }

  async function handleArchivePlan(planId: string) {
    const ok = await confirm({
      title: 'Arquivar este plano?',
      description: 'O plano será arquivado e suas sessões serão preservadas.',
      confirmLabel: 'Arquivar',
    })
    if (!ok) return
    const result = await service.archivePlan(planId)
    if (!result.ok) {
      toast.notify({ tone: 'error', title: 'Erro ao arquivar plano', description: result.error.message })
    }
  }

  return (
    <div>
      <PageHeader
        title="Cronograma"
        description="Planejamento determinístico a partir de disponibilidades, metas e revisões."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setCreatePlanOpen(true)}>
              + Novo plano
            </Button>
            {currentPlanId && (
              <Button onClick={() => setCreateSessionOpen(true)}>
                + Nova sessão
              </Button>
            )}
          </div>
        }
      />

      {/* Plan selector */}
      {plans && plans.length > 0 && (
        <div className="mb-4">
          <Card>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-0">
                <Field label="Plano ativo">
                  <Select
                    value={currentPlanId ?? ''}
                    onChange={(e) => setSelectedPlanId(e.target.value || undefined)}
                  >
                    <option value="">Sem plano selecionado</option>
                    {(plans ?? []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}{p.status === 'archived' ? ' (arquivado)' : ''}
                        {p.examDate ? ` — exame ${new Date(p.examDate).toLocaleDateString('pt-BR')}` : ''}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              {currentPlanId && plans.find((p) => p.id === currentPlanId)?.status === 'active' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="self-end mb-0.5"
                  onClick={() => handleArchivePlan(currentPlanId)}
                >
                  Arquivar plano
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Empty state — no plans at all */}
      {plans !== undefined && plans.length === 0 && (
        <EmptyState
          title="Nenhum plano de estudos"
          description="Crie um plano para começar a organizar suas sessões de estudo."
          action={<Button onClick={() => setCreatePlanOpen(true)}>Criar plano</Button>}
        />
      )}

      {/* Availability */}
      {currentPlanId && (
        <div className="mb-4">
          <AvailabilityCard planId={currentPlanId} />
        </div>
      )}

      {/* Sessions */}
      {currentPlanId && (
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex gap-1">
              {(['upcoming', 'all'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setViewTab(tab)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    viewTab === tab
                      ? 'bg-accent-500/15 text-accent-300'
                      : 'text-ink-300 hover:bg-ink-750 hover:text-mist-100'
                  }`}
                >
                  {tab === 'upcoming' ? 'Próximas' : 'Todas'}
                </button>
              ))}
            </div>
            <span className="text-sm text-ink-400">{filtered.length} sessão(ões)</span>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="Nenhuma sessão encontrada"
              description="Crie a primeira sessão de estudo para este plano."
              action={<Button onClick={() => setCreateSessionOpen(true)}>+ Nova sessão</Button>}
            />
          ) : (
            <ul className="space-y-3">
              {filtered.map((session) => (
                <li key={session.id}>
                  <SessionCard
                    session={session}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <CreatePlanModal open={createPlanOpen} onClose={() => setCreatePlanOpen(false)} />
      <CreateSessionModal
        open={createSessionOpen}
        onClose={() => setCreateSessionOpen(false)}
        planId={currentPlanId}
      />
    </div>
  )
}
