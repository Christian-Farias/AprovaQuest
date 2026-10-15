import { useMemo } from 'react';
import { getDb } from '@/shared/db/database';
import { createTaxonomyService } from './taxonomy.service';
export function useTaxonomyService() {
    return useMemo(() => createTaxonomyService(getDb()), []);
}
