import { getDb } from '@/shared/db/database'
import { nowIso } from '@/shared/lib/dates'

export const DEFAULT_DAILY_GOAL = 10

export const SETTING_KEYS = {
  dailyGoal: 'dailyGoal',
} as const

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS]

export async function getSetting<T = unknown>(key: SettingKey): Promise<T | undefined> {
  const record = await getDb().settings.get(key)
  return record?.value as T | undefined
}

export async function setSetting(key: SettingKey, value: unknown): Promise<void> {
  await getDb().settings.put({ key, value, updatedAt: nowIso() })
}

export async function getDailyGoal(): Promise<number> {
  const value = await getSetting<number>(SETTING_KEYS.dailyGoal)
  return typeof value === 'number' && value > 0 ? value : DEFAULT_DAILY_GOAL
}
