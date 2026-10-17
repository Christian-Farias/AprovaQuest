import { describe, it, expect } from 'vitest'
import { validatePdfFile } from '../validate'

describe('validate', () => {
  it('rejects non-pdf', async () => {
    const res = validatePdfFile({ name: 'x.txt', size: 10, arrayBuffer: new ArrayBuffer(8) })
    expect(res.ok).toBe(false)
  })
})
