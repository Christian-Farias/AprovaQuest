import type { Attempt, Question } from '@/shared/db/types'

/** XP necessário para subir do nível informado para o próximo. */
export function xpForLevel(level: number): number {
  return 100 * level
}

export function levelFromXp(xp: number): { level: number; current: number; needed: number; total: number } {
  let level = 1
  let remaining = Math.max(0, Math.floor(xp))
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level)
    level += 1
  }
  return { level, current: remaining, needed: xpForLevel(level), total: xp }
}

/**
 * XP conquistada a partir das tentativas registradas.
 * - 1 XP por tentativa respondida;
 * - bônus por acerto ponderado pela dificuldade da questão (2 × dificuldade);
 * - bônus pela melhor sequência de dias (5 × sequência).
 */
export function computeXp(
  attempts: Attempt[],
  questions: Question[],
  bestStreak = 0,
): number {
  const difficultyById = new Map(questions.map((q) => [q.id, q.difficulty ?? 1]))
  let xp = 0
  for (const attempt of attempts) {
    if (attempt.outcome === 'unanswered') continue
    xp += 1
    if (attempt.outcome === 'correct') {
      xp += 2 * (difficultyById.get(attempt.questionId) ?? 1)
    }
  }
  xp += Math.max(0, bestStreak) * 5
  return xp
}
