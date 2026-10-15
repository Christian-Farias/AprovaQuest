export type AppErrorCode =
  | 'validation'
  | 'not_found'
  | 'conflict'
  | 'referential_integrity'
  | 'storage'
  | 'aborted'
  | 'unknown'

export interface AppError {
  code: AppErrorCode
  message: string
  details?: unknown
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: AppError }

export function ok<T>(value: T): Result<T> {
  return { ok: true, value }
}

export function err<T = never>(code: AppErrorCode, message: string, details?: unknown): Result<T> {
  return { ok: false, error: { code, message, details } }
}

export function appError(code: AppErrorCode, message: string, details?: unknown): AppError {
  return { code, message, details }
}
