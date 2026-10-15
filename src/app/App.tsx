import { RouterProvider } from 'react-router'
import { router } from './router'
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'
import { ToastProvider } from '@/shared/toast/ToastProvider'
import { Toaster } from '@/shared/toast/Toaster'

export function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <RouterProvider router={router} />
        <Toaster />
      </ToastProvider>
    </ErrorBoundary>
  )
}
