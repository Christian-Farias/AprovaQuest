import { PageHeader } from '@/shared/ui/PageHeader'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { useToast } from '@/shared/toast/useToast'
import { usePendingReviews, useAllReviews, useReviewsService } from '../application/reviews.service'
import { useState } from 'react'
import type { Review } from '@/shared/db/types'

const STATUS_LABELS = {
  pending: 'Pendente',
  done: 'Concluída',
  postponed: 'Adiada',
  cancelled: 'Cancelada',
} as const

const STATUS_TONES = {
  pending: 'warn',
  done: 'ok',
  postponed: 'neutral',
  cancelled: 'danger',
} as const

function ReviewCard({ review, onMark }: { review: Review; onMark: (id: string, status: 'done' | 'postponed' | 'cancelled') => void }) {
  const dueDate = new Date(review.dueAt)
  const isOverdue = dueDate < new Date() && review.status === 'pending'
  const offsetLabel = review.offsetDays === 1
    ? '1 dia'
    : review.offsetDays === 7
    ? '1 semana'
    : `${review.offsetDays} dias`

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge tone={STATUS_TONES[review.status]}>{STATUS_LABELS[review.status]}</Badge>
            <Badge>Revisão +{offsetLabel}</Badge>
            {isOverdue && <Badge tone="danger">Atrasada</Badge>}
          </div>
          <p className="text-sm text-mist-200">
            Questão: <code className="font-mono text-xs text-ink-400">{review.questionId.slice(0, 12)}…</code>
          </p>
          <p className="mt-0.5 text-xs text-ink-400">
            Prevista para {dueDate.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            {review.completedAt && ` · Concluída em ${new Date(review.completedAt).toLocaleDateString('pt-BR')}`}
            {review.postponedTo && ` · Adiada para ${new Date(review.postponedTo).toLocaleDateString('pt-BR')}`}
          </p>
        </div>
      </div>
      {review.status === 'pending' && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onMark(review.id, 'done')}>
            ✓ Revisada
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onMark(review.id, 'postponed')}>
            Adiar 1 dia
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onMark(review.id, 'cancelled')}>
            Cancelar
          </Button>
        </div>
      )}
    </Card>
  )
}

export function ReviewsPage() {
  const service = useReviewsService()
  const toast = useToast()
  const pending = usePendingReviews()
  const all = useAllReviews()
  const [viewTab, setViewTab] = useState<'pending' | 'all'>('pending')

  const shown = viewTab === 'pending' ? pending : all

  async function handleMark(id: string, status: 'done' | 'postponed' | 'cancelled') {
    const result = await service.markReview(id, status)
    if (!result.ok) {
      toast.notify({ tone: 'error', title: 'Erro ao atualizar revisão', description: result.error.message })
    } else {
      const msgs = { done: 'Revisão concluída!', postponed: 'Revisão adiada.', cancelled: 'Revisão cancelada.' }
      toast.notify({ tone: status === 'done' ? 'success' : 'info', title: msgs[status] })
    }
  }

  return (
    <div>
      <PageHeader
        title="Revisão Espaçada"
        description="Questões agendadas para revisão em intervalos de 1, 7 e 30 dias após cada erro registrado."
      />

      <div className="mb-4 flex items-center gap-2">
        {(['pending', 'all'] as const).map((tab) => (
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
            {tab === 'pending' ? (
              <span className="flex items-center gap-1.5">
                Pendentes hoje
                {pending !== undefined && pending.length > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-warn-500 text-[10px] font-bold text-ink-950">
                    {pending.length}
                  </span>
                )}
              </span>
            ) : 'Todas'}
          </button>
        ))}
      </div>

      {shown === undefined ? (
        <div className="py-8 text-center text-sm text-ink-400">Carregando…</div>
      ) : shown.length === 0 ? (
        <EmptyState
          title={viewTab === 'pending' ? 'Nenhuma revisão pendente para hoje!' : 'Nenhuma revisão agendada'}
          description={
            viewTab === 'pending'
              ? 'Ótimo! Você está em dia com as revisões. Quando errar questões, revisões serão agendadas automaticamente.'
              : 'Revisões são criadas automaticamente ao registrar erros no Caderno de Erros.'
          }
        />
      ) : (
        <ul className="space-y-3">
          {shown.map((review) => (
            <li key={review.id}>
              <ReviewCard review={review} onMark={handleMark} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
