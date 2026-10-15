export const systemClock = () => new Date();
export function nowIso(clock = systemClock) {
    return clock().toISOString();
}
export function toIso(value) {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
export function isValidIso(value) {
    if (typeof value !== 'string' || value.length === 0)
        return false;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed);
}
export function addDays(iso, days) {
    const date = new Date(iso);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString();
}
export function addMinutes(iso, minutes) {
    const date = new Date(iso);
    date.setUTCMinutes(date.getUTCMinutes() + minutes);
    return date.toISOString();
}
/** Retorna a data (UTC) no formato YYYY-MM-DD, útil para agrupar a evolução diária. */
export function toDayKey(iso) {
    return new Date(iso).toISOString().slice(0, 10);
}
/** Diferença em dias inteiros de a -> b (b - a). Positivo quando b é mais recente. */
export function diffInDays(aIso, bIso) {
    const ms = new Date(bIso).getTime() - new Date(aIso).getTime();
    return ms / 86_400_000;
}
/** Compara timestamps ISO. Retorna negativo se a < b. */
export function compareIso(a, b) {
    return new Date(a).getTime() - new Date(b).getTime();
}
/** Início do dia UTC (00:00:00.000Z) da data informada. */
export function startOfUtcDay(iso) {
    const date = new Date(iso);
    date.setUTCHours(0, 0, 0, 0);
    return date.toISOString();
}
/** Fim do dia UTC (23:59:59.999Z) da data informada. */
export function endOfUtcDay(iso) {
    const date = new Date(iso);
    date.setUTCHours(23, 59, 59, 999);
    return date.toISOString();
}
