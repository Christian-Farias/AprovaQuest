import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useOverallStats } from '@/modules/statistics/application/statistics.hooks';
import { formatDurationMs, formatPercent } from '@/shared/lib/format';
import { PageHeader } from '@/shared/ui/PageHeader';
import { StatCard } from '@/shared/ui/StatCard';
import { LoadingState, SkeletonList } from '@/shared/ui/LoadingState';
import { EmptyState } from '@/shared/ui/EmptyState';
export function DashboardPage() {
    const stats = useOverallStats();
    if (stats === undefined) {
        return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Painel", description: "Vis\u00E3o geral dos seus estudos." }), _jsx(LoadingState, {}), _jsx(SkeletonList, { rows: 2 })] }));
    }
    const hasData = stats.questionCount > 0 || stats.accuracy.total > 0;
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Painel", description: "Indicadores calculados em tempo real a partir das suas tentativas registradas." }), !hasData ? (_jsx(EmptyState, { title: "Ainda sem dados para exibir", description: "Cadastre ou importe quest\u00F5es e comece a responder. Os indicadores aparecer\u00E3o aqui automaticamente \u2014 nada \u00E9 preenchido com dados fict\u00EDcios." })) : (_jsxs("div", { className: "grid grid-cols-2 gap-3 lg:grid-cols-4", children: [_jsx(StatCard, { label: "Quest\u00F5es", value: stats.questionCount, hint: `${stats.activeQuestionCount} ativas` }), _jsx(StatCard, { label: "Tentativas", value: stats.accuracy.total, tone: "brand" }), _jsx(StatCard, { label: "Aproveitamento", value: formatPercent(stats.accuracy.accuracyRate), hint: "entre tentativas respondidas", tone: "accent" }), _jsx(StatCard, { label: "Tempo de estudo", value: formatDurationMs(stats.studyTimeMs) }), _jsx(StatCard, { label: "Acertos", value: stats.accuracy.correct, tone: "ok", hint: `${stats.accuracy.incorrect} erros` }), _jsx(StatCard, { label: "Sem resposta", value: stats.accuracy.unanswered, tone: "neutral", hint: "n\u00E3o entram na taxa" }), _jsx(StatCard, { label: "Quest\u00F5es \u00FAnicas", value: stats.unique.total, hint: "pela tentativa mais recente" }), _jsx(StatCard, { label: "Aproveitamento \u00FAnico", value: formatPercent(stats.unique.accuracyRate), hint: "por quest\u00E3o", tone: "accent" })] }))] }));
}
