import { useLiveQuery } from 'dexie-react-hooks'
import { getDb } from '@/shared/db/database'

export function useErrorNotes() {
  const db = getDb()
  return useLiveQuery(() => db.errorNotes.toArray(), [], undefined)
}
