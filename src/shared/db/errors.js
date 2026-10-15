export class DomainError extends Error {
    appError;
    constructor(code, message, details) {
        super(message);
        this.name = 'DomainError';
        this.appError = { code, message, details };
    }
}
export function domainError(code, message, details) {
    return new DomainError(code, message, details);
}
function isQuotaExceeded(error) {
    if (!error || typeof error !== 'object')
        return false;
    const err = error;
    return (err.name === 'QuotaExceededError' ||
        (typeof err.message === 'string' && /quota|storage/i.test(err.message)));
}
/** Converte qualquer falha de persistência em AppError legível para a interface. */
export function toAppError(error, fallbackMessage = 'Falha ao acessar o armazenamento local.') {
    if (error instanceof DomainError)
        return error.appError;
    if (isQuotaExceeded(error)) {
        return {
            code: 'storage',
            message: 'Armazenamento local cheio. Libere espaço ou exporte um backup e remova dados antigos.',
            details: error,
        };
    }
    const message = error instanceof Error ? error.message : String(error);
    return { code: 'unknown', message: message || fallbackMessage, details: error };
}
