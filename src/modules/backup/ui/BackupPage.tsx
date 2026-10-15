import { useState } from 'react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Card, CardHeader } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { useToast } from '@/shared/toast/useToast'
import { useBackupService } from '../application/useBackupService'

export function BackupPage() {
  const service = useBackupService()
  const { notify } = useToast()
  const [includePdf, setIncludePdf] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleExport() {
    setBusy(true)
    const res = await service.exportBackup(includePdf)
    if (res.ok) {
      service.downloadBackupFile(res.value)
      notify({ tone: 'success', title: 'Backup exportado' })
    } else {
      notify({ tone: 'error', title: 'Falha ao exportar', description: res.error.message })
    }
    setBusy(false)
  }

  return (
    <div>
      <PageHeader title="Backup" description="Exportação e importação local dos dados." />
      <Card>
        <CardHeader title="Exportar" />
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-ink-subtle">
            <input type="checkbox" checked={includePdf} onChange={(e) => setIncludePdf(e.target.checked)} />
            Incluir PDFs originais nos blobs de importação (quando existirem)
          </label>
          <Button onClick={handleExport} disabled={busy}>
            {busy ? 'Exportando...' : 'Baixar backup JSON'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
