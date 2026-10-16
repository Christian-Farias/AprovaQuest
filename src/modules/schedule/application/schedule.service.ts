import { getDb } from '@/shared/db/database'
import { newId } from '@/shared/lib/ids'
import { nowIso } from '@/shared/lib/dates'
import type {
  Plan,
  StudySession,
  Availability,
  SessionStatus,
  PlanStatus,
} from '@/shared/db/types'
import { toResult } from '@/shared/lib/async'
import type { Result } from '@/shared/lib/result'
import { useMemo } from 'react'

export interface CreatePlanInput {
  name: string
  examDate?: string | null
}

export interface CreateSessionInput {
  planId?: string | null
  type: StudySession['type']
  disciplineId?: string | null
  topicId?: string | null
  title: string
  plannedDurationMin: number
  scheduledAt: string
}

export function createScheduleService(db = getDb()) {
  function createPlan(input: CreatePlanInput): Promise<Result<Plan>> {
    return toResult(async () => {
      const at = nowIso()
      const plan: Plan = {
        id: newId(),
        name: input.name.trim(),
        status: 'active',
        examDate: input.examDate ?? null,
        createdAt: at,
        updatedAt: at,
      }
      await db.plans.add(plan)
      return plan
    })
  }

  function archivePlan(id: string): Promise<Result<void>> {
    return toResult(async () => {
      await db.plans.update(id, { status: 'archived' as PlanStatus, updatedAt: nowIso() })
    })
  }

  function setAvailability(planId: string, weekday: number, minutes: number): Promise<Result<void>> {
    return toResult(async () => {
      const existing = await db.availability
        .where('[planId+weekday]')
        .equals([planId, weekday])
        .first()
      if (existing) {
        await db.availability.update(existing.id, { minutes })
      } else {
        const record: Availability = { id: newId(), planId, weekday, minutes }
        await db.availability.add(record)
      }
    })
  }

  function createSession(input: CreateSessionInput): Promise<Result<StudySession>> {
    return toResult(async () => {
      const at = nowIso()
      const session: StudySession = {
        id: newId(),
        planId: input.planId ?? null,
        type: input.type,
        disciplineId: input.disciplineId ?? null,
        topicId: input.topicId ?? null,
        title: input.title.trim(),
        plannedDurationMin: input.plannedDurationMin,
        actualDurationMin: null,
        status: 'planned',
        scheduledAt: input.scheduledAt,
        completedAt: null,
        priorityReason: '',
        createdAt: at,
        updatedAt: at,
      }
      await db.studySessions.add(session)
      return session
    })
  }

  function updateSessionStatus(
    id: string,
    status: SessionStatus,
    actualDurationMin?: number,
  ): Promise<Result<void>> {
    return toResult(async () => {
      const patch: Partial<StudySession> = {
        status,
        updatedAt: nowIso(),
      }
      if (status === 'done') {
        patch.completedAt = nowIso()
        if (actualDurationMin !== undefined) patch.actualDurationMin = actualDurationMin
      }
      await db.studySessions.update(id, patch)
    })
  }

  function deleteSession(id: string): Promise<Result<void>> {
    return toResult(async () => {
      await db.studySessions.delete(id)
    })
  }

  return { createPlan, archivePlan, setAvailability, createSession, updateSessionStatus, deleteSession }
}

export function useScheduleService() {
  const db = getDb()
  return useMemo(() => createScheduleService(db), [db])
}
