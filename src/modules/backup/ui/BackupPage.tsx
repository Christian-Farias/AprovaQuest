import { useRef, useState } from 'react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Card, CardHeader } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { useToast } from '@/shared/toast/useToast'
import { useConfirm } from '@/shared/ui/ConfirmDialog'
import { useBackupService } from '../application/useBackupService'

export function BackupPage() {
  const service = useBackupService()
  const { notify } = useToast()
  const confirm = useConfirm()
  const [includePdf, setIncludePdf] = useState(false)
  const [exportBusy, setExportBusy] = useState(false)
  const [importBusy, setImportBusy] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleExport() {
    setExportBusy(true)
    const res = await service.exportBackup(includePdf)
    if (res.ok) {
      service.downloadBackupFile(res.value)
      notify({ tone: 'success', title: 'Backup exportado' })
    } else {
      notify({ tone: 'error', title: 'Falha ao exportar', description: res.error.message })
    }
    setExportBusy(false)
  }

  async function handleImport() {
    if (!importFile) return
    const ok = await confirm({
      title: 'Restaurar backup?',
      description:
        'Os dados existentes serão MESCLADOS com o backup selecionado. Registros duplicados (mesmo ID) serão sobrescritos pelo backup. Esta ação não pode ser desfeita. Faça um backup atual antes de continuar.',
      confirmLabel: 'Importar mesmo assim',
      danger: true,
    })
    if (!ok) return

    setImportBusy(true)
    try {
      const text = await importFile.text()
      const json = JSON.parse(text) as unknown
      const res = await service.importBackup(json)
      if (res.ok) {
        notify({ tone: 'success', title: 'Backup importado com sucesso' })
        setImportFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
      } else {
        notify({ tone: 'error', title: 'Falha ao importar', description: res.error.message })
      }
    } catch {
      notify({ tone: 'error', title: 'Arquivo inválido', description: 'O arquivo não é um JSON válido.' })
    } finally {
      setImportBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Backup" description="Exportação e importação local dos dados." />

      {/* Export */}
      <Card>
        <CardHeader
          title="Exportar"
          description="Baixa um arquivo JSON com todos os seus dados (questões, tentativas, erros, planos…)."
        />
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-ink-300">
            <input
              type="checkbox"
              className="size-4 accent-[var(--color-accent-500)]"
              checked={includePdf}
              onChange={(e) => setIncludePdf(e.target.checked)}
            />
            Incluir PDFs originais nos blobs de importação (quando existirem)
          </label>
          <Button onClick={handleExport} disabled={exportBusy} loading={exportBusy}>
            {exportBusy ? 'Exportando…' : '⬇ Baixar backup JSON'}
          </Button>
        </div>
      </Card>

      {/* Import */}
      <Card>
        <CardHeader
          title="Importar / Restaurar"
          description="Selecione um arquivo de backup JSON exportado anteriormente. Os dados serão mesclados com os existentes."
        />
        <div className="space-y-3">
          <div
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-600 bg-ink-900 px-6 py-8 text-center transition-colors hover:border-ink-500 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="text-3xl mb-2">📂</span>
            {importFile ? (
              <>
                <p className="text-sm font-medium text-mist-200">{importFile.name}</p>
                <p className="text-xs text-ink-400 mt-1">
                  {(importFile.size / 1024).toFixed(1)} KB — clique para trocar
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-mist-200">Clique para selecionar o arquivo</p>
                <p className="text-xs text-ink-400 mt-1">aprovaquest-backup-*.json</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {importFile && (
            <div className="rounded-lg border border-warn-500/30 bg-warn-500/5 px-3 py-2 text-xs text-warn-400">
              ⚠ Os dados existentes serão mesclados com o backup. Faça uma exportação antes de continuar caso queira preservar o estado atual.
            </div>
          )}

          <Button
            onClick={handleImport}
            disabled={!importFile || importBusy}
            loading={importBusy}
            variant="secondary"
          >
            {importBusy ? 'Importando…' : '⬆ Importar backup'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
