import { detectNeedsOcr } from '../domain/segmenter';
/**
 * Extrator stub utilizado em testes. Retorna páginas pré-definidas.
 */
export class StubPdfExtractor {
    pages;
    constructor(pages) {
        this.pages = pages.map((p) => ({ ...p }));
    }
    async extractText() {
        return this.pages.map((p) => ({ ...p }));
    }
}
/**
 * Extrator real baseado em pdf.js. Só é executado em ambiente de navegador.
 * Para páginas sem texto suficiente, renderiza a página em canvas (data URL) para OCR.
 */
export class BrowserPdfExtractor {
    ocrRenderScale;
    constructor(ocrRenderScale = 2) {
        this.ocrRenderScale = ocrRenderScale;
    }
    async extractText(file) {
        const buf = await file.arrayBuffer();
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        if (pdfjs.GlobalWorkerOptions) {
            pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString();
        }
        const loadingTask = pdfjs.getDocument({ data: buf });
        const pdf = await loadingTask.promise;
        const pages = [];
        for (let i = 1; i <= pdf.numPages; i += 1) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const text = content.items
                .map((item) => typeof item === 'object' && item !== null && 'str' in item
                ? String(item.str ?? '')
                : '')
                .join(' ');
            const normalized = text.replace(/\s+/g, ' ').trim();
            const charCount = normalized.length;
            const needsOcr = detectNeedsOcr(normalized);
            const extracted = { pageNumber: i, text: normalized, charCount, needsOcr };
            if (needsOcr) {
                extracted.imageDataUrl = await this.renderPageToDataUrl(page);
            }
            pages.push(extracted);
        }
        return pages;
    }
    async renderPageToDataUrl(page) {
        const viewport = page.getViewport({ scale: this.ocrRenderScale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext('2d');
        if (!context)
            return '';
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        return canvas.toDataURL('image/png');
    }
}
