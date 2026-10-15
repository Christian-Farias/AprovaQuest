import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getDb } from '@/shared/db/database';
import { indexQuestions, accuracyStats, computeAccuracy, filterAttempts, totalStudyTimeMs, uniqueQuestionStats, } from '../domain/statistics';
/**
 * Fonte reativa de dados brutos para estatísticas. Não calcula nada:
 * apenas expõe os dados reais do IndexedDB e índices de consulta.
 */
export function useStatsSource() {
    return useLiveQuery(async () => {
        const db = getDb();
        const [attempts, questions, disciplines, topics, boards, contests] = await Promise.all([
            db.attempts.toArray(),
            db.questions.toArray(),
            db.disciplines.toArray(),
            db.topics.toArray(),
            db.boards.toArray(),
            db.contests.toArray(),
        ]);
        return {
            attempts,
            questions,
            questionIndex: indexQuestions(questions),
            disciplineNames: new Map(disciplines.map((d) => [d.id, d.name])),
            topicNames: new Map(topics.map((t) => [t.id, t.name])),
            boardNames: new Map(boards.map((b) => [b.id, b.name])),
            contestNames: new Map(contests.map((c) => [c.id, c.name])),
        };
    }, []);
}
export function useAccuracyStats(filters = {}) {
    const source = useStatsSource();
    const key = JSON.stringify(filters);
    return useMemo(() => {
        if (!source)
            return undefined;
        return accuracyStats(source.attempts, source.questionIndex, filters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [source, key]);
}
export function useFilteredAttempts(filters = {}) {
    const source = useStatsSource();
    const key = JSON.stringify(filters);
    return useMemo(() => {
        if (!source)
            return undefined;
        return filterAttempts(source.attempts, source.questionIndex, filters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [source, key]);
}
export function useOverallStats() {
    const source = useStatsSource();
    return useMemo(() => {
        if (!source)
            return undefined;
        const filtered = filterAttempts(source.attempts, source.questionIndex, {});
        return {
            questionCount: source.questions.length,
            activeQuestionCount: source.questions.filter((q) => q.status === 'active').length,
            accuracy: computeAccuracy(filtered),
            unique: uniqueQuestionStats(filtered),
            studyTimeMs: totalStudyTimeMs(filtered),
        };
    }, [source]);
}
