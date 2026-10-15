import { PageHeader } from './PageHeader'
import { Card } from './Card'
import { Badge } from './Badge'

/**
 * Página de módulo ainda não implementado.
 * Deixa explícito o que é apenas estrutura para não induzir o usuário a erro.
 */
export function ModulePending({
  title,
  description,
  planned,
}: {
  title: string
  description: string
  planned: string[]
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <Card className="border-warn-500/40 bg-warn-500/5">
        <div className="mb-3 flex items-center gap-2">
          <Badge tone="warn">Ainda não implementado</Badge>
        </div>
        <p className="text-sm text-mist-200">
          Esta página existe apenas como estrutura de navegação. Nenhuma funcionalidade aqui está
          ativa e nenhum dado é criado ou exibido artificialmente.
        </p>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-ink-400">
          Previsto para este módulo
        </p>
        <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-ink-300">
          {planned.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
