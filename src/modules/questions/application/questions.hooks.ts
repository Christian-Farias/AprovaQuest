import { useLiveQuery } from 'dexie-react-hooks'
import { getDb } from '@/shared/db/database'
import type { Question, QuestionOption } from '@/shared/db/types'
import type { QuestionFilter } from '../data/questions.repo'

export function useQuestions(filter: QuestionFilter = {}): Question[] | undefined {
  const { disciplineId, subjectId, topicId, type, status } = filter
  return useLiveQuery(async () => {
    const all = await getDb().questions.orderBy('createdAt').reverse().toArray()
    return all.filter((q) => {
      if (disciplineId && q.disciplineId !== disciplineId) return false
      if (subjectId && q.subjectId !== subjectId) return false
      if (topicId && q.topicId !== topicId) return false
      if (type && q.type !== type) return false
      if (status && q.status !== status) return false
      return true
    })
  }, [disciplineId, subjectId, topicId, type, status])
}

export function useQuestionOptions(questionId: string | undefined): QuestionOption[] | undefined {
  return useLiveQuery(async () => {
    if (!questionId) return []
    const options = await getDb().options.where('questionId').equals(questionId).sortBy('order')
    return options
  }, [questionId])
}

export function useDisciplines() {
  return useLiveQuery(() => getDb().disciplines.orderBy('name').toArray(), [])
}

export function useTopics(filter?: { disciplineId?: string; subjectId?: string }) {
  const disciplineId = filter?.disciplineId
  const subjectId = filter?.subjectId
  return useLiveQuery(async () => {
    const db = getDb()
    if (subjectId) return db.topics.where('subjectId').equals(subjectId).toArray()
    if (disciplineId) return db.topics.where('disciplineId').equals(disciplineId).toArray()
    return db.topics.toArray()
  }, [disciplineId, subjectId])
}

export function useBoards() {
  return useLiveQuery(() => getDb().boards.orderBy('name').toArray(), [])
}

export function useContests() {
  return useLiveQuery(() => getDb().contests.orderBy('name').toArray(), [])
}

export function useSubjects(disciplineId?: string) {
  return useLiveQuery(async () => {
    const db = getDb()
    if (disciplineId) return db.subjects.where('disciplineId').equals(disciplineId).toArray()
    return db.subjects.toArray()
  }, [disciplineId])
}
