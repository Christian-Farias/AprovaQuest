export function migrateErrorNoteV1ToV2(note) {
    return {
        attemptId: note.attemptId ?? null,
        category: 'falta_conhecimento',
        note: '',
        explanation: '',
        resolved: note.resolved ?? false,
        updatedAt: note.createdAt,
    };
}
export function migrateReviewV1ToV2(review) {
    const createdAt = review.createdAt ?? review.dueAt;
    const diffMs = Date.parse(review.dueAt) - Date.parse(createdAt);
    const offsetDays = Number.isFinite(diffMs) ? Math.max(0, Math.round(diffMs / 86_400_000)) : 0;
    const status = review.status ?? 'pending';
    return {
        offsetDays,
        status,
        postponedTo: null,
        completedAt: status === 'done' ? review.dueAt : null,
        sourceErrorNoteId: null,
        createdAt,
        updatedAt: createdAt,
    };
}
export function migrateStudySessionV1ToV3(session) {
    return {
        priorityReason: session.priorityReason ?? '',
        createdAt: session.createdAt ?? session.scheduledAt,
        updatedAt: session.createdAt ?? session.scheduledAt,
    };
}
