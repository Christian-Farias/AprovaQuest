import { createContext } from 'react'

export type ToastTone = 'info' | 'success' | 'error'

export interface ToastMessage {
  id: string
  tone: ToastTone
  title: string
  description?: string
}

export interface ToastContextValue {
  toasts: ToastMessage[]
  notify: (toast: Omit<ToastMessage, 'id'>) => void
  dismiss: (id: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
