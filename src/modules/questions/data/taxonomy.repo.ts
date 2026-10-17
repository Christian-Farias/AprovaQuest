import type { AprovaQuestDatabase } from '@/shared/db/database'
import { getDb } from '@/shared/db/database'
import { domainError } from '@/shared/db/errors'
import {
  boardSchema,
  contestSchema,
  disciplineSchema,
  subjectSchema,
  topicSchema,
} from '@/modules/questions/domain/schemas'
import type { Board, Contest, Discipline, Subject, Topic } from '@/shared/db/types'
import { type Clock, nowIso } from '@/shared/lib/dates'
import { newId } from '@/shared/lib/ids'

export interface DisciplineInput {
  name: string
  color?: string | null
}

export interface SubjectInput {
  disciplineId: string
  name: string
}

export interface TopicInput {
  disciplineId: string
  subjectId?: string | null
  name: string
}

export interface BoardInput {
  name: string
}

export interface ContestInput {
  name: string
  year?: number | null
}

export function createTaxonomyRepo(db: AprovaQuestDatabase = getDb()) {
  async function listDisciplines(): Promise<Discipline[]> {
    const rows = await db.disciplines.orderBy('name').toArray()
    return rows
  }

  async function getDiscipline(id: string): Promise<Discipline | undefined> {
    return db.disciplines.get(id)
  }

  async function createDiscipline(input: DisciplineInput, clock?: Clock): Promise<Discipline> {
    const at = nowIso(clock)
    const record = disciplineSchema.parse({
      id: newId(),
      name: input.name.trim(),
      color: input.color ?? null,
      createdAt: at,
      updatedAt: at,
    })
    await db.disciplines.add(record)
    return record
  }

  async function updateDiscipline(
    id: string,
    input: DisciplineInput,
    clock?: Clock,
  ): Promise<Discipline> {
    return db.transaction('rw', db.disciplines, async () => {
      const current = await db.disciplines.get(id)
      if (!current) throw domainError('not_found', 'Disciplina não encontrada.')
      const next = disciplineSchema.parse({
        ...current,
        name: input.name.trim(),
        color: input.color ?? current.color ?? null,
        updatedAt: nowIso(clock),
      })
      await db.disciplines.put(next)
      return next
    })
  }

  async function deleteDiscipline(id: string): Promise<void> {
    await db.transaction(
      'rw',
      db.disciplines,
      db.subjects,
      db.topics,
      db.questions,
      async () => {
        const subjectCount = await db.subjects.where('disciplineId').equals(id).count()
        if (subjectCount > 0) {
          throw domainError(
            'referential_integrity',
            'Existem assuntos vinculados a esta disciplina. Remova-os antes.',
          )
        }
        const topicCount = await db.topics.where('disciplineId').equals(id).count()
        if (topicCount > 0) {
          throw domainError(
            'referential_integrity',
            'Existem tópicos vinculados a esta disciplina. Remova-os antes.',
          )
        }
        const questionCount = await db.questions.where('disciplineId').equals(id).count()
        if (questionCount > 0) {
          throw domainError(
            'referential_integrity',
            'Existem questões vinculadas a esta disciplina. Arquive-as ou remova-as antes.',
          )
        }
        await db.disciplines.delete(id)
      },
    )
  }

  async function listSubjects(disciplineId?: string): Promise<Subject[]> {
    const rows = disciplineId
      ? await db.subjects.where('disciplineId').equals(disciplineId).toArray()
      : await db.subjects.toArray()
    return rows.sort((a, b) => a.name.localeCompare(b.name))
  }

  async function createSubject(input: SubjectInput, clock?: Clock): Promise<Subject> {
    return db.transaction('rw', db.disciplines, db.subjects, async () => {
      const discipline = await db.disciplines.get(input.disciplineId)
      if (!discipline) throw domainError('referential_integrity', 'Disciplina inexistente.')
      const at = nowIso(clock)
      const record = subjectSchema.parse({
        id: newId(),
        disciplineId: input.disciplineId,
        name: input.name.trim(),
        createdAt: at,
        updatedAt: at,
      })
      await db.subjects.add(record)
      return record
    })
  }

  async function updateSubject(
    id: string,
    input: Partial<SubjectInput>,
    clock?: Clock,
  ): Promise<Subject> {
    return db.transaction('rw', db.subjects, async () => {
      const current = await db.subjects.get(id)
      if (!current) throw domainError('not_found', 'Assunto não encontrado.')
      const next = subjectSchema.parse({
        ...current,
        name: input.name?.trim() ?? current.name,
        disciplineId: input.disciplineId ?? current.disciplineId,
        updatedAt: nowIso(clock),
      })
      await db.subjects.put(next)
      return next
    })
  }

  async function deleteSubject(id: string): Promise<void> {
    await db.transaction('rw', db.subjects, db.topics, db.questions, async () => {
      const topicCount = await db.topics.where('subjectId').equals(id).count()
      if (topicCount > 0) {
        throw domainError(
          'referential_integrity',
          'Existem tópicos vinculados a este assunto. Remova-os antes.',
        )
      }
      const questionCount = await db.questions.where('subjectId').equals(id).count()
      if (questionCount > 0) {
        throw domainError(
          'referential_integrity',
          'Existem questões vinculadas a este assunto. Ajuste-as antes de remover.',
        )
      }
      await db.subjects.delete(id)
    })
  }

  async function listTopics(disciplineId?: string): Promise<Topic[]> {
    if (disciplineId) {
      return db.topics.where('disciplineId').equals(disciplineId).toArray()
    }
    return db.topics.toArray()
  }

  async function createTopic(input: TopicInput, clock?: Clock): Promise<Topic> {
    return db.transaction('rw', db.disciplines, db.subjects, db.topics, async () => {
      const discipline = await db.disciplines.get(input.disciplineId)
      if (!discipline) throw domainError('referential_integrity', 'Disciplina inexistente.')
      if (input.subjectId) {
        const subject = await db.subjects.get(input.subjectId)
        if (!subject) throw domainError('referential_integrity', 'Assunto inexistente.')
      }
      const at = nowIso(clock)
      const record = topicSchema.parse({
        id: newId(),
        disciplineId: input.disciplineId,
        subjectId: input.subjectId ?? null,
        name: input.name.trim(),
        createdAt: at,
        updatedAt: at,
      })
      await db.topics.add(record)
      return record
    })
  }

  async function updateTopic(
    id: string,
    input: Partial<TopicInput>,
    clock?: Clock,
  ): Promise<Topic> {
    return db.transaction('rw', db.subjects, db.topics, async () => {
      const current = await db.topics.get(id)
      if (!current) throw domainError('not_found', 'Tópico não encontrado.')
      if (input.subjectId) {
        const subject = await db.subjects.get(input.subjectId)
        if (!subject) throw domainError('referential_integrity', 'Assunto inexistente.')
      }
      const next = topicSchema.parse({
        ...current,
        name: input.name?.trim() ?? current.name,
        subjectId: input.subjectId !== undefined ? input.subjectId : current.subjectId,
        updatedAt: nowIso(clock),
      })
      await db.topics.put(next)
      return next
    })
  }

  async function deleteTopic(id: string): Promise<void> {
    await db.transaction('rw', db.topics, db.questions, async () => {
      const questionCount = await db.questions.where('topicId').equals(id).count()
      if (questionCount > 0) {
        throw domainError(
          'referential_integrity',
          'Existem questões vinculadas a este assunto. Ajuste-as antes de remover.',
        )
      }
      await db.topics.delete(id)
    })
  }

  async function listBoards(): Promise<Board[]> {
    return db.boards.orderBy('name').toArray()
  }

  async function createBoard(input: BoardInput, clock?: Clock): Promise<Board> {
    const record = boardSchema.parse({
      id: newId(),
      name: input.name.trim(),
      createdAt: nowIso(clock),
    })
    await db.boards.add(record)
    return record
  }

  async function deleteBoard(id: string): Promise<void> {
    await db.transaction('rw', db.boards, db.questions, async () => {
      const questionCount = await db.questions.where('boardId').equals(id).count()
      if (questionCount > 0) {
        throw domainError('referential_integrity', 'Existem questões vinculadas a esta banca.')
      }
      await db.boards.delete(id)
    })
  }

  async function listContests(): Promise<Contest[]> {
    return db.contests.orderBy('name').toArray()
  }

  async function createContest(input: ContestInput, clock?: Clock): Promise<Contest> {
    const record = contestSchema.parse({
      id: newId(),
      name: input.name.trim(),
      year: input.year ?? null,
      createdAt: nowIso(clock),
    })
    await db.contests.add(record)
    return record
  }

  async function deleteContest(id: string): Promise<void> {
    await db.transaction('rw', db.contests, db.questions, async () => {
      const questionCount = await db.questions.where('contestId').equals(id).count()
      if (questionCount > 0) {
        throw domainError('referential_integrity', 'Existem questões vinculadas a este concurso.')
      }
      await db.contests.delete(id)
    })
  }

  return {
    listDisciplines,
    getDiscipline,
    createDiscipline,
    updateDiscipline,
    deleteDiscipline,
    listSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
    listTopics,
    createTopic,
    updateTopic,
    deleteTopic,
    listBoards,
    createBoard,
    deleteBoard,
    listContests,
    createContest,
    deleteContest,
  }
}

export type TaxonomyRepo = ReturnType<typeof createTaxonomyRepo>
