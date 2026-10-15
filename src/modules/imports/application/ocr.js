/**
 * Stub OCR para testes. Não executa reconhecimento real.
 */
export class StubOcrEngine {
    results;
    constructor(results = [{ text: '', confidence: null }]) {
        this.results = [...results];
    }
    async recognize() {
        const result = this.results.shift() ?? { text: '', confidence: null };
        return { ...result };
    }
    async terminate() { }
}
let tesseractLoader = null;
export function createTesseractOcrEngine(options = {}) {
    const workerPath = options.workerPath ?? '/tesseract/worker.min.js';
    const corePath = options.corePath ?? '/tesseract/tesseract-core.wasm.js';
    const langPath = options.langPath ?? '/tesseract';
    const languages = options.languages ?? ['por', 'eng'];
    const timeoutMs = options.timeoutMs ?? 120000;
    void timeoutMs;
    let worker = null;
    const _queue = [];
    void _queue;
    let _active = 0;
    void _active;
    async function getWorker() {
        if (!tesseractLoader) {
            tesseractLoader = import('tesseract.js').then((m) => m.default ?? m);
        }
        if (worker)
            return worker;
        const Tesseract = await tesseractLoader;
        worker = await Tesseract.createWorker(languages, 1, {
            workerPath,
            corePath,
            langPath,
        });
        return worker;
    }
    async function recognize(dataUrl) {
        const w = await getWorker();
        try {
            const result = await w.recognize(dataUrl, {});
            const text = result?.data?.text ?? '';
            const confidence = typeof result?.data?.confidence === 'number' ? result.data.confidence : null;
            return { text, confidence };
        }
        catch {
            return { text: '', confidence: null };
        }
    }
    async function terminate() {
        if (worker) {
            try {
                await worker.terminate();
            }
            catch {
                // ignore
            }
            worker = null;
        }
        tesseractLoader = null;
    }
    return { recognize, terminate };
}
