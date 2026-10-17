export interface ParsedOption {
  label: string
  text: string
}

export interface ParsedQuestionFlags {
  /** Enunciado apresenta trechos potencialmente truncados ou ambíguos. */
  statementUncertain: boolean
  /** Número reduzido de alternativas detectadas ou padrão atípico. */
  optionsUncertain: boolean
  /** Não foi identificado gabarito ou foi identificado de forma não confirmada. */
  answerUnconfirmed: boolean
  /** Há indícios de tabela, imagem ou quebra de página que exige revisão. */
  requiresManualReview: boolean
}

export interface ParsedQuestion {
  number: number | null
  statement: string
  options: ParsedOption[]
  answerLabel: string | null
  flags: ParsedQuestionFlags
  raw: string
}

export const MIN_CHARS_FOR_TEXT_PAGE = 200
export const MIN_OPTIONS_FOR_MCQ = 2

export function detectNeedsOcr(text: string): boolean {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length < MIN_CHARS_FOR_TEXT_PAGE) return true
  if ((normalized.match(/[A-Za-zÀ-ÿ]{3,}/g) ?? []).length < 5) return true
  return false
}

function joinLines(lines: string[]): string {
  return lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(' ')
}

/**
 * Segmenta um bloco de texto em questões com heurísticas determinísticas.
 * Nunca inventa gabarito. Campos incertos são sinalizados.
 */
export function segmentText(fullText: string): ParsedQuestion[] {
  const lines = fullText.replace(/\r\n/g, '\n').split('\n')
  const blocks: Array<{ start: number; text: string }> = []
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    const match = line.match(/^\s*(?:quest[ãa]o\s*)?(\d{1,4})\s*[.)-]\s+(.+)/i)
    if (match) {
      blocks.push({ start: i, text: match[2] ?? '' })
    } else if (blocks.length > 0 && line.match(/^\s*\(?[A-Ea-e]\)?\s*[.)-]/) === null) {
      const current = blocks[blocks.length - 1]
      current.text += ' ' + line.trim()
    }
  }

  if (blocks.length === 0) {
    const statement = fullText.replace(/\s+/g, ' ').trim()
    const flags: ParsedQuestionFlags = {
      statementUncertain: statement.length < 10,
      optionsUncertain: true,
      answerUnconfirmed: true,
      requiresManualReview: /tabela|imagem|figura|quebra de pagina|fórmula|formula/i.test(fullText),
    }
    return statement.length > 0
      ? [
          {
            number: null,
            statement,
            options: [],
            answerLabel: null,
            flags,
            raw: fullText,
          },
        ]
      : []
  }

  const questions: ParsedQuestion[] = []
  for (let idx = 0; idx < blocks.length; idx += 1) {
    const block = blocks[idx]
    const blockLines = lines.slice(block.start + 1)
    const options: ParsedOption[] = []
    const statementParts: string[] = []
    statementParts.push(block.text)
    for (let j = 0; j < blockLines.length; j += 1) {
      const l = blockLines[j]
      if (!l) continue
      const om = l.match(/^\s*\(?([A-Ea-e])\)?\s*[.)-]\s*(.*)$/i)
      if (om) {
        options.push({ label: om[1].toUpperCase(), text: om[2].trim() })
        continue
      }
      const nextQuestion = l.match(/^\s*(?:quest[ãa]o\s*)?\d{1,4}\s*[.)-]/i)
      if (nextQuestion && options.length > 0) {
        // encontrou próxima questão
        break
      }
      statementParts.push(l.trim())
    }
    const statement = joinLines(statementParts)
    const answerLabel = findAnswerLabel(fullText)
    const hasFewOptions = options.length < MIN_OPTIONS_FOR_MCQ
    const hasTableHint = /tabela|imagem|figura|quebra de pagina|fórmula|formula/i.test(statement + ' ' + options.map((o) => o.text).join(' '))
    questions.push({
      number: null,
      statement,
      options,
      answerLabel,
      flags: {
        statementUncertain: statement.length < 20,
        optionsUncertain: hasFewOptions,
        answerUnconfirmed: answerLabel === null,
        requiresManualReview: hasTableHint || hasFewOptions,
      },
      raw: statement,
    })
  }
  return questions
}

function findAnswerLabel(text: string): string | null {
  // Restringe a busca a cada linha para evitar falsos positivos ao atravessar quebras.
  const lines = text.split('\n')
  const patterns = [
    /^\s*gabarito\s*[:\-]?\s*\(?([A-E])\)?\s*$/i,
    /gabarito\s*[:\-]\s*\(?([A-E])\)?\b/i,
    /resposta\s*[:\-]\s*\(?([A-E])\)?\b/i,
    /\(\s*resposta\s*:\s*([A-E])\s*\)/i,
    /\bR\s*:\s*([A-E])\b/i,
  ]
  for (const line of lines) {
    for (const pattern of patterns) {
      const match = line.match(pattern)
      if (match) return match[1].toUpperCase()
    }
  }
  return null
}
