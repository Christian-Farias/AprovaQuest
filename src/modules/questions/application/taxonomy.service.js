import { getDb } from '@/shared/db/database';
import { createTaxonomyRepo, } from '@/modules/questions/data/taxonomy.repo';
import {} from '@/shared/lib/dates';
import { toResult } from '@/shared/lib/async';
export function createTaxonomyService(db = getDb()) {
    const repo = createTaxonomyRepo(db);
    return {
        listDisciplines: () => toResult(() => repo.listDisciplines()),
        createDiscipline: (input, clock) => toResult(() => repo.createDiscipline(input, clock)),
        updateDiscipline: (id, input, clock) => toResult(() => repo.updateDiscipline(id, input, clock)),
        deleteDiscipline: (id) => toResult(() => repo.deleteDiscipline(id)),
        listTopics: (disciplineId) => toResult(() => repo.listTopics(disciplineId)),
        createTopic: (input, clock) => toResult(() => repo.createTopic(input, clock)),
        updateTopic: (id, input, clock) => toResult(() => repo.updateTopic(id, input, clock)),
        deleteTopic: (id) => toResult(() => repo.deleteTopic(id)),
        listBoards: () => toResult(() => repo.listBoards()),
        createBoard: (input, clock) => toResult(() => repo.createBoard(input, clock)),
        deleteBoard: (id) => toResult(() => repo.deleteBoard(id)),
        listContests: () => toResult(() => repo.listContests()),
        createContest: (input, clock) => toResult(() => repo.createContest(input, clock)),
        deleteContest: (id) => toResult(() => repo.deleteContest(id)),
    };
}
