import type { AprovaQuestDatabase } from '@/shared/db/database'
import { getDb } from '@/shared/db/database'
import { domainError } from '@/shared/db/errors'
import { evaluateAttempt } from '@/modules/questions/domain/scoring'
import type { CreateQuestionInput, UpdateQuestionInput } from '@/modules/questions/domain/schemas'
import { createQuestionsRepo, type QuestionFilter } from '@/modules/questions/data/questions.repo'
import { createAttemptsRepo } from '@/modules/questions/data/attempts.repo'
import type { Attempt, Question, QuestionOption } from '@/shared/db/types'
import { type Clock } from '@/shared/lib/dates'
import { toResult } from '@/shared/lib/async'
import { type Result } from '@/shared/lib/result'

export interface AnswerInput {
  questionId: string
  selectedOptionId: string | null
  durationMs?: number | null
  clock?: Clock
}

export interface QuestionDetail {
  question: Question
  options: QuestionOption[]
  attempts: Attempt[]
}

export function createQuestionsService(db: AprovaQuestDatabase = getDb()) {
  const questions = createQuestionsRepo(db)
  const attempts = createAttemptsRepo(db)

  function listQuestions(filter: QuestionFilter = {}): Promise<Result<Question[]>> {
    return toResult(() => questions.listQuestions(filter))
  }

  function getQuestion(id: string): Promise<Result<Question | undefined>> {
    return toResult(() => questions.getQuestion(id))
  }

  function getOptions(questionId: string, includeArchived = false): Promise<Result<QuestionOption[]>> {
    return toResult(() => questions.getOptions(questionId, includeArchived))
  }

  function getQuestionDetail(id: string): Promise<Result<QuestionDetail | undefined>> {
    return toResult(async () => {
      const question = await questions.getQuestion(id)
      if (!question) return undefined
      const [options, history] = await Promise.all([
        questions.getOptions(id, true),
        attempts.listByQuestion(id),
      ])
      return { question, options, attempts: history }
    })
  }

  function createQuestion(
    input: CreateQuestionInput,
    clock?: Clock,
  ): Promise<Result<{ question: Question; options: QuestionOption[] }>> {
    return toResult(() => questions.createQuestion(input, clock))
  }

  function updateQuestion(
    id: string,
    input: UpdateQuestionInput,
    clock?: Clock,
  ): Promise<Result<{ question: Question; options: QuestionOption[] }>> {
    return toResult(() => questions.updateQuestion(id, input, clock))
  }

  function archiveQuestion(id: string, clock?: Clock): Promise<Result<Question>> {
    return toResult(() => questions.archiveQuestion(id, clock))
  }

  function unarchiveQuestion(id: string, clock?: Clock): Promise<Result<Question>> {
    return toResult(() => questions.unarchiveQuestion(id, clock))
  }

  function setAnnulled(id: string, annulled: boolean, clock?: Clock): Promise<Result<Question>> {
    return toResult(() => questions.setAnnulled(id, annulled, clock))
  }

  function deleteQuestion(id: string): Promise<Result<void>> {
    return toResult(() => questions.deleteQuestion(id))
  }

  function listAttempts(questionId: string): Promise<Result<Attempt[]>> {
    return toResult(() => attempts.listByQuestion(questionId))
  }

  function findPotentialDuplicates(
    statement: string,
    options?: { excludeId?: string; threshold?: number },
  ) {
    return toResult(() => questions.findPotentialDuplicates(statement, options))
  }

  /**
   * Avalia e grava uma tentativa dentro de uma transação.
   * A tentativa é sempre inserida; o histórico nunca é sobrescrito.
   */
  function answerQuestion(input: AnswerInput): Promise<Result<Attempt>> {
    return toResult(() =>
      db.transaction('rw', db.questions, db.options, db.attempts, async () => {
        const question = await questions.getQuestion(input.questionId)
        if (!question) throw domainError('not_found', 'Questão não encontrada.')
        const options = await questions.getOptions(input.questionId, true)
        const evaluation = evaluateAttempt({
          question,
          options,
          selectedOptionId: input.selectedOptionId,
          durationMs: input.durationMs ?? null,
          clock: input.clock,
        })
        if (!evaluation.ok) {
          throw domainError(evaluation.error.code, evaluation.error.message)
        }
        await attempts.insertAttempt(evaluation.value)
        return evaluation.value
      }),
    )
  }

  return {
    listQuestions,
    getQuestion,
    getOptions,
    getQuestionDetail,
    createQuestion,
    updateQuestion,
    archiveQuestion,
    unarchiveQuestion,
    setAnnulled,
    deleteQuestion,
    listAttempts,
    findPotentialDuplicates,
    answerQuestion,
    // exposto para estatísticas/backup que precisam da mesma instância de banco
    db,
  }
}

export type QuestionsService = ReturnType<typeof createQuestionsService>
