import type { Attempt, Question } from '@/shared/db/types'
import { toDayKey } from '@/shared/lib/dates'

export interface StatsFilters {
  disciplineId?: string
  topicId?: string
  boardId?: string
  contestId?: string
  /** ISO inclusivo (>=). */
  from?: string
  /** ISO inclusivo (<=). */
  to?: string
  /** Inclui questões anuladas nos cálculos. Padrão: false. */
  includeAnnulled?: boolean
  /** Inclui questões arquivadas nos cálculos. Padrão: true (histórico preservado). */
  includeArchived?: boolean
}

export interface AccuracyStats {
  /** Todas as tentativas consideradas (inclui não respondidas). */
  total: number
  /** Tentativas com resposta (correct + incorrect). Denominador das taxas. */
  answered: number
  correct: number
  incorrect: number
  /** Tentativas sem resposta registrada (outcome = 'unanswered'). */
  unanswered: number
  /** correct / answered; null quando não há tentativas respondidas (evita divisão por zero). */
  accuracyRate: number | null
  /** incorrect / answered; null quando não há tentativas respondidas. */
  errorRate: number | null
}

export interface UniqueQuestionStats {
  total: number
  correct: number
  incorrect: number
  unanswered: number
  accuracyRate: number | null
}

export interface GroupStats extends AccuracyStats {
  key: string
  label: string
}

export interface DailyPoint {
  day: string
  total: number
  correct: number
  incorrect: number
  unanswered: number
  durationMs: number
}

export interface PeriodComparison {
  current: AccuracyStats
  previous: AccuracyStats
  accuracyRateDelta: number | null
  totalDelta: number
  durationMsCurrent: number
  durationMsPrevious: number
}

const ANNULLED_EXCLUDED: UniqueQuestionStats = {
  total: 0,
  correct: 0,
  incorrect: 0,
  unanswered: 0,
  accuracyRate: null,
}

export function indexQuestions(questions: Question[]): Map<string, Question> {
  return new Map(questions.map((q) => [q.id, q]))
}

/** Aplica filtros combináveis às tentativas, consultando os atributos da questão. */
export function filterAttempts(
  attempts: Attempt[],
  questions: Map<string, Question>,
  filters: StatsFilters = {},
): Attempt[] {
  const includeAnnulled = filters.includeAnnulled ?? false
  const includeArchived = filters.includeArchived ?? true

  return attempts.filter((attempt) => {
    if (filters.from && attempt.answeredAt < filters.from) return false
    if (filters.to && attempt.answeredAt > filters.to) return false

    const question = questions.get(attempt.questionId)
    if (!question) return false
    if (question.annulled && !includeAnnulled) return false
    if (question.status === 'archived' && !includeArchived) return false

    if (filters.disciplineId && question.disciplineId !== filters.disciplineId) return false
    if (filters.topicId && question.topicId !== filters.topicId) return false
    if (filters.boardId && question.boardId !== filters.boardId) return false
    if (filters.contestId && question.contestId !== filters.contestId) return false
    return true
  })
}

export function computeAccuracy(attempts: Attempt[]): AccuracyStats {
  let correct = 0
  let incorrect = 0
  let unanswered = 0
  for (const attempt of attempts) {
    if (attempt.outcome === 'correct') correct += 1
    else if (attempt.outcome === 'incorrect') incorrect += 1
    else unanswered += 1
  }
  const answered = correct + incorrect
  return {
    total: attempts.length,
    answered,
    correct,
    incorrect,
    unanswered,
    accuracyRate: answered === 0 ? null : correct / answered,
    errorRate: answered === 0 ? null : incorrect / answered,
  }
}

export function totalAttempts(
  attempts: Attempt[],
  questions: Map<string, Question>,
  filters?: StatsFilters,
): number {
  return filterAttempts(attempts, questions, filters).length
}

/** Estatísticas de acerto com filtros combináveis. */
export function accuracyStats(
  attempts: Attempt[],
  questions: Map<string, Question>,
  filters?: StatsFilters,
): AccuracyStats {
  return computeAccuracy(filterAttempts(attempts, questions, filters))
}

interface LatestByQuestion {
  questionId: string
  attempt: Attempt
}

/** Retorna a tentativa mais recente de cada questão (tiebreak por id para determinismo). */
export function latestAttemptsByQuestion(attempts: Attempt[]): Map<string, Attempt> {
  const latest = new Map<string, Attempt>()
  for (const attempt of attempts) {
    const current = latest.get(attempt.questionId)
    if (
      !current ||
      attempt.answeredAt > current.answeredAt ||
      (attempt.answeredAt === current.answeredAt && attempt.id > current.id)
    ) {
      latest.set(attempt.questionId, attempt)
    }
  }
  return latest
}

