import { detectNeedsOcr } from './segmenter'
import type { PDFPageProxy } from 'pdfjs-dist'

export interface ExtractedPage {
  pageNumber: number
  text: string
  charCount: number
  needsOcr: boolean
  /** Imagem da página em data URL, presente apenas quando OCR é necessário. */
  imageDataUrl?: string
}

export interface PdfExtractor {
  extractText(file: File | Blob): Promise<ExtractedPage[]>
}

/**
 * Extrator stub utilizado em testes. Retorna páginas pré-definidas.
 */
export class StubPdfExtractor implements PdfExtractor {
  private pages: ExtractedPage[]

  constructor(pages: ExtractedPage[]) {
    this.pages = pages.map((p) => ({ ...p }))
  }

  async extractText(): Promise<ExtractedPage[]> {
    return this.pages.map((p) => ({ ...p }))
  }
}

/**
 * Extrator real baseado em pdf.js. Só é executado em ambiente de navegador.
 * Para páginas sem texto suficiente, renderiza a página em canvas (data URL) para OCR.
 */
export class BrowserPdfExtractor implements PdfExtractor {
  private readonly ocrRenderScale: number

  constructor(ocrRenderScale = 2) {
    this.ocrRenderScale = ocrRenderScale
  }

  async extractText(file: File | Blob): Promise<ExtractedPage[]> {
    const buf = await file.arrayBuffer()
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
    if (pdfjs.GlobalWorkerOptions) {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
        import.meta.url,
      ).toString()
    }
    const loadingTask = pdfjs.getDocument({ data: buf })
    const pdf = await loadingTask.promise
    const pages: ExtractedPage[] = []
    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const text = content.items
        .map((item: unknown) =>
          typeof item === 'object' && item !== null && 'str' in item
            ? String((item as { str: unknown }).str ?? '')
            : '',
        )
        .join(' ')
      const normalized = text.replace(/\s+/g, ' ').trim()
      const charCount = normalized.length
      const needsOcr = detectNeedsOcr(normalized)
      const extracted: ExtractedPage = { pageNumber: i, text: normalized, charCount, needsOcr }
      if (needsOcr) {
        extracted.imageDataUrl = await this.renderPageToDataUrl(page)
      }
      pages.push(extracted)
    }
    return pages
  }

  private async renderPageToDataUrl(page: PDFPageProxy): Promise<string> {
    const viewport = page.getViewport({ scale: this.ocrRenderScale })
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    const context = canvas.getContext('2d')
    if (!context) return ''
    await page.render({ canvas, canvasContext: context, viewport }).promise
    return canvas.toDataURL('image/png')
  }
}
