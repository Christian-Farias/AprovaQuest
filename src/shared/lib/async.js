import { toAppError } from '../db/errors';
import {} from './result';
/** Executa uma operação assíncrona convertendo falhas em Result com AppError. */
export async function toResult(fn) {
    try {
        return { ok: true, value: await fn() };
    }
    catch (error) {
        return { ok: false, error: toAppError(error) };
    }
}
export function assertNever(value) {
    throw new Error(`Valor não esperado: ${String(value)}`);
}
