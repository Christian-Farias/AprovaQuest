import { PageHeader } from '@/shared/ui/PageHeader'
import { Card } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { useToast } from '@/shared/toast/useToast'

export function MaterialsPage() {
  const toast = useToast()
  return (
    <div>
      <PageHeader title="Materiais" description="Arquivos do Google Drive" />
      <Card>
        <p className="text-sm text-mist-300">Lista de arquivos virá da API /api/drive com access_token da sessão.</p>
        <div className="mt-3">
          <Button onClick={() => toast.notify({ tone: 'info', title: 'Funcionalidade em construção' })}>
            Carregar
          </Button>
        </div>
      </Card>
    </div>
  )
}
