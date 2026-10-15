export function ok(value) {
    return { ok: true, value };
}
export function err(code, message, details) {
    return { ok: false, error: { code, message, details } };
}
export function appError(code, message, details) {
    return { code, message, details };
}
