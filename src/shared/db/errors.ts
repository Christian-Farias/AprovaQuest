import type { AppError, AppErrorCode } from '../lib/result'

export class DomainError extends Error {
  readonly appError: AppError

  constructor(code: AppErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = 'DomainError'
    this.appError = { code, message, details }
  }
}

export function domainError(code: AppErrorCode, message: string, details?: unknown): DomainError {
  return new DomainError(code, message, details)
}

interface IndexedDbLikeError {
  name?: string
  message?: string
  inner?: unknown
}

function isQuotaExceeded(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const err = error as IndexedDbLikeError
  return (
    err.name === 'QuotaExceededError' ||
    (typeof err.message === 'string' && /quota|storage/i.test(err.message))
  )
}

/** Converte qualquer falha de persistência em AppError legível para a interface. */
export function toAppError(error: unknown, fallbackMessage = 'Falha ao acessar o armazenamento local.'): AppError {
  if (error instanceof DomainError) return error.appError
  if (isQuotaExceeded(error)) {
    return {
      code: 'storage',
      message:
        'Armazenamento local cheio. Libere espaço ou exporte um backup e remova dados antigos.',
      details: error,
    }
  }
  const message = error instanceof Error ? error.message : String(error)
  return { code: 'unknown', message: message || fallbackMessage, details: error }
}
