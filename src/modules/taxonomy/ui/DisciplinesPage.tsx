import { useState } from 'react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Field'
import { useDisciplines, useSubjects, useTopics } from '@/modules/questions/application/questions.hooks'
import { useTaxonomyService } from '@/modules/questions/application/useTaxonomyService'
import { useToast } from '@/shared/toast/useToast'
import { useConfirm } from '@/shared/ui/ConfirmDialog'
import { getDb } from '@/shared/db/database'

export function DisciplinesPage() {
  const disciplines = useDisciplines()
  const taxonomy = useTaxonomyService()
  const toast = useToast()
  const confirm = useConfirm()
  const [newDisc, setNewDisc] = useState('')
  const [selectedDisc, setSelectedDisc] = useState('')
  const [newSubj, setNewSubj] = useState('')
  const [selectedSubj, setSelectedSubj] = useState('')
  const [newTopic, setNewTopic] = useState('')
  const subjects = useSubjects(selectedDisc || undefined)
  const topics = useTopics({
    disciplineId: selectedDisc || undefined,
    subjectId: selectedSubj || undefined,
  })

  async function addDisc() {
    if (!newDisc.trim()) return
    const res = await taxonomy.createDiscipline({ name: newDisc.trim() })
    if (res.ok) {
      setNewDisc('')
      toast.notify({ tone: 'success', title: 'Disciplina criada' })
    } else {
      toast.notify({ tone: 'error', title: 'Erro', description: res.error.message })
    }
  }

  async function addSubj() {
    if (!selectedDisc || !newSubj.trim()) return
    const res = await taxonomy.createSubject({ disciplineId: selectedDisc, name: newSubj.trim() })
    if (res.ok) {
      setNewSubj('')
      toast.notify({ tone: 'success', title: 'Assunto criado' })
    } else {
      toast.notify({ tone: 'error', title: 'Erro', description: res.error.message })
    }
  }

  async function addTopic() {
    if (!selectedDisc || !newTopic.trim()) return
    const res = await taxonomy.createTopic({
      disciplineId: selectedDisc,
      subjectId: selectedSubj || null,
      name: newTopic.trim(),
    })
    if (res.ok) {
      setNewTopic('')
      toast.notify({ tone: 'success', title: 'Tópico criado' })
    } else {
      toast.notify({ tone: 'error', title: 'Erro', description: res.error.message })
    }
  }

  async function delDisc(id: string) {
    const db = getDb()
    const count = await db.questions.where('disciplineId').equals(id).count()
    const ok = await confirm({
      title: 'Excluir disciplina?',
      description: `${count} questão(ões) usam esta disciplina. Só é possível excluir quando não há assuntos, tópicos nem questões vinculados. Continuar?`,
      confirmLabel: 'Excluir',
      danger: true,
    })
    if (!ok) return
    const res = await taxonomy.deleteDiscipline(id)
    if (res.ok) {
      if (selectedDisc === id) {
        setSelectedDisc('')
        setSelectedSubj('')
      }
      toast.notify({ tone: 'success', title: 'Excluído' })
    } else {
      toast.notify({ tone: 'error', title: 'Erro', description: res.error.message })
    }
  }

  async function delSubj(id: string) {
    const ok = await confirm({
      title: 'Excluir assunto?',
      description: 'Só é possível excluir quando não há tópicos nem questões vinculados. Continuar?',
      confirmLabel: 'Excluir',
      danger: true,
    })
    if (!ok) return
    const res = await taxonomy.deleteSubject(id)
    if (res.ok) {
      if (selectedSubj === id) setSelectedSubj('')
      toast.notify({ tone: 'success', title: 'Excluído' })
    } else {
      toast.notify({ tone: 'error', title: 'Erro', description: res.error.message })
    }
  }

  async function delTopic(id: string) {
    const ok = await confirm({
      title: 'Excluir tópico?',
      description: 'Só é possível excluir quando não há questões vinculadas. Continuar?',
      confirmLabel: 'Excluir',
      danger: true,
    })
    if (!ok) return
    const res = await taxonomy.deleteTopic(id)
    if (res.ok) toast.notify({ tone: 'success', title: 'Excluído' })
    else toast.notify({ tone: 'error', title: 'Erro', description: res.error.message })
  }

  return (
    <div>
      <PageHeader title="Disciplinas" description="Gerencie disciplinas, assuntos e tópicos hierarquicamente" />
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <h3 className="font-semibold mb-2">Disciplinas</h3>
          <div className="flex gap-2 mb-3">
            <Input value={newDisc} onChange={(e) => setNewDisc(e.target.value)} placeholder="Nova disciplina" />
            <Button onClick={addDisc}>Adicionar</Button>
          </div>
          <ul className="space-y-1">
            {(disciplines ?? []).map((d) => (
              <li key={d.id} className="flex justify-between items-center text-sm">
                <button
                  className={`text-left flex-1 ${selectedDisc === d.id ? 'text-accent-400' : ''}`}
                  onClick={() => {
                    setSelectedDisc(d.id)
                    setSelectedSubj('')
                  }}
                >
                  {d.name}
                </button>
                <Button size="sm" variant="ghost" onClick={() => delDisc(d.id)}>
                  Excluir
                </Button>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 className="font-semibold mb-2">Assuntos</h3>
          <div className="flex gap-2 mb-3">
            <Input
              value={newSubj}
              onChange={(e) => setNewSubj(e.target.value)}
              placeholder="Novo assunto"
              disabled={!selectedDisc}
            />
            <Button onClick={addSubj} disabled={!selectedDisc}>
              Adicionar
            </Button>
          </div>
          <ul className="space-y-1">
            {(subjects ?? []).map((s) => (
              <li key={s.id} className="flex justify-between items-center text-sm">
                <button
                  className={`text-left flex-1 ${selectedSubj === s.id ? 'text-accent-400' : ''}`}
                  onClick={() => setSelectedSubj(s.id)}
                >
                  {s.name}
                </button>
                <Button size="sm" variant="ghost" onClick={() => delSubj(s.id)}>
                  Excluir
                </Button>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 className="font-semibold mb-2">Tópicos</h3>
          <div className="flex gap-2 mb-3">
            <Input
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="Novo tópico"
              disabled={!selectedDisc}
            />
            <Button onClick={addTopic} disabled={!selectedDisc}>
              Adicionar
            </Button>
          </div>
          <ul className="space-y-1">
            {(topics ?? []).map((t) => (
              <li key={t.id} className="flex justify-between items-center text-sm">
                <span className="flex-1">{t.name}</span>
                <Button size="sm" variant="ghost" onClick={() => delTopic(t.id)}>
                  Excluir
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
