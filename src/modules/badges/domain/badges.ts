import type { Attempt, Question } from '@/shared/db/types'

export interface BadgeStats {
  totalAttempts: number
  answeredAttempts: number
  correctAttempts: number
  accuracy: number
  totalQuestions: number
  currentStreak: number
  bestStreak: number
  longestCorrectRun: number
  maxAttemptsInADay: number
  earlyBirdCount: number
  nightOwlCount: number
  distinctDaysStudied: number
  maxCorrectInDiscipline: number
}

export type BadgeGroup = 'volume' | 'precisao' | 'sequencia' | 'habito' | 'dedicacao'

export interface BadgeDefinition {
  id: string
  title: string
  description: string
  icon: string
  group: BadgeGroup
  target: number
  unit?: string
  /** Valor atual (clampeado no alvo para exibição de progresso). */
  value: (stats: BadgeStats) => number
}

export interface BadgeProgress extends BadgeDefinition {
  current: number
  progress: number
  unlocked: boolean
}

function toLocalDayKey(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function computeBadgeStats(
  attempts: Attempt[],
  questions: Question[],
  streak: { current: number; best: number } = { current: 0, best: 0 },
): BadgeStats {
  const answered = attempts.filter((a) => a.outcome !== 'unanswered')
  const correct = answered.filter((a) => a.outcome === 'correct')

  const ordered = [...attempts].sort(
    (a, b) => new Date(a.answeredAt).getTime() - new Date(b.answeredAt).getTime(),
  )

  let longestCorrectRun = 0
  let run = 0
  const perDay = new Map<string, number>()
  const perDisciplineCorrect = new Map<string, number>()
  const disciplineByQuestion = new Map(questions.map((q) => [q.id, q.disciplineId]))
  let earlyBirdCount = 0
  let nightOwlCount = 0

  for (const attempt of ordered) {
    const when = new Date(attempt.answeredAt)
    const hour = when.getHours()
    if (hour < 7) earlyBirdCount += 1
    if (hour >= 23) nightOwlCount += 1

    const dayKey = toLocalDayKey(attempt.answeredAt)
    perDay.set(dayKey, (perDay.get(dayKey) ?? 0) + 1)

    if (attempt.outcome === 'correct') {
      run += 1
      longestCorrectRun = Math.max(longestCorrectRun, run)
      const disciplineId = disciplineByQuestion.get(attempt.questionId)
      if (disciplineId) {
        perDisciplineCorrect.set(disciplineId, (perDisciplineCorrect.get(disciplineId) ?? 0) + 1)
      }
    } else {
      run = 0
    }
  }

  const maxAttemptsInADay = perDay.size === 0 ? 0 : Math.max(...perDay.values())
  const maxCorrectInDiscipline =
    perDisciplineCorrect.size === 0 ? 0 : Math.max(...perDisciplineCorrect.values())

  return {
    totalAttempts: attempts.length,
    answeredAttempts: answered.length,
    correctAttempts: correct.length,
    accuracy: answered.length > 0 ? (correct.length / answered.length) * 100 : 0,
    totalQuestions: questions.length,
    currentStreak: streak.current,
    bestStreak: streak.best,
    longestCorrectRun,
    maxAttemptsInADay,
    earlyBirdCount,
    nightOwlCount,
    distinctDaysStudied: perDay.size,
    maxCorrectInDiscipline,
  }
}

const MIN_ACCURACY_SAMPLE = 20

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Volume
  { id: 'first_step', title: 'Primeiro passo', description: 'Responda 1 questão', icon: '🌱', group: 'volume', target: 1, unit: 'questões', value: (s) => s.totalAttempts },
  { id: 'ten_questions', title: 'Aquecendo', description: 'Responda 10 questões', icon: '📘', group: 'volume', target: 10, unit: 'questões', value: (s) => s.totalAttempts },
  { id: 'fifty_questions', title: 'Ritmo constante', description: 'Responda 50 questões', icon: '📗', group: 'volume', target: 50, unit: 'questões', value: (s) => s.totalAttempts },
  { id: 'hundred_questions', title: 'Centurião', description: 'Responda 100 questões', icon: '💯', group: 'volume', target: 100, unit: 'questões', value: (s) => s.totalAttempts },
  { id: 'five_hundred_questions', title: 'Maratonista', description: 'Responda 500 questões', icon: '🏃', group: 'volume', target: 500, unit: 'questões', value: (s) => s.totalAttempts },
  { id: 'thousand_questions', title: 'Milhar', description: 'Responda 1000 questões', icon: '🏆', group: 'volume', target: 1000, unit: 'questões', value: (s) => s.totalAttempts },

  // Precisão
  {
    id: 'accuracy_50',
    title: 'Na média',
    description: `Acerte 50% (mínimo ${MIN_ACCURACY_SAMPLE} respostas)`,
    icon: '🎯',
    group: 'precisao',
    target: 50,
    unit: '%',
    value: (s) => (s.answeredAttempts >= MIN_ACCURACY_SAMPLE ? Math.round(s.accuracy) : 0),
  },
  {
    id: 'accuracy_70',
    title: 'Afiação',
    description: 'Acerte 70% (mínimo 50 respostas)',
    icon: '🎖️',
    group: 'precisao',
    target: 70,
    unit: '%',
    value: (s) => (s.answeredAttempts >= 50 ? Math.round(s.accuracy) : 0),
  },
  {
    id: 'accuracy_90',
    title: 'Precisão cirúrgica',
    description: 'Acerte 90% (mínimo 100 respostas)',
    icon: '🥇',
    group: 'precisao',
    target: 90,
    unit: '%',
    value: (s) => (s.answeredAttempts >= 100 ? Math.round(s.accuracy) : 0),
  },

  // Sequência
  { id: 'streak_3', title: 'Pegando fogo', description: 'Sequência de 3 dias', icon: '🔥', group: 'sequencia', target: 3, unit: 'dias', value: (s) => s.bestStreak },
  { id: 'streak_7', title: 'Semana perfeita', description: 'Sequência de 7 dias', icon: '🗓️', group: 'sequencia', target: 7, unit: 'dias', value: (s) => s.bestStreak },
  { id: 'streak_30', title: 'Mês de ferro', description: 'Sequência de 30 dias', icon: '🧱', group: 'sequencia', target: 30, unit: 'dias', value: (s) => s.bestStreak },
  { id: 'streak_100', title: 'Lenda', description: 'Sequência de 100 dias', icon: '🐉', group: 'sequencia', target: 100, unit: 'dias', value: (s) => s.bestStreak },

  // Hábito
  { id: 'marathon_day', title: 'Modo revisão', description: 'Responda 50 questões em um único dia', icon: '⚡', group: 'habito', target: 50, unit: 'questões', value: (s) => s.maxAttemptsInADay },
  { id: 'early_bird', title: 'Madrugador', description: 'Responda 10 questões antes das 7h', icon: '🌅', group: 'habito', target: 10, unit: 'questões', value: (s) => s.earlyBirdCount },
  { id: 'night_owl', title: 'Coruja', description: 'Responda 10 questões depois das 23h', icon: '🌙', group: 'habito', target: 10, unit: 'questões', value: (s) => s.nightOwlCount },
  { id: 'dedicated_30', title: 'Assíduo', description: 'Estude em 30 dias diferentes', icon: '📅', group: 'habito', target: 30, unit: 'dias', value: (s) => s.distinctDaysStudied },

  // Dedicação
  { id: 'perfect_run', title: 'Sequência perfeita', description: 'Acerte 10 questões seguidas', icon: '✨', group: 'dedicacao', target: 10, unit: 'acertos', value: (s) => s.longestCorrectRun },
  { id: 'discipline_master', title: 'Domínio', description: 'Acerte 100 questões da mesma disciplina', icon: '👑', group: 'dedicacao', target: 100, unit: 'acertos', value: (s) => s.maxCorrectInDiscipline },
  { id: 'author', title: 'Autor', description: 'Cadastre 50 questões', icon: '✍️', group: 'dedicacao', target: 50, unit: 'questões', value: (s) => s.totalQuestions },
]

export function computeBadges(stats: BadgeStats): BadgeProgress[] {
  return BADGE_DEFINITIONS.map((badge) => {
    const raw = badge.value(stats)
    const current = Math.max(0, Math.min(raw, badge.target))
    return {
      ...badge,
      current,
      progress: badge.target > 0 ? current / badge.target : 0,
      unlocked: raw >= badge.target,
    }
  })
}
