/**
 * Normalização de texto para comparação/duplicatas.
 * Determinística e local — nenhum envio externo.
 */
export function normalizeText(input) {
    return input
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}
/** Remove pontuação e espaços, mantendo apenas letras e números normalizados. */
export function normalizeSkeleton(input) {
    return normalizeText(input).replace(/[^a-z0-9]/g, '');
}
/** Conjunto de trigramas para similaridade aproximada. */
export function trigrams(input) {
    const normalized = normalizeText(input).replace(/[^a-z0-9 ]/g, '');
    const compact = normalized.replace(/ /g, ' ');
    const padded = `  ${compact} `;
    const out = new Set();
    for (let i = 0; i < padded.length - 2; i += 1) {
        out.add(padded.slice(i, i + 3));
    }
    return out;
}
/** Similaridade de Jaccard entre dois textos, em [0, 1]. */
export function similarity(a, b) {
    const ta = trigrams(a);
    const tb = trigrams(b);
    if (ta.size === 0 && tb.size === 0)
        return 1;
    if (ta.size === 0 || tb.size === 0)
        return 0;
    let intersection = 0;
    for (const t of ta) {
        if (tb.has(t))
            intersection += 1;
    }
    return intersection / (ta.size + tb.size - intersection);
}
