import type { QuestionType } from '@/shared/db/types'

export interface OptionLike {
  label: string
  text: string
  isCorrect: boolean
}

/**
 * Regra pura de validação de alternativas, compartilhada entre validação Zod
 * e os serviços de persistência.
 */
export function validateOptionSet(
  type: QuestionType,
  options: OptionLike[],
  answerConfirmed: boolean,
): string | null {
  if (options.length < 2) {
    return 'Informe ao menos 2 alternativas.'
  }
  if (type === 'true_false' && options.length !== 2) {
    return 'Questões de certo/errado exigem exatamente 2 alternativas.'
  }
  const correct = options.filter((o) => o.isCorrect).length
  if (answerConfirmed && correct !== 1) {
    return 'Marque exatamente uma alternativa correta para confirmar o gabarito.'
  }
  if (!answerConfirmed && correct > 1) {
    return 'Gabarito não confirmado não pode ter mais de uma alternativa marcada como correta.'
  }
  return null
}
