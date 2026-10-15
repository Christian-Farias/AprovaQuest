import { useLiveQuery } from 'dexie-react-hooks';
import { getDb } from '@/shared/db/database';
export function useQuestions(filter = {}) {
    const { disciplineId, topicId, type, status } = filter;
    return useLiveQuery(async () => {
        const all = await getDb().questions.orderBy('createdAt').reverse().toArray();
        return all.filter((q) => {
            if (disciplineId && q.disciplineId !== disciplineId)
                return false;
            if (topicId && q.topicId !== topicId)
                return false;
            if (type && q.type !== type)
                return false;
            if (status && q.status !== status)
                return false;
            return true;
        });
    }, [disciplineId, topicId, type, status]);
}
export function useQuestionOptions(questionId) {
    return useLiveQuery(async () => {
        if (!questionId)
            return [];
        const options = await getDb().options.where('questionId').equals(questionId).sortBy('order');
        return options;
    }, [questionId]);
}
export function useDisciplines() {
    return useLiveQuery(() => getDb().disciplines.orderBy('name').toArray(), []);
}
export function useTopics(disciplineId) {
    return useLiveQuery(async () => {
        const db = getDb();
        if (disciplineId)
            return db.topics.where('disciplineId').equals(disciplineId).toArray();
        return db.topics.toArray();
    }, [disciplineId]);
}
export function useBoards() {
    return useLiveQuery(() => getDb().boards.orderBy('name').toArray(), []);
}
export function useContests() {
    return useLiveQuery(() => getDb().contests.orderBy('name').toArray(), []);
}
