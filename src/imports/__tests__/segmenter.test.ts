import { describe, it, expect } from 'vitest'
import { segmentText } from '../segmenter'

describe('segmenter', () => {
  it('segments basic', () => {
    const text = 'Questão 1) O que é?\nA) X\nB) Y\nGabarito: A'
    const res = segmentText(text)
    expect(res.length).toBeGreaterThan(0)
  })
})
