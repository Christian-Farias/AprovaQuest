import type { Attempt } from '@/shared/db/types'
import { toDayKey } from '@/shared/lib/dates'

export const DAILY_GOAL = 10 // questões por dia para contar como dia estudado

export interface StreakResult {
  /** Sequência atual de dias consecutivos com meta atingida. */
  current: number
  /** Maior sequência já registrada. */
  best: number
  /** Questões respondidas hoje. */
  todayCount: number
  /** Meta diária (10 questões). */
  goal: number
  /** Se hoje já atingiu a meta. */
  completedToday: boolean
  /** Se ontem atingiu a meta (sequência ainda viva). */
  activeYesterday: boolean
}

/**
 * Retorna a data local no formato YYYY-MM-DD.
 * Usamos hora local (não UTC) para que o usuário veja o "dia" no fuso dele.
 */
export function toLocalDayKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Converte um timestamp ISO para dia local (YYYY-MM-DD) usando o fuso do usuário.
 */
export function toLocalDayKeyFromIso(iso: string): string {
  return toLocalDayKey(new Date(iso))
}

/**
 * Calcula a sequência de dias a partir das tentativas.
 *
 * Regras:
 * - Um "dia estudado" é qualquer dia local com >= DAILY_GOAL tentativas.
 * - A sequência atual conta regressivamente a partir de hoje.
 * - Se hoje ainda não atingiu a meta MAS ontem atingiu, a sequência está "em aberto"
 *   (mantém a contagem de ontem para não quebrar antes da meia-noite).
 */
export function computeStreak(attempts: Attempt[], now: Date = new Date()): StreakResult {
  // Agrupa tentativas por dia local
  const byDay = new Map<string, number>()
  for (const attempt of attempts) {
    const day = toLocalDayKeyFromIso(attempt.answeredAt)
    byDay.set(day, (byDay.get(day) ?? 0) + 1)
  }

  const todayKey = toLocalDayKey(now)
  const yesterdayDate = new Date(now)
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterdayKey = toLocalDayKey(yesterdayDate)

  const todayCount = byDay.get(todayKey) ?? 0
  const completedToday = todayCount >= DAILY_GOAL

  // Conjunto de dias "qualificados" (atingiu a meta)
  const qualifiedDays = new Set<string>()
  for (const [day, count] of byDay) {
    if (count >= DAILY_GOAL) qualifiedDays.add(day)
  }

  // Calcula melhor sequência (histórica)
  const sortedDays = [...qualifiedDays].sort()
  let best = 0
  let tempBest = 0
  let prevDay: string | null = null
  for (const day of sortedDays) {
    if (prevDay === null) {
      tempBest = 1
    } else {
      const prev = new Date(prevDay)
      const curr = new Date(day)
      const diffMs = curr.getTime() - prev.getTime()
      const diffDays = Math.round(diffMs / 86_400_000)
      if (diffDays === 1) {
        tempBest += 1
      } else {
        tempBest = 1
      }
    }
    best = Math.max(best, tempBest)
    prevDay = day
  }

  // Calcula sequência atual contando para trás a partir de hoje (ou ontem)
  let current = 0
  const startDay = completedToday ? todayKey : yesterdayKey

  if (!qualifiedDays.has(startDay)) {
    // Nem hoje nem ontem bateu a meta
    current = 0
  } else {
    const cursor = new Date(startDay)
    while (true) {
      const key = toLocalDayKey(cursor)
      if (!qualifiedDays.has(key)) break
      current += 1
      cursor.setDate(cursor.getDate() - 1)
    }
  }

  const activeYesterday = qualifiedDays.has(yesterdayKey)

  return {
    current,
    best: Math.max(best, current),
    todayCount,
    goal: DAILY_GOAL,
    completedToday,
    activeYesterday,
  }
}
