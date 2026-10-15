import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Button } from '@/shared/ui/Button';
import { Card, CardHeader } from '@/shared/ui/Card';
import { Field, Select } from '@/shared/ui/Field';
import { EmptyState } from '@/shared/ui/EmptyState';
import { useToast } from '@/shared/toast/useToast';
import { useDisciplines } from '@/modules/questions/application/questions.hooks';
import { getDb } from '@/shared/db/database';
import { BrowserPdfExtractor } from '../application/pdfExtractor';
import { createTesseractOcrEngine } from '../application/ocr';
import { createImportPipeline } from '../application/importPipeline';
export function ImportPdfPage() {
    const [stage, setStage] = useState('idle');
    const [pipeline] = useState(() => createImportPipeline(getDb(), new BrowserPdfExtractor(), createTesseractOcrEngine()));
    const [importId, setImportId] = useState(null);
    const [drafts, setDrafts] = useState([]);
    const [disciplineId, setDisciplineId] = useState('');
    const { notify } = useToast();
    const disciplines = useDisciplines();
    const reset = () => {
        setStage('idle');
        setImportId(null);
        setDrafts([]);
        setDisciplineId('');
    };
    async function handleFile(file) {
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            notify({ tone: 'error', title: 'Arquivo inválido', description: 'Selecione um arquivo PDF.' });
            return;
        }
        try {
            setStage('starting');
            const res = await pipeline.startImport(file);
            if (!res.ok)
                throw new Error(res.error.message);
            setImportId(res.value);
            setStage('extracting');
            const d = await pipeline.extractDrafts(res.value, { disciplineId: disciplineId || null });
            if (!d.ok)
                throw new Error(d.error.message);
            setDrafts(d.value.map((x) => ({ ...x, selected: true })));
            setStage('reviewing');
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            notify({ tone: 'error', title: 'Falha na importação', description: msg });
            reset();
        }
    }
    async function handleCommit() {
        if (!importId)
            return;
        try {
            setStage('committing');
            const res = await pipeline.commitImport({ importId, drafts });
            if (!res.ok)
                throw new Error(res.error.message);
            notify({ tone: 'success', title: 'Importação concluída', description: `${res.value.importedCount} questões importadas.` });
            setStage('done');
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            notify({ tone: 'error', title: 'Falha ao gravar', description: msg });
            setStage('reviewing');
        }
    }
    async function handleCancel() {
        if (!importId)
            return;
        await pipeline.cancelImport(importId);
        notify({ tone: 'error', title: 'Importação cancelada' });
        reset();
    }
    const canCommit = drafts.some((d) => d.selected && d.answerConfirmed && (d.disciplineId || disciplineId));
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Importar PDFs", description: "Extraia quest\u00F5es de um PDF e revise antes de gravar." }), stage === 'idle' && (_jsxs(Card, { className: "space-y-4", children: [_jsx(CardHeader, { title: "Selecionar arquivo PDF" }), _jsx(Field, { label: "Disciplina padr\u00E3o (opcional)", children: _jsxs(Select, { value: disciplineId, onChange: (e) => setDisciplineId(e.target.value), children: [_jsx("option", { value: "", children: "Nenhuma" }), (disciplines ?? []).map((d) => (_jsx("option", { value: d.id, children: d.name }, d.id)))] }) }), _jsx("div", { className: "flex items-center gap-2", children: _jsx("input", { type: "file", accept: "application/pdf", onChange: (e) => {
                                const f = e.target.files?.[0];
                                if (f)
                                    void handleFile(f);
                                e.target.value = '';
                            } }) }), _jsx("p", { className: "text-xs text-ink-subtle", children: "PDFs com at\u00E9 10MB. P\u00E1ginas digitalizadas usar\u00E3o OCR (stub no momento)." })] })), (stage === 'starting' || stage === 'extracting') && (_jsx(EmptyState, { title: "Processando PDF", description: "Validando, extraindo texto e segmentando quest\u00F5es..." })), stage === 'reviewing' && (_jsxs("div", { className: "space-y-4", children: [_jsxs(Card, { children: [_jsx(CardHeader, { title: "Revis\u00E3o de rascunhos" }), _jsxs("div", { className: "text-sm text-ink-subtle", children: [drafts.filter((d) => d.selected && d.answerConfirmed).length, " v\u00E1lidas de ", drafts.length] })] }), drafts.map((d, i) => (_jsxs(Card, { className: "space-y-2", children: [_jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", checked: d.selected, onChange: (e) => setDrafts((prev) => prev.map((x, j) => (j === i ? { ...x, selected: e.target.checked } : x))) }), _jsxs("span", { className: "text-sm font-medium", children: ["Quest\u00E3o ", i + 1] })] }), _jsx("p", { className: "whitespace-pre-wrap text-sm", children: d.statement }), d.options.map((o) => (_jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsxs("span", { children: [o.label, ")"] }), _jsx("span", { children: o.text }), d.answerConfirmed && o.isCorrect && _jsx("span", { className: "text-ok", children: "\u2713 correto" })] }, o.label))), !d.answerConfirmed && (_jsx("div", { className: "text-xs text-warn", children: "Gabarito n\u00E3o confirmado \u2014 ser\u00E1 rejeitado no commit." }))] }, i))), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { onClick: handleCommit, disabled: !canCommit || stage !== 'reviewing', children: "Gravar selecionadas" }), _jsx(Button, { variant: "ghost", onClick: handleCancel, disabled: stage !== 'reviewing', children: "Cancelar" })] })] })), stage === 'done' && (_jsxs(Card, { children: [_jsx(CardHeader, { title: "Conclu\u00EDdo" }), _jsxs("div", { className: "flex justify-between", children: [_jsx("p", { className: "text-sm text-ink-subtle", children: "Importa\u00E7\u00E3o finalizada." }), _jsx(Button, { onClick: reset, children: "Nova importa\u00E7\u00E3o" })] })] }))] }));
}
