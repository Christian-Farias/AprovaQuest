import { z } from 'zod'
import { domainError } from './errors'

/**
 * Valida um registro com Zod e lança DomainError('validation') em caso de falha,
 * para que a UI possa informar o usuário de forma clara.
 */
export function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  const result = schema.safeParse(value)
  if (!result.success) {
    throw domainError('validation', `Dados inválidos para ${label}.`, result.error.issues)
  }
  return result.data
}
