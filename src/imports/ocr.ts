export interface OcrResult {
  text: string
  confidence: number | null
}

export interface OcrEngine {
  recognize(dataUrl: string): Promise<OcrResult>
  terminate?(): Promise<void>
}

export type TesseractOcrEngineOptions = {
  workerPath?: string
  corePath?: string
  langPath?: string
  languages?: string[]
  timeoutMs?: number
}

/**
 * Stub OCR para testes. Não executa reconhecimento real.
 */
export class StubOcrEngine implements OcrEngine {
  private results: OcrResult[]

  constructor(results: OcrResult[] = [{ text: '', confidence: null }]) {
    this.results = [...results]
  }

  async recognize(): Promise<OcrResult> {
    const result = this.results.shift() ?? { text: '', confidence: null }
    return { ...result }
  }

  async terminate(): Promise<void> {}
}

let tesseractLoader: Promise<typeof import('tesseract.js')> | null = null

export function createTesseractOcrEngine(options: TesseractOcrEngineOptions = {}): OcrEngine {
  const workerPath = options.workerPath ?? '/tesseract/worker.min.js'
  const corePath = options.corePath ?? '/tesseract/tesseract-core.wasm.js'
  const langPath = options.langPath ?? '/tesseract'
  const languages = options.languages ?? ['por', 'eng']
  const timeoutMs = options.timeoutMs ?? 120000
  void timeoutMs

  let worker: import('tesseract.js').Worker | null = null
  const _queue: Array<(w: import('tesseract.js').Worker) => void> = []
  void _queue
  let _active = 0
  void _active


  async function getWorker(): Promise<import('tesseract.js').Worker> {
    if (!tesseractLoader) {
      tesseractLoader = import('tesseract.js').then((m) => m.default ?? m)
    }
    if (worker) return worker
    const Tesseract = await tesseractLoader
    worker = await Tesseract.createWorker(languages, 1, {
      workerPath,
      corePath,
      langPath,
    })
    return worker
  }

  async function recognize(dataUrl: string): Promise<OcrResult> {
    const w = await getWorker()
    try {
      const result = await w.recognize(dataUrl, { })
      const text = result?.data?.text ?? ''
      const confidence = typeof result?.data?.confidence === 'number' ? result.data.confidence : null
      return { text, confidence }
    } catch {
      return { text: '', confidence: null }
    }
  }

  async function terminate(): Promise<void> {
    if (worker) {
      try {
        await worker.terminate()
      } catch {
        // ignore
      }
      worker = null
    }
    tesseractLoader = null
  }

  return { recognize, terminate }
}
