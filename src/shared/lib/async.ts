import { toAppError } from '../db/errors'
import { type Result } from './result'

/** Executa uma operação assíncrona convertendo falhas em Result com AppError. */
export async function toResult<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, value: await fn() }
  } catch (error) {
    return { ok: false, error: toAppError(error) }
  }
}

export function assertNever(value: never): never {
  throw new Error(`Valor não esperado: ${String(value)}`)
}