/**
 * Questões únicas classificadas pelo resultado da tentativa mais recente.
 * Tentativas sem resposta contam no bucket 'unanswered'.
 */
export function uniqueQuestionStats(attempts: Attempt[]): UniqueQuestionStats {
  const latest = latestAttemptsByQuestion(attempts)
  let correct = 0
  let incorrect = 0
  let unanswered = 0
  for (const attempt of latest.values()) {
    if (attempt.outcome === 'correct') correct += 1
    else if (attempt.outcome === 'incorrect') incorrect += 1
    else unanswered += 1
  }
  const total = correct + incorrect + unanswered
  const answered = correct + incorrect
  return {
    total,
    correct,
    incorrect,
    unanswered,
    accuracyRate: answered === 0 ? null : correct / answered,
  }
}

function groupBy(
  attempts: Attempt[],
  questions: Map<string, Question>,
  keyOf: (question: Question) => string | null,
  labelOf: (id: string) => string,
  emptyLabel: string,
): GroupStats[] {
  const buckets = new Map<string, Attempt[]>()
  for (const attempt of attempts) {
    const question = questions.get(attempt.questionId)
    if (!question) continue
    const key = keyOf(question) ?? '__none__'
    const list = buckets.get(key) ?? []
    list.push(attempt)
    buckets.set(key, list)
  }
  return [...buckets.entries()]
    .map(([key, list]) => ({
      key,
      label: key === '__none__' ? emptyLabel : labelOf(key),
      ...computeAccuracy(list),
    }))
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label))
}

export function byDiscipline(
  attempts: Attempt[],
  questions: Map<string, Question>,
  disciplineNames: Map<string, string>,
): GroupStats[] {
  return groupBy(
    attempts,
    questions,
    (q) => q.disciplineId,
    (id) => disciplineNames.get(id) ?? 'Disciplina removida',
    'Sem disciplina',
  )
}

export function byTopic(
  attempts: Attempt[],
  questions: Map<string, Question>,
  topicNames: Map<string, string>,
): GroupStats[] {
  return groupBy(
    attempts,
    questions,
    (q) => q.topicId,
    (id) => topicNames.get(id) ?? 'Assunto removido',
    'Sem assunto',
  )
}

export function byBoard(
  attempts: Attempt[],
  questions: Map<string, Question>,
  boardNames: Map<string, string>,
): GroupStats[] {
  return groupBy(
    attempts,
    questions,
    (q) => q.boardId,
    (id) => boardNames.get(id) ?? 'Banca removida',
    'Sem banca',
  )
}

export function byContest(
  attempts: Attempt[],
  questions: Map<string, Question>,
  contestNames: Map<string, string>,
): GroupStats[] {
  return groupBy(
    attempts,
    questions,
    (q) => q.contestId,
    (id) => contestNames.get(id) ?? 'Concurso removido',
    'Sem concurso',
  )
}

export function totalStudyTimeMs(attempts: Attempt[]): number {
  return attempts.reduce((sum, attempt) => sum + (attempt.durationMs ?? 0), 0)
}

/** Evolução diária agregada por dia (UTC). */
export function dailyEvolution(attempts: Attempt[]): DailyPoint[] {
  const buckets = new Map<string, DailyPoint>()
  for (const attempt of attempts) {
    const day = toDayKey(attempt.answeredAt)
    const point =
      buckets.get(day) ?? { day, total: 0, correct: 0, incorrect: 0, unanswered: 0, durationMs: 0 }
    point.total += 1
    if (attempt.outcome === 'correct') point.correct += 1
    else if (attempt.outcome === 'incorrect') point.incorrect += 1
    else point.unanswered += 1
    point.durationMs += attempt.durationMs ?? 0
    buckets.set(day, point)
  }
  return [...buckets.values()].sort((a, b) => a.day.localeCompare(b.day))
}

export function comparePeriods(
  attemptsAll: Attempt[],
  questions: Map<string, Question>,
  previous: StatsFilters,
  current: StatsFilters,
): PeriodComparison {
  const previousAttempts = filterAttempts(attemptsAll, questions, previous)
  const currentAttempts = filterAttempts(attemptsAll, questions, current)
  const prev = computeAccuracy(previousAttempts)
  const curr = computeAccuracy(currentAttempts)
  const accuracyRateDelta =
    prev.accuracyRate === null || curr.accuracyRate === null
      ? null
      : curr.accuracyRate - prev.accuracyRate
  return {
    current: curr,
    previous: prev,
    accuracyRateDelta,
    totalDelta: curr.total - prev.total,
    durationMsCurrent: totalStudyTimeMs(currentAttempts),
    durationMsPrevious: totalStudyTimeMs(previousAttempts),
  }
}

export { ANNULLED_EXCLUDED }
export type { LatestByQuestion }
