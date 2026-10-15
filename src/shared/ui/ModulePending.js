import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PageHeader } from './PageHeader';
import { Card } from './Card';
import { Badge } from './Badge';
/**
 * Página de módulo ainda não implementado.
 * Deixa explícito o que é apenas estrutura para não induzir o usuário a erro.
 */
export function ModulePending({ title, description, planned, }) {
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: title, description: description }), _jsxs(Card, { className: "border-warn-500/40 bg-warn-500/5", children: [_jsx("div", { className: "mb-3 flex items-center gap-2", children: _jsx(Badge, { tone: "warn", children: "Ainda n\u00E3o implementado" }) }), _jsx("p", { className: "text-sm text-mist-200", children: "Esta p\u00E1gina existe apenas como estrutura de navega\u00E7\u00E3o. Nenhuma funcionalidade aqui est\u00E1 ativa e nenhum dado \u00E9 criado ou exibido artificialmente." }), _jsx("p", { className: "mt-3 text-xs font-medium uppercase tracking-wide text-ink-400", children: "Previsto para este m\u00F3dulo" }), _jsx("ul", { className: "mt-1 list-inside list-disc space-y-1 text-sm text-ink-300", children: planned.map((item) => (_jsx("li", { children: item }, item))) })] })] }));
}
