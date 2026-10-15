import { useMemo } from 'react';
import { createErrorsService } from './errors.service';
import { getDb } from '@/shared/db/database';
export function useErrorsService() {
    const db = getDb();
    return useMemo(() => createErrorsService(db), [db]);
}
