import type { AprovaQuestDatabase } from '@/shared/db/database'
import { getDb } from '@/shared/db/database'
import {
  createTaxonomyRepo,
  type BoardInput,
  type ContestInput,
  type DisciplineInput,
  type TopicInput,
} from '@/modules/questions/data/taxonomy.repo'
import { type Clock } from '@/shared/lib/dates'
import { toResult } from '@/shared/lib/async'

export function createTaxonomyService(db: AprovaQuestDatabase = getDb()) {
  const repo = createTaxonomyRepo(db)

  return {
    listDisciplines: () => toResult(() => repo.listDisciplines()),
    createDiscipline: (input: DisciplineInput, clock?: Clock) =>
      toResult(() => repo.createDiscipline(input, clock)),
    updateDiscipline: (id: string, input: DisciplineInput, clock?: Clock) =>
      toResult(() => repo.updateDiscipline(id, input, clock)),
    deleteDiscipline: (id: string) => toResult(() => repo.deleteDiscipline(id)),
    listTopics: (disciplineId?: string) => toResult(() => repo.listTopics(disciplineId)),
    createTopic: (input: TopicInput, clock?: Clock) => toResult(() => repo.createTopic(input, clock)),
    updateTopic: (id: string, input: Partial<TopicInput>, clock?: Clock) =>
      toResult(() => repo.updateTopic(id, input, clock)),
    deleteTopic: (id: string) => toResult(() => repo.deleteTopic(id)),
    listBoards: () => toResult(() => repo.listBoards()),
    createBoard: (input: BoardInput, clock?: Clock) => toResult(() => repo.createBoard(input, clock)),
    deleteBoard: (id: string) => toResult(() => repo.deleteBoard(id)),
    listContests: () => toResult(() => repo.listContests()),
    createContest: (input: ContestInput, clock?: Clock) =>
      toResult(() => repo.createContest(input, clock)),
    deleteContest: (id: string) => toResult(() => repo.deleteContest(id)),
  }
}

export type TaxonomyService = ReturnType<typeof createTaxonomyService>
