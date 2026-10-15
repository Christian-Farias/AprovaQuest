import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { Badge } from '@/shared/ui/Badge';
import { Card, CardHeader } from '@/shared/ui/Card';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Field, Input, Select } from '@/shared/ui/Field';
import { PageHeader } from '@/shared/ui/PageHeader';
import { StatCard } from '@/shared/ui/StatCard';
import { LoadingState } from '@/shared/ui/LoadingState';
import { formatDurationMs, formatPercent } from '@/shared/lib/format';
import { useStatisticsReport } from '../application/useStatisticsReport';
const initialFilters = {
    disciplineId: '',
    boardId: '',
    contestId: '',
    from: '',
    to: '',
    includeAnnulled: false,
    includeArchived: true,
};
function toStatsFilters(state) {
    return {
        disciplineId: state.disciplineId || undefined,
        boardId: state.boardId || undefined,
        contestId: state.contestId || undefined,
        from: state.from ? `${state.from}T00:00:00.000Z` : undefined,
        to: state.to ? `${state.to}T23:59:59.999Z` : undefined,
        includeAnnulled: state.includeAnnulled,
        includeArchived: state.includeArchived,
    };
}
function GroupSection({ title, groups }) {
    return (_jsxs(Card, { children: [_jsx(CardHeader, { title: title }), groups.length === 0 ? (_jsx("p", { className: "py-3 text-sm text-ink-400", children: "Sem dados para este agrupamento." })) : (_jsx("ul", { className: "divide-y divide-ink-700", children: groups.map((group) => (_jsxs("li", { className: "flex items-center justify-between gap-3 py-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "truncate text-sm text-mist-200", children: group.label }), _jsxs("p", { className: "text-xs text-ink-400", children: [group.total, " tentativas \u00B7 ", group.correct, " acertos \u00B7 ", group.incorrect, " erros", group.unanswered > 0 ? ` · ${group.unanswered} sem resposta` : ''] })] }), _jsx(Badge, { tone: group.accuracyRate === null
                                ? 'neutral'
                                : group.accuracyRate >= 0.7
                                    ? 'ok'
                                    : group.accuracyRate >= 0.5
                                        ? 'warn'
                                        : 'danger', children: formatPercent(group.accuracyRate) })] }, group.key))) }))] }));
}
export function StatisticsPage() {
    const [filters, setFilters] = useState(initialFilters);
    const statsFilters = useMemo(() => toStatsFilters(filters), [filters]);
    const report = useStatisticsReport(statsFilters);
    function update(key, value) {
        setFilters((current) => ({ ...current, [key]: value }));
    }
    if (!report) {
        return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Estat\u00EDsticas", description: "Desempenho calculado a partir das suas tentativas." }), _jsx(LoadingState, {})] }));
    }
    const { accuracy, unique } = report;
    const hasAnyAttempt = accuracy.total > 0;
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Estat\u00EDsticas", description: "Todos os n\u00FAmeros v\u00EAm das tentativas registradas no seu dispositivo. Quest\u00F5es anuladas ficam fora por padr\u00E3o." }), _jsxs(Card, { className: "mb-4", children: [_jsx(CardHeader, { title: "Filtros combin\u00E1veis" }), _jsxs("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: [_jsx(Field, { label: "Disciplina", children: _jsxs(Select, { value: filters.disciplineId, onChange: (e) => update('disciplineId', e.target.value), children: [_jsx("option", { value: "", children: "Todas" }), report.disciplineOptions.map((option) => (_jsx("option", { value: option.id, children: option.name }, option.id)))] }) }), _jsx(Field, { label: "Banca", children: _jsxs(Select, { value: filters.boardId, onChange: (e) => update('boardId', e.target.value), children: [_jsx("option", { value: "", children: "Todas" }), report.boardOptions.map((option) => (_jsx("option", { value: option.id, children: option.name }, option.id)))] }) }), _jsx(Field, { label: "Concurso", children: _jsxs(Select, { value: filters.contestId, onChange: (e) => update('contestId', e.target.value), children: [_jsx("option", { value: "", children: "Todos" }), report.contestOptions.map((option) => (_jsx("option", { value: option.id, children: option.name }, option.id)))] }) }), _jsx(Field, { label: "De", children: _jsx(Input, { type: "date", value: filters.from, onChange: (e) => update('from', e.target.value) }) }), _jsx(Field, { label: "At\u00E9", children: _jsx(Input, { type: "date", value: filters.to, onChange: (e) => update('to', e.target.value) }) }), _jsxs("div", { className: "flex items-end gap-4 pb-1", children: [_jsxs("label", { className: "flex items-center gap-2 text-sm text-mist-200", children: [_jsx("input", { type: "checkbox", className: "size-4 accent-[var(--color-accent-500)]", checked: filters.includeAnnulled, onChange: (e) => update('includeAnnulled', e.target.checked) }), "Incluir anuladas"] }), _jsxs("label", { className: "flex items-center gap-2 text-sm text-mist-200", children: [_jsx("input", { type: "checkbox", className: "size-4 accent-[var(--color-accent-500)]", checked: filters.includeArchived, onChange: (e) => update('includeArchived', e.target.checked) }), "Incluir arquivadas"] })] })] })] }), !hasAnyAttempt ? (_jsx(EmptyState, { title: "Sem tentativas no per\u00EDodo/filtros", description: "Responda quest\u00F5es para gerar estat\u00EDsticas. Ajuste os filtros se esperava ver dados aqui." })) : (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3 lg:grid-cols-4", children: [_jsx(StatCard, { label: "Tentativas", value: accuracy.total, tone: "brand" }), _jsx(StatCard, { label: "Aproveitamento", value: formatPercent(accuracy.accuracyRate), tone: "accent", hint: `${accuracy.answered} respondidas` }), _jsx(StatCard, { label: "Acertos", value: accuracy.correct, tone: "ok" }), _jsx(StatCard, { label: "Erros", value: accuracy.incorrect, tone: "danger" }), _jsx(StatCard, { label: "Sem resposta", value: accuracy.unanswered }), _jsx(StatCard, { label: "Tempo de estudo", value: formatDurationMs(report.studyTimeMs) }), _jsx(StatCard, { label: "Quest\u00F5es \u00FAnicas", value: unique.total, hint: "pela mais recente" }), _jsx(StatCard, { label: "Aproveitamento \u00FAnico", value: formatPercent(unique.accuracyRate), tone: "accent" })] }), _jsxs("div", { className: "grid gap-4 lg:grid-cols-2", children: [_jsx(GroupSection, { title: "Por disciplina", groups: report.byDiscipline }), _jsx(GroupSection, { title: "Por assunto", groups: report.byTopic }), _jsx(GroupSection, { title: "Por banca", groups: report.byBoard }), _jsx(GroupSection, { title: "Por concurso", groups: report.byContest })] }), _jsxs(Card, { children: [_jsx(CardHeader, { title: "Evolu\u00E7\u00E3o di\u00E1ria", description: "Tentativas por dia (UTC)." }), _jsx("ul", { className: "divide-y divide-ink-700", children: report.daily.map((point) => (_jsxs("li", { className: "flex items-center justify-between gap-3 py-2 text-sm", children: [_jsx("span", { className: "text-mist-200", children: point.day }), _jsxs("span", { className: "text-ink-300", children: [point.total, " tentativas \u00B7 ", point.correct, " acertos \u00B7 ", point.incorrect, " erros", point.unanswered > 0 ? ` · ${point.unanswered} sem resposta` : '', " \u00B7", ' ', formatDurationMs(point.durationMs)] })] }, point.day))) })] })] }))] }));
}
