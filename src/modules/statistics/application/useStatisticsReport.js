import { useMemo } from 'react';
import { accuracyStats, byBoard, byContest, byDiscipline, byTopic, dailyEvolution, filterAttempts, totalStudyTimeMs, uniqueQuestionStats, } from '../domain/statistics';
import { useStatsSource } from './statistics.hooks';
function buildReport(source, filters) {
    const attempts = filterAttempts(source.attempts, source.questionIndex, filters);
    return {
        accuracy: accuracyStats(attempts, source.questionIndex),
        unique: uniqueQuestionStats(attempts),
        studyTimeMs: totalStudyTimeMs(attempts),
        byDiscipline: byDiscipline(attempts, source.questionIndex, source.disciplineNames),
        byTopic: byTopic(attempts, source.questionIndex, source.topicNames),
        byBoard: byBoard(attempts, source.questionIndex, source.boardNames),
        byContest: byContest(attempts, source.questionIndex, source.contestNames),
        daily: dailyEvolution(attempts),
        disciplineOptions: [...source.disciplineNames.entries()].map(([id, name]) => ({ id, name })),
        boardOptions: [...source.boardNames.entries()].map(([id, name]) => ({ id, name })),
        contestOptions: [...source.contestNames.entries()].map(([id, name]) => ({ id, name })),
        totalInScope: attempts.length,
    };
}
export function useStatisticsReport(filters) {
    const source = useStatsSource();
    const key = JSON.stringify(filters);
    return useMemo(() => {
        if (!source)
            return undefined;
        return buildReport(source, filters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [source, key]);
}
