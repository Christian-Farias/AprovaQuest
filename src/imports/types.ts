import type { ParsedQuestionFlags } from './segmenter'

export type { ParsedOption, ParsedQuestion, ParsedQuestionFlags } from './segmenter'

/**
 * Rascunho de questão gerado a partir de um PDF, ainda não persistido.
 * É o que a tela de revisão edita antes da gravação definitiva.
 */
export interface ImportDraft {
  statement: string
  options: Array<{ label: string; text: string; isCorrect: boolean }>
  answerConfirmed: boolean
  disciplineId: string | null
  topicId: string | null
  boardId: string | null
  contestId: string | null
  source: string | null
  explanation: string | null
  tags: string[]
  flags: ParsedQuestionFlags
  raw: string
}
