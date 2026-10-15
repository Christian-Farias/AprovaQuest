import Dexie, {} from 'dexie';
import { migrateErrorNoteV1ToV2, migrateReviewV1ToV2, migrateStudySessionV1ToV3 } from './migrations';
export const DB_NAME = 'aprovaquest';
export const SCHEMA_VERSION = 4;
export class AprovaQuestDatabase extends Dexie {
    disciplines;
    topics;
    boards;
    contests;
    questions;
    options;
    attempts;
    errorNotes;
    reviews;
    studySessions;
    plans;
    availability;
    planGoals;
    imports;
    importPages;
    importFiles;
    settings;
    constructor(name = DB_NAME) {
        super(name);
        // v1 — núcleo do motor de questões.
        this.version(1).stores({
            disciplines: '&id, name, createdAt',
            topics: '&id, disciplineId, name, [disciplineId+name]',
            boards: '&id, name',
            contests: '&id, name, year',
            questions: '&id, disciplineId, topicId, boardId, contestId, type, status, annulled, createdAt, updatedAt, *tags',
            options: '&id, questionId, order, [questionId+order]',
            attempts: '&id, questionId, outcome, answeredAt, [questionId+answeredAt]',
            errorNotes: '&id, questionId, attemptId, resolved, createdAt',
            reviews: '&id, questionId, status, dueAt',
            studySessions: '&id, planId, type, status, scheduledAt',
            plans: '&id, status, createdAt',
            imports: '&id, status, createdAt',
            importPages: '&id, importId, pageNumber, [importId+pageNumber]',
            settings: '&key',
        });
        // v2 — caderno de erros: categoria/explicação em errorNotes; agendamento em reviews.
        this.version(2)
            .stores({
            errorNotes: '&id, questionId, attemptId, resolved, category, createdAt, [questionId+createdAt]',
            reviews: '&id, questionId, offsetDays, status, dueAt, [questionId+offsetDays], [status+dueAt]',
        })
            .upgrade((tx) => Promise.all([
            tx
                .table('errorNotes')
                .toCollection()
                .modify((note) => {
                Object.assign(note, migrateErrorNoteV1ToV2(note));
            }),
            tx
                .table('reviews')
                .toCollection()
                .modify((review) => {
                Object.assign(review, migrateReviewV1ToV2(review));
            }),
        ]));
        // v3 — cronograma determinístico: disponibilidade, metas e prioridade das sessões.
        this.version(3)
            .stores({
            availability: '&id, planId, weekday, [planId+weekday]',
            planGoals: '&id, planId, type, [planId+type]',
            studySessions: '&id, planId, type, status, scheduledAt, [status+scheduledAt]',
        })
            .upgrade((tx) => tx
            .table('studySessions')
            .toCollection()
            .modify((session) => {
            Object.assign(session, migrateStudySessionV1ToV3(session));
        }));
        // v4 — armazenamento temporário do PDF para retomada de importações interrompidas.
        this.version(4).stores({
            importFiles: '&importId',
        });
    }
}
let instance = null;
export function getDb() {
    if (!instance) {
        instance = new AprovaQuestDatabase();
    }
    return instance;
}
export function createDb(name) {
    return new AprovaQuestDatabase(name);
}
