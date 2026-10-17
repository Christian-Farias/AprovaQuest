import { domainError } from '@/shared/db/errors'

export interface PdfFile {
  name: string
  size: number
  /** Conteúdo bruto para detectar assinatura %PDF. */
  arrayBuffer: ArrayBuffer
}

export const MAX_PDF_SIZE = 10 * 1024 * 1024 // 10MB

export function validatePdfFile(file: PdfFile): { ok: true } | { ok: false; reason: string } {
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return { ok: false, reason: 'O arquivo deve ser um PDF (.pdf).' }
  }
  if (file.size > MAX_PDF_SIZE) {
    return { ok: false, reason: 'Arquivo excede o tamanho máximo permitido (10MB).' }
  }
  if (file.size <= 4) {
    return { ok: false, reason: 'Arquivo PDF inválido (tamanho insuficiente).' }
  }
  const signature = new Uint8Array(file.arrayBuffer.slice(0, 4))
  const isPdf = signature[0] === 0x25 && signature[1] === 0x50 && signature[2] === 0x44 && signature[3] === 0x46 // %PDF
  if (!isPdf) {
    return { ok: false, reason: 'Arquivo não possui assinatura PDF válida (%PDF).' }
  }
  return { ok: true }
}

export function assertValidPdfFile(file: PdfFile): void {
  const result = validatePdfFile(file)
  if (!result.ok) throw domainError('validation', result.reason)
}
