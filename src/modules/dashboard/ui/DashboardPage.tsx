import { useOverallStats } from '@/modules/statistics/application/statistics.hooks'
import { useStreak } from '@/modules/statistics/application/useStreak'
import { useBadges } from '@/modules/badges/application/useBadges'
import { formatDurationMs, formatPercent } from '@/shared/lib/format'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StatCard } from '@/shared/ui/StatCard'
import { LoadingState, SkeletonList } from '@/shared/ui/LoadingState'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StreakDashboardCard } from '@/shared/ui/StreakBadge'

export function DashboardPage() {
  const stats = useOverallStats()
  const streak = useStreak()
  const badges = useBadges()

  if (stats === undefined) {
    return (
      <div>
        <PageHeader title="Painel" description="Visão geral dos seus estudos." />
        <LoadingState />
        <SkeletonList rows={2} />
      </div>
    )
  }

  const hasData = stats.questionCount > 0 || stats.accuracy.total > 0

  return (
    <div>
      <PageHeader
        title="Painel"
        description="Indicadores calculados em tempo real a partir das suas tentativas registradas."
      />

      {/* Streak card */}
      {streak !== undefined && <StreakDashboardCard streak={streak} />}

      {!hasData ? (
        <EmptyState
          title="Ainda sem dados para exibir"
          description="Cadastre ou importe questões e comece a responder. Os indicadores aparecerão aqui automaticamente — nada é preenchido com dados fictícios."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Questões" value={stats.questionCount} hint={`${stats.activeQuestionCount} ativas`} />
          <StatCard label="Tentativas" value={stats.accuracy.total} tone="brand" />
          <StatCard
            label="Aproveitamento"
            value={formatPercent(stats.accuracy.accuracyRate)}
            hint="entre tentativas respondidas"
            tone="accent"
          />
          <StatCard label="Tempo de estudo" value={formatDurationMs(stats.studyTimeMs)} />
          <StatCard
            label="Acertos"
            value={stats.accuracy.correct}
            tone="ok"
            hint={`${stats.accuracy.incorrect} erros`}
          />
          <StatCard
            label="Sem resposta"
            value={stats.accuracy.unanswered}
            tone="neutral"
            hint="não entram na taxa"
          />
          <StatCard
            label="Questões únicas"
            value={stats.unique.total}
            hint="pela tentativa mais recente"
          />
          <StatCard
            label="Aproveitamento único"
            value={formatPercent(stats.unique.accuracyRate)}
            hint="por questão"
            tone="accent"
          />
          {badges && (
            <StatCard
              label="Nível"
              value={badges.level.level}
              hint={`${badges.xp} XP · ${badges.unlockedCount}/${badges.badges.length} badges`}
              tone="brand"
            />
          )}
        </div>
      )}
    </div>
  )
}
