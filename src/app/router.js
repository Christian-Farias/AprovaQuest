import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createBrowserRouter, isRouteErrorResponse, useRouteError } from 'react-router';
import { AppLayout } from './AppLayout';
import { routes } from './routes';
import { DashboardPage } from '@/modules/dashboard/ui/DashboardPage';
import { QuestionsPage } from '@/modules/questions/ui/QuestionsPage';
import { ImportPdfPage } from '@/modules/imports/ui/ImportPdfPage';
import { ErrorNotebookPage } from '@/modules/errors/ui/ErrorNotebookPage';
import { SchedulePage } from '@/modules/schedule/ui/SchedulePage';
import { StatisticsPage } from '@/modules/statistics/ui/StatisticsPage';
import { BackupPage } from '@/modules/backup/ui/BackupPage';
import { Button } from '@/shared/ui/Button';
function RouteError() {
    const error = useRouteError();
    const message = isRouteErrorResponse(error)
        ? `${error.status} ${error.statusText}`
        : error instanceof Error
            ? error.message
            : 'Erro desconhecido';
    return (_jsxs("div", { className: "mx-auto max-w-lg px-4 py-16 text-center", children: [_jsx("h1", { className: "text-lg font-semibold text-danger-400", children: "P\u00E1gina n\u00E3o encontrada" }), _jsx("p", { className: "mt-2 text-sm text-ink-300", children: message }), _jsx("div", { className: "mt-4 flex justify-center", children: _jsx(Button, { onClick: () => window.location.assign(routes.dashboard), children: "Voltar ao painel" }) })] }));
}
export const router = createBrowserRouter([
    {
        path: '/',
        element: _jsx(AppLayout, {}),
        errorElement: _jsx(RouteError, {}),
        children: [
            { index: true, element: _jsx(DashboardPage, {}) },
            { path: 'questoes', element: _jsx(QuestionsPage, {}) },
            { path: 'importar', element: _jsx(ImportPdfPage, {}) },
            { path: 'erros', element: _jsx(ErrorNotebookPage, {}) },
            { path: 'cronograma', element: _jsx(SchedulePage, {}) },
            { path: 'estatisticas', element: _jsx(StatisticsPage, {}) },
            { path: 'backup', element: _jsx(BackupPage, {}) },
        ],
    },
]);
