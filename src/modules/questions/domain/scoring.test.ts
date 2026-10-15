import { describe, expect, it } from 'vitest'
import { evaluateAttempt } from './scoring'
import type { Question, QuestionOption } from '@/shared/db/types'

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: crypto.randomUUID(),
    type: 'multiple_choice',
    statement: 'Questão de teste',
    disciplineId: crypto.randomUUID(),
    topicId: null,
    boardId: null,
    contestId: null,
    source: null,
    explanation: null,
    tags: [],
    status: 'active',
    annulled: false,
    answerConfirmed: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeOption(
  questionId: string,
  label: string,
  isCorrect: boolean,
): QuestionOption {
  return {
    id: crypto.randomUUID(),
    questionId,
    order: label.charCodeAt(0) - 65,
    label,
    text: `Alternativa ${label}`,
    isCorrect,
    archived: false,
    createdAt: '2024-01-01T00:00:00.000Z',
  }
}

const fixedClock = () => new Date('2024-05-10T12:00:00.000Z')

describe('evaluateAttempt', () => {
  it('marca como correto quando a alternativa escolhida é a correta', () => {
    const question = makeQuestion()
    const options = [makeOption(question.id, 'A', true), makeOption(question.id, 'B', false)]
    const result = evaluateAttempt({
      question,
      options,
      selectedOptionId: options[0].id,
      durationMs: 5000,
      clock: fixedClock,
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.outcome).toBe('correct')
      expect(result.value.selectedLabel).toBe('A')
      expect(result.value.durationMs).toBe(5000)
      expect(result.value.answeredAt).toBe('2024-05-10T12:00:00.000Z')
    }
  })

  it('marca como incorreto ao escolher alternativa errada', () => {
    const question = makeQuestion()
    const options = [makeOption(question.id, 'A', true), makeOption(question.id, 'B', false)]
    const result = evaluateAttempt({ question, options, selectedOptionId: options[1].id })
    expect(result.ok && result.value.outcome).toBe('incorrect')
  })

  it('registra tentativa sem resposta quando nada é selecionado', () => {
    const question = makeQuestion()
    const options = [makeOption(question.id, 'A', true), makeOption(question.id, 'B', false)]
    const result = evaluateAttempt({ question, options, selectedOptionId: null })
    expect(result.ok && result.value.outcome).toBe('unanswered')
    expect(result.ok && result.value.selectedOptionId).toBeNull()
  })

  it('bloqueia questão anulada', () => {
    const question = makeQuestion({ annulled: true })
    const options = [makeOption(question.id, 'A', true), makeOption(question.id, 'B', false)]
    const result = evaluateAttempt({ question, options, selectedOptionId: options[0].id })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('validation')
  })

  it('bloqueia questão com gabarito não confirmado', () => {
    const question = makeQuestion({ answerConfirmed: false })
    const options = [makeOption(question.id, 'A', false), makeOption(question.id, 'B', false)]
    const result = evaluateAttempt({ question, options, selectedOptionId: options[0].id })
    expect(result.ok).toBe(false)
  })

  it('rejeita alternativa que não pertence à questão', () => {
    const question = makeQuestion()
    const other = makeQuestion()
    const options = [makeOption(question.id, 'A', true), makeOption(question.id, 'B', false)]
    const foreign = makeOption(other.id, 'C', true)
    const result = evaluateAttempt({ question, options, selectedOptionId: foreign.id })
    expect(result.ok).toBe(false)
  })

  it('rejeita duração negativa', () => {
    const question = makeQuestion()
    const options = [makeOption(question.id, 'A', true), makeOption(question.id, 'B', false)]
    const result = evaluateAttempt({
      question,
      options,
      selectedOptionId: options[0].id,
      durationMs: -1,
    })
    expect(result.ok).toBe(false)
  })
})
