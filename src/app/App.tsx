import { RouterProvider } from 'react-router'
import { router } from './router'
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'
import { ToastProvider } from '@/shared/toast/ToastProvider'
import { Toaster } from '@/shared/toast/Toaster'
import { ConfirmProvider } from '@/shared/ui/ConfirmDialog'

export function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ConfirmProvider>
          <RouterProvider router={router} />
          <Toaster />
        </ConfirmProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}
