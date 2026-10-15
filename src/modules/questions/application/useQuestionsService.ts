import { useMemo } from 'react'
import { getDb } from '@/shared/db/database'
import { createQuestionsService } from './questions.service'

export function useQuestionsService() {
  return useMemo(() => createQuestionsService(getDb()), [])
}
