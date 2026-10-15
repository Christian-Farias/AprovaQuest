import { useMemo, useState } from 'react'
import { Badge } from '@/shared/ui/Badge'
import { Card, CardHeader } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Field, Input, Select } from '@/shared/ui/Field'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StatCard } from '@/shared/ui/StatCard'
import { LoadingState } from '@/shared/ui/LoadingState'
import { formatDurationMs, formatPercent } from '@/shared/lib/format'
import type { GroupStats, StatsFilters } from '../domain/statistics'
import { useStatisticsReport } from '../application/useStatisticsReport'

interface FilterState {
  disciplineId: string
  boardId: string
  contestId: string
  from: string
  to: string
  includeAnnulled: boolean
  includeArchived: boolean
}

const initialFilters: FilterState = {
  disciplineId: '',
  boardId: '',
  contestId: '',
  from: '',
  to: '',
  includeAnnulled: false,
  includeArchived: true,
}

function toStatsFilters(state: FilterState): StatsFilters {
  return {
    disciplineId: state.disciplineId || undefined,
    boardId: state.boardId || undefined,
    contestId: state.contestId || undefined,
    from: state.from ? `${state.from}T00:00:00.000Z` : undefined,
    to: state.to ? `${state.to}T23:59:59.999Z` : undefined,
    includeAnnulled: state.includeAnnulled,
    includeArchived: state.includeArchived,
  }
}

function GroupSection({ title, groups }: { title: string; groups: GroupStats[] }) {
  return (
    <Card>
      <CardHeader title={title} />
      {groups.length === 0 ? (
        <p className="py-3 text-sm text-ink-400">Sem dados para este agrupamento.</p>
      ) : (
        <ul className="divide-y divide-ink-700">
          {groups.map((group) => (
            <li key={group.key} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm text-mist-200">{group.label}</p>
                <p className="text-xs text-ink-400">
                  {group.total} tentativas · {group.correct} acertos · {group.incorrect} erros
                  {group.unanswered > 0 ? ` · ${group.unanswered} sem resposta` : ''}
                </p>
              </div>
              <Badge
                tone={
                  group.accuracyRate === null
                    ? 'neutral'
                    : group.accuracyRate >= 0.7
                      ? 'ok'
                      : group.accuracyRate >= 0.5
                        ? 'warn'
                        : 'danger'
                }
              >
                {formatPercent(group.accuracyRate)}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export function StatisticsPage() {
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const statsFilters = useMemo(() => toStatsFilters(filters), [filters])
  const report = useStatisticsReport(statsFilters)

  function update<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  if (!report) {
    return (
      <div>
        <PageHeader title="Estatísticas" description="Desempenho calculado a partir das suas tentativas." />
        <LoadingState />
      </div>
    )
  }

  const { accuracy, unique } = report
  const hasAnyAttempt = accuracy.total > 0

  return (
    <div>
      <PageHeader
        title="Estatísticas"
        description="Todos os números vêm das tentativas registradas no seu dispositivo. Questões anuladas ficam fora por padrão."
      />

      <Card className="mb-4">
        <CardHeader title="Filtros combináveis" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Disciplina">
            <Select value={filters.disciplineId} onChange={(e) => update('disciplineId', e.target.value)}>
              <option value="">Todas</option>
              {report.disciplineOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Banca">
            <Select value={filters.boardId} onChange={(e) => update('boardId', e.target.value)}>
              <option value="">Todas</option>
              {report.boardOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Concurso">
            <Select value={filters.contestId} onChange={(e) => update('contestId', e.target.value)}>
              <option value="">Todos</option>
              {report.contestOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="De">
            <Input type="date" value={filters.from} onChange={(e) => update('from', e.target.value)} />
          </Field>
          <Field label="Até">
            <Input type="date" value={filters.to} onChange={(e) => update('to', e.target.value)} />
          </Field>
          <div className="flex items-end gap-4 pb-1">
            <label className="flex items-center gap-2 text-sm text-mist-200">
              <input
                type="checkbox"
                className="size-4 accent-[var(--color-accent-500)]"
                checked={filters.includeAnnulled}
                onChange={(e) => update('includeAnnulled', e.target.checked)}
              />
              Incluir anuladas
            </label>
            <label className="flex items-center gap-2 text-sm text-mist-200">
              <input
                type="checkbox"
                className="size-4 accent-[var(--color-accent-500)]"
                checked={filters.includeArchived}
                onChange={(e) => update('includeArchived', e.target.checked)}
              />
              Incluir arquivadas
            </label>
          </div>
        </div>
      </Card>

      {!hasAnyAttempt ? (
        <EmptyState
          title="Sem tentativas no período/filtros"
          description="Responda questões para gerar estatísticas. Ajuste os filtros se esperava ver dados aqui."
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Tentativas" value={accuracy.total} tone="brand" />
            <StatCard label="Aproveitamento" value={formatPercent(accuracy.accuracyRate)} tone="accent" hint={`${accuracy.answered} respondidas`} />
            <StatCard label="Acertos" value={accuracy.correct} tone="ok" />
            <StatCard label="Erros" value={accuracy.incorrect} tone="danger" />
            <StatCard label="Sem resposta" value={accuracy.unanswered} />
            <StatCard label="Tempo de estudo" value={formatDurationMs(report.studyTimeMs)} />
            <StatCard label="Questões únicas" value={unique.total} hint="pela mais recente" />
            <StatCard label="Aproveitamento único" value={formatPercent(unique.accuracyRate)} tone="accent" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <GroupSection title="Por disciplina" groups={report.byDiscipline} />
            <GroupSection title="Por assunto" groups={report.byTopic} />
            <GroupSection title="Por banca" groups={report.byBoard} />
            <GroupSection title="Por concurso" groups={report.byContest} />
          </div>

          <Card>
            <CardHeader title="Evolução diária" description="Tentativas por dia (UTC)." />
            <ul className="divide-y divide-ink-700">
              {report.daily.map((point) => (
                <li key={point.day} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="text-mist-200">{point.day}</span>
                  <span className="text-ink-300">
                    {point.total} tentativas · {point.correct} acertos · {point.incorrect} erros
                    {point.unanswered > 0 ? ` · ${point.unanswered} sem resposta` : ''} ·{' '}
                    {formatDurationMs(point.durationMs)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  )
}
