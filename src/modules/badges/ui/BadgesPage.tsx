import { PageHeader } from '@/shared/ui/PageHeader'
import { Card } from '@/shared/ui/Card'
import { LoadingState } from '@/shared/ui/LoadingState'
import { useBadges } from '../application/useBadges'
import type { BadgeProgress } from '../domain/badges'

function BadgeTile({ badge }: { badge: BadgeProgress }) {
  const pct = Math.round(badge.progress * 100)
  return (
    <div
      className={`flex flex-col rounded-xl border p-3 transition-colors ${
        badge.unlocked
          ? 'border-accent-500/40 bg-accent-500/5'
          : 'border-ink-700 bg-ink-850'
      }`}
    >
      <div className="flex items-start gap-2">
        <span className={`text-2xl ${badge.unlocked ? '' : 'opacity-40 grayscale'}`}>{badge.icon}</span>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${badge.unlocked ? 'text-mist-100' : 'text-mist-300'}`}>
            {badge.title}
          </p>
          <p className="text-xs text-ink-400">{badge.description}</p>
        </div>
        {badge.unlocked && <span className="text-accent-400 text-xs font-bold">✓</span>}
      </div>
      <div className="mt-2">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              badge.unlocked ? 'bg-accent-500' : 'bg-ink-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] tabular-nums text-ink-400">
          {badge.current}/{badge.target}
          {badge.unit ? ` ${badge.unit}` : ''}
        </p>
      </div>
    </div>
  )
}

export function BadgesPage() {
  const summary = useBadges()

  if (summary === undefined) {
    return (
      <div>
        <PageHeader title="Badges" description="Conquistas e progresso" />
        <LoadingState />
      </div>
    )
  }

  const { level, xp, badges, unlockedCount } = summary
  const unlocked = badges.filter((b) => b.unlocked)
  const locked = badges.filter((b) => !b.unlocked)

  return (
    <div className="space-y-4">
      <PageHeader title="Badges" description="Conquistas e progresso" />

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-mist-300">
              Nível <span className="font-bold text-accent-400">{level.level}</span>
            </p>
            <p className="text-xs text-ink-400 tabular-nums">
              {level.current}/{level.needed} XP para o próximo nível · {xp} XP total
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black tabular-nums text-accent-400">
              {unlockedCount}
              <span className="text-sm font-normal text-ink-400">/{badges.length}</span>
            </p>
            <p className="text-[11px] text-ink-400">badges conquistados</p>
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink-700">
          <div
            className="h-full rounded-full bg-accent-500 transition-all duration-500"
            style={{ width: `${Math.round((level.current / level.needed) * 100)}%` }}
          />
        </div>
      </Card>

      {unlocked.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-mist-200">
            Conquistados ({unlocked.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {unlocked.map((badge) => (
              <BadgeTile key={badge.id} badge={badge} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-mist-200">
          Em progresso ({locked.length})
        </h2>
        {locked.length === 0 ? (
          <Card>
            <p className="text-sm text-mist-300">Você conquistou todos os badges! 🏆</p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {locked.map((badge) => (
              <BadgeTile key={badge.id} badge={badge} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
