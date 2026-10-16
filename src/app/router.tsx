import { createBrowserRouter, isRouteErrorResponse, useRouteError } from 'react-router'
import { AppLayout } from './AppLayout'
import { routes } from './routes'
import { DashboardPage } from '@/modules/dashboard/ui/DashboardPage'
import { QuestionsPage } from '@/modules/questions/ui/QuestionsPage'
import { ImportPdfPage } from '@/modules/imports/ui/ImportPdfPage'
import { ErrorNotebookPage } from '@/modules/errors/ui/ErrorNotebookPage'
import { ReviewsPage } from '@/modules/reviews/ui/ReviewsPage'
import { SchedulePage } from '@/modules/schedule/ui/SchedulePage'
import { StatisticsPage } from '@/modules/statistics/ui/StatisticsPage'
import { BackupPage } from '@/modules/backup/ui/BackupPage'
import { Button } from '@/shared/ui/Button'

function RouteError() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Erro desconhecido'
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-lg font-semibold text-danger-400">Página não encontrada</h1>
      <p className="mt-2 text-sm text-ink-300">{message}</p>
      <div className="mt-4 flex justify-center">
        <Button onClick={() => window.location.assign(routes.dashboard)}>Voltar ao painel</Button>
      </div>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'questoes', element: <QuestionsPage /> },
      { path: 'importar', element: <ImportPdfPage /> },
      { path: 'erros', element: <ErrorNotebookPage /> },
      { path: 'revisoes', element: <ReviewsPage /> },
      { path: 'cronograma', element: <SchedulePage /> },
      { path: 'estatisticas', element: <StatisticsPage /> },
      { path: 'backup', element: <BackupPage /> },
    ],
  },
])

