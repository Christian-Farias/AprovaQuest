import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Card, CardHeader } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { useToast } from '@/shared/toast/useToast';
import { useBackupService } from '../application/useBackupService';
export function BackupPage() {
    const service = useBackupService();
    const { notify } = useToast();
    const [includePdf, setIncludePdf] = useState(false);
    const [busy, setBusy] = useState(false);
    async function handleExport() {
        setBusy(true);
        const res = await service.exportBackup(includePdf);
        if (res.ok) {
            service.downloadBackupFile(res.value);
            notify({ tone: 'success', title: 'Backup exportado' });
        }
        else {
            notify({ tone: 'error', title: 'Falha ao exportar', description: res.error.message });
        }
        setBusy(false);
    }
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Backup", description: "Exporta\u00E7\u00E3o e importa\u00E7\u00E3o local dos dados." }), _jsxs(Card, { children: [_jsx(CardHeader, { title: "Exportar" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("label", { className: "flex items-center gap-2 text-sm text-ink-subtle", children: [_jsx("input", { type: "checkbox", checked: includePdf, onChange: (e) => setIncludePdf(e.target.checked) }), "Incluir PDFs originais nos blobs de importa\u00E7\u00E3o (quando existirem)"] }), _jsx(Button, { onClick: handleExport, disabled: busy, children: busy ? 'Exportando...' : 'Baixar backup JSON' })] })] })] }));
}
