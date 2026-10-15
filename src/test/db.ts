import Dexie from 'dexie'
import { createDb, type AprovaQuestDatabase } from '@/shared/db/database'

/** Cria um banco isolado por teste (nome único) já aberto. */
export async function freshDb(): Promise<AprovaQuestDatabase> {
  const name = `aprovaquest_test_${crypto.randomUUID()}`
  const db = createDb(name)
  await db.open()
  return db
}

export async function disposeDb(db: AprovaQuestDatabase): Promise<void> {
  const name = db.name
  db.close()
  await Dexie.delete(name)
}
