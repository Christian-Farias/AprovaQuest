import { describe, expect, it } from 'vitest'
import type { Attempt, Question } from '@/shared/db/types'
import {
  accuracyStats,
  byDiscipline,
  comparePeriods,
  dailyEvolution,
  filterAttempts,
  indexQuestions,
  totalAttempts,
  totalStudyTimeMs,
  uniqueQuestionStats,
} from './statistics'

const D1 = 'd1'
const D2 = 'd2'
const T1 = 't1'
const T2 = 't2'
const B1 = 'b1'
const C1 = 'c1'

function question(id: string, over: Partial<Question>): Question {
  return {
    id,
    type: 'multiple_choice',
    statement: `Questão ${id}`,
    disciplineId: D1,
    topicId: T1,
    boardId: B1,
    contestId: null,
    source: null,
    explanation: null,
    tags: [],
    status: 'active',
    annulled: false,
    answerConfirmed: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...over,
  }
}

const questions: Question[] = [
  question('q1', {}),
  question('q2', { contestId: null }),
  question('q3', { disciplineId: D2, topicId: T2, boardId: null, contestId: C1 }),
  question('q4', { annulled: true }),
  question('q5', { topicId: T2, boardId: null, contestId: null, status: 'archived' }),
]

const qIndex = indexQuestions(questions)

function attempt(
  id: string,
  questionId: string,
  outcome: Attempt['outcome'],
  answeredAt: string,
  durationMs: number | null,
): Attempt {
  return {
    id,
    questionId,
    selectedOptionId: outcome === 'unanswered' ? null : `${id}-opt`,
    selectedLabel: outcome === 'unanswered' ? null : 'A',
    outcome,
    durationMs,
    answeredAt,
  }
}

const attempts: Attempt[] = [
  attempt('a1', 'q1', 'correct', '2024-01-01T10:00:00.000Z', 10000),
  attempt('a2', 'q1', 'incorrect', '2024-01-02T10:00:00.000Z', 20000),
  attempt('a3', 'q2', 'correct', '2024-01-02T11:00:00.000Z', 30000),
  attempt('a4', 'q2', 'unanswered', '2024-01-03T11:00:00.000Z', null),
  attempt('a5', 'q3', 'incorrect', '2024-01-04T10:00:00.000Z', 15000),
  attempt('a6', 'q4', 'correct', '2024-01-05T10:00:00.000Z', 5000),
  attempt('a7', 'q5', 'correct', '2024-01-06T10:00:00.000Z', 8000),
]

