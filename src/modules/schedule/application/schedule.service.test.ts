import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { freshDb, disposeDb } from '@/test/db'
import type { AprovaQuestDatabase } from '@/shared/db/database'
import { createScheduleService } from './schedule.service'

describe('schedule.service', () => {
  let db: AprovaQuestDatabase
  let service: ReturnType<typeof createScheduleService>

  beforeEach(async () => {
    db = await freshDb()
    service = createScheduleService(db)
  })

  afterEach(async () => {
    await disposeDb(db)
  })

  it('cria plano de estudos e arquiva com sucesso', async () => {
    const res = await service.createPlan({ name: 'Polícia Federal 2026', examDate: '2026-11-15' })
    expect(res.ok).toBe(true)
    if (!res.ok) return

    expect(res.value.name).toBe('Polícia Federal 2026')
    expect(res.value.status).toBe('active')

    const planInDb = await db.plans.get(res.value.id)
    expect(planInDb?.name).toBe('Polícia Federal 2026')

    const archiveRes = await service.archivePlan(res.value.id)
    expect(archiveRes.ok).toBe(true)

    const updated = await db.plans.get(res.value.id)
    expect(updated?.status).toBe('archived')
  })

  it('define e atualiza disponibilidade semanal', async () => {
    const planRes = await service.createPlan({ name: 'Plano OAB' })
    if (!planRes.ok) throw new Error('Falha ao criar plano')
    const planId = planRes.value.id

    // Segunda-feira (1): 120 min
    const set1 = await service.setAvailability(planId, 1, 120)
    expect(set1.ok).toBe(true)

    let avail = await db.availability.where('planId').equals(planId).toArray()
    expect(avail).toHaveLength(1)
    expect(avail[0].weekday).toBe(1)
    expect(avail[0].minutes).toBe(120)

    // Atualiza Segunda-feira para 180 min
    const set2 = await service.setAvailability(planId, 1, 180)
    expect(set2.ok).toBe(true)

    avail = await db.availability.where('planId').equals(planId).toArray()
    expect(avail).toHaveLength(1)
    expect(avail[0].minutes).toBe(180)
  })

  it('cria sessão de estudo e atualiza seu status', async () => {
    const planRes = await service.createPlan({ name: 'Plano Geral' })
    if (!planRes.ok) throw new Error('Falha ao criar plano')

    const sessRes = await service.createSession({
      planId: planRes.value.id,
      title: 'Direito Constitucional - Art. 5º',
      type: 'theory',
      plannedDurationMin: 60,
      scheduledAt: '2026-10-20T10:00:00.000Z',
    })

    expect(sessRes.ok).toBe(true)
    if (!sessRes.ok) return
    expect(sessRes.value.status).toBe('planned')

    // Marca como feita
    const doneRes = await service.updateSessionStatus(sessRes.value.id, 'done', 55)
    expect(doneRes.ok).toBe(true)

    const sessionInDb = await db.studySessions.get(sessRes.value.id)
    expect(sessionInDb?.status).toBe('done')
    expect(sessionInDb?.actualDurationMin).toBe(55)
    expect(sessionInDb?.completedAt).toBeTruthy()

    // Exclui sessão
    const delRes = await service.deleteSession(sessRes.value.id)
    expect(delRes.ok).toBe(true)
    const afterDel = await db.studySessions.get(sessRes.value.id)
    expect(afterDel).toBeUndefined()
  })
})
