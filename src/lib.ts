export const TABLES = [
  'disciplines',
  'subjects',
  'topics',
  'boards',
  'contests',
  'questions',
  'options',
  'attempts',
  'errorNotes',
  'reviews',
  'studySessions',
  'plans',
  'availability',
  'planGoals',
  'imports',
  'importPages',
  'settings',
] as const

export type SyncTable = (typeof TABLES)[number]

export function sync() {
  // Placeholder - will be implemented with Supabase
}
