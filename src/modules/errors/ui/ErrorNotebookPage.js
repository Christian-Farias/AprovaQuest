import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PageHeader } from '@/shared/ui/PageHeader';
import { Card, CardHeader } from '@/shared/ui/Card';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Badge } from '@/shared/ui/Badge';
import { useErrorNotes } from '../application/errors.hooks';
const CATEGORY_LABELS = {
    falta_conhecimento: 'Falta de conhecimento',
    interpretacao: 'Interpretação',
    desatencao: 'Desatenção',
    confusao_conceitual: 'Confusão conceitual',
};
export function ErrorNotebookPage() {
    const notes = useErrorNotes();
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Caderno de Erros", description: "Erros registrados com categorias, anota\u00E7\u00F5es e revis\u00E3o prevista." }), !notes || notes.length === 0 ? (_jsx(EmptyState, { title: "Nenhum erro registrado", description: "Registre erros ao revisar tentativas incorretas." })) : (_jsx("div", { className: "space-y-3", children: notes.map((note) => (_jsxs(Card, { children: [_jsx(CardHeader, { title: CATEGORY_LABELS[note.category] }), _jsxs("div", { className: "space-y-2 text-sm text-ink-subtle", children: [note.note && _jsx("p", { children: note.note }), note.explanation && _jsx("p", { children: note.explanation }), _jsx("div", { className: "flex gap-2", children: _jsx(Badge, { tone: note.resolved ? 'accent' : 'warn', children: note.resolved ? 'Resolvido' : 'Pendente' }) })] })] }, note.id))) }))] }));
}
