import { useEffect, useState } from 'react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Card } from '@/shared/ui/Card'
import { Field, Input } from '@/shared/ui/Field'
import { Button } from '@/shared/ui/Button'
import { useToast } from '@/shared/toast/useToast'
import { DEFAULT_DAILY_GOAL, SETTING_KEYS, getDailyGoal, setSetting } from '@/shared/db/settings'

export function ConfigPage() {
  const [goal, setGoal] = useState(String(DEFAULT_DAILY_GOAL))
  const toast = useToast()

  useEffect(() => {
    getDailyGoal().then((value) => setGoal(String(value)))
  }, [])

  async function save() {
    const value = Math.max(1, parseInt(goal, 10) || DEFAULT_DAILY_GOAL)
    setGoal(String(value))
    await setSetting(SETTING_KEYS.dailyGoal, value)
    toast.notify({ tone: 'success', title: 'Configurações salvas' })
  }

  return (
    <div>
      <PageHeader title="Configurações" description="Preferências do aplicativo" />
      <Card>
        <Field label="Meta diária de questões" hint="Usada para manter a sequência (streak)">
          <Input type="number" min={1} value={goal} onChange={(e) => setGoal(e.target.value)} />
        </Field>
        <div className="mt-3">
          <Button onClick={save}>Salvar</Button>
        </div>
      </Card>
    </div>
  )
}
