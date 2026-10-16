import { useLiveQuery } from 'dexie-react-hooks'
import { getDb } from '@/shared/db/database'

export function usePlans() {
  return useLiveQuery(() => getDb().plans.orderBy('createdAt').reverse().toArray(), [])
}

export function useActivePlan() {
  return useLiveQuery(
    () => getDb().plans.where('status').equals('active').first(),
    [],
  )
}

export function useSessions(planId?: string) {
  return useLiveQuery(async () => {
    const db = getDb()
    if (planId) {
      return db.studySessions.where('planId').equals(planId).sortBy('scheduledAt')
    }
    return db.studySessions.orderBy('scheduledAt').toArray()
  }, [planId])
}

export function useAvailability(planId?: string) {
  return useLiveQuery(async () => {
    if (!planId) return []
    return getDb().availability.where('planId').equals(planId).toArray()
  }, [planId])
}

export function usePlanGoals(planId?: string) {
  return useLiveQuery(async () => {
    if (!planId) return []
    return getDb().planGoals.where('planId').equals(planId).toArray()
  }, [planId])
}