// Valores conferidos manualmente:
// Excluindo anuladas (q4/a6) e incluindo arquivadas (q5/a7):
//   tentativas = a1..a5 + a7 = 6; acertos = a1,a3,a7 = 3;
//   erros = a2,a5 = 2; sem resposta = a4 = 1; respondidas = 5.
//   aproveitamento = 3/5 = 0.6; taxa de erro = 2/5 = 0.4.
//   tempo = 10k+20k+30k+0+15k+8k = 83.000ms.
describe('estatísticas (conjunto conhecido, cálculo manual)', () => {
  it('conta tentativas totais excluindo anuladas por padrão', () => {
    expect(totalAttempts(attempts, qIndex)).toBe(6)
    expect(totalAttempts(attempts, qIndex, { includeAnnulled: true })).toBe(7)
  })

  it('calcula acertos, erros e percentuais entre tentativas respondidas', () => {
    const stats = accuracyStats(attempts, qIndex)
    expect(stats.total).toBe(6)
    expect(stats.correct).toBe(3)
    expect(stats.incorrect).toBe(2)
    expect(stats.unanswered).toBe(1)
    expect(stats.answered).toBe(5)
    expect(stats.accuracyRate).toBeCloseTo(0.6, 10)
    expect(stats.errorRate).toBeCloseTo(0.4, 10)
  })

  it('inclui anuladas quando solicitado', () => {
    const stats = accuracyStats(attempts, qIndex, { includeAnnulled: true })
    expect(stats.total).toBe(7)
    expect(stats.correct).toBe(4)
    expect(stats.answered).toBe(6)
    expect(stats.accuracyRate).toBeCloseTo(4 / 6, 10)
  })

  it('exclui arquivadas quando filtro desativa', () => {
    const stats = accuracyStats(attempts, qIndex, { includeArchived: false })
    expect(stats.total).toBe(5)
    expect(stats.correct).toBe(2)
  })

  it('conta questões únicas pela tentativa mais recente', () => {
    const unique = uniqueQuestionStats(
      // mesma lógica de filtro padrão seria aplicada pelo chamador; aqui usamos todas exceto anulada
      attempts.filter((a) => a.questionId !== 'q4'),
    )
    // q1 -> incorrect (a2 mais recente), q2 -> unanswered (a4), q3 -> incorrect (a5), q5 -> correct (a7)
    expect(unique.total).toBe(4)
    expect(unique.correct).toBe(1)
    expect(unique.incorrect).toBe(2)
    expect(unique.unanswered).toBe(1)
    expect(unique.accuracyRate).toBeCloseTo(1 / 3, 10)
  })

  it('agrupa desempenho por disciplina', () => {
    const names = new Map([
      [D1, 'Português'],
      [D2, 'Direito'],
    ])
    const filtered = filterAttempts(attempts, qIndex)
    const groups = byDiscipline(filtered, qIndex, names)
    const portugues = groups.find((g) => g.key === D1)
    const direito = groups.find((g) => g.key === D2)
    expect(portugues?.total).toBe(5)
    expect(portugues?.correct).toBe(3)
    expect(portugues?.accuracyRate).toBeCloseTo(3 / 4, 10)
    expect(direito?.total).toBe(1)
    expect(direito?.accuracyRate).toBeCloseTo(0, 10)
  })

  it('soma o tempo total de estudo', () => {
    expect(totalStudyTimeMs(attempts.filter((a) => a.questionId !== 'q4'))).toBe(83000)
  })

  it('gera evolução diária agregada', () => {
    const points = dailyEvolution(attempts.filter((a) => a.questionId !== 'q4'))
    expect(points.map((p) => p.day)).toEqual([
      '2024-01-01',
      '2024-01-02',
      '2024-01-03',
      '2024-01-04',
      '2024-01-06',
    ])
    const day2 = points.find((p) => p.day === '2024-01-02')
    expect(day2).toMatchObject({ total: 2, correct: 1, incorrect: 1, unanswered: 0 })
  })

  it('compara períodos', () => {
    const comparison = comparePeriods(attempts, qIndex, 
      { from: '2024-01-01T00:00:00.000Z', to: '2024-01-02T23:59:59.999Z' },
      { from: '2024-01-03T00:00:00.000Z', to: '2024-01-06T23:59:59.999Z' },
    )
    expect(comparison.previous.total).toBe(3)
    expect(comparison.previous.accuracyRate).toBeCloseTo(2 / 3, 10)
    expect(comparison.current.total).toBe(3)
    expect(comparison.current.accuracyRate).toBeCloseTo(1 / 2, 10)
    expect(comparison.accuracyRateDelta).toBeCloseTo(1 / 2 - 2 / 3, 10)
    expect(comparison.durationMsCurrent).toBe(23000)
    expect(comparison.durationMsPrevious).toBe(60000)
  })

  it('retorna null (não NaN) quando não há tentativas respondidas', () => {
    const stats = accuracyStats([], qIndex)
    expect(stats.total).toBe(0)
    expect(stats.accuracyRate).toBeNull()
    expect(stats.errorRate).toBeNull()
  })

  it('retorna null quando todas as tentativas estão sem resposta', () => {
    const onlyUnanswered = [attempt('u1', 'q1', 'unanswered', '2024-01-01T10:00:00.000Z', null)]
    const stats = accuracyStats(onlyUnanswered, qIndex)
    expect(stats.total).toBe(1)
    expect(stats.answered).toBe(0)
    expect(stats.accuracyRate).toBeNull()
  })
})
