import Dexie from 'dexie';
import { createDb } from '@/shared/db/database';
/** Cria um banco isolado por teste (nome único) já aberto. */
export async function freshDb() {
    const name = `aprovaquest_test_${crypto.randomUUID()}`;
    const db = createDb(name);
    await db.open();
    return db;
}
export async function disposeDb(db) {
    const name = db.name;
    db.close();
    await Dexie.delete(name);
}
