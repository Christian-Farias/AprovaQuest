import { PageHeader } from '@/shared/ui/PageHeader'
import { Card, CardHeader } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Badge } from '@/shared/ui/Badge'
import { useErrorNotes } from '../application/errors.hooks'

const CATEGORY_LABELS = {
  falta_conhecimento: 'Falta de conhecimento',
  interpretacao: 'Interpretação',
  desatencao: 'Desatenção',
  confusao_conceitual: 'Confusão conceitual',
} as const

export function ErrorNotebookPage() {
  const notes = useErrorNotes()

  return (
    <div>
      <PageHeader title="Caderno de Erros" description="Erros registrados com categorias, anotações e revisão prevista." />
      {!notes || notes.length === 0 ? (
        <EmptyState title="Nenhum erro registrado" description="Registre erros ao revisar tentativas incorretas." />
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.id}>
              <CardHeader title={CATEGORY_LABELS[note.category]} />
              <div className="space-y-2 text-sm text-ink-subtle">
                {note.note && <p>{note.note}</p>}
                {note.explanation && <p>{note.explanation}</p>}
                <div className="flex gap-2">
                  <Badge tone={note.resolved ? 'accent' : 'warn'}>{note.resolved ? 'Resolvido' : 'Pendente'}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
