import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyState } from '@/shared/ui/EmptyState'

export function SchedulePage() {
  return (
    <div>
      <PageHeader
        title="Cronograma"
        description="Planejamento determinístico a partir de disponibilidades, metas e revisões."
      />
      <EmptyState
        title="Cronograma ainda não implementado"
        description="Reorganização de sessões pendentes, prioridades e motivos de priorização vêm em etapas futuras."
      />
    </div>
  )
}
