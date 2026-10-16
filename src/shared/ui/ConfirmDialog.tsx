import { type ReactNode, createContext, useCallback, useContext, useRef, useState } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'

interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [opts, setOpts] = useState<ConfirmOptions>({ title: '' })
  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  const confirm: ConfirmFn = useCallback(
    (options) =>
      new Promise<boolean>((resolve) => {
        setOpts(options)
        setOpen(true)
        resolveRef.current = resolve
      }),
    [],
  )

  function handleResolve(value: boolean) {
    setOpen(false)
    resolveRef.current?.(value)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={open}
        onClose={() => handleResolve(false)}
        title={opts.title}
        description={opts.description}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => handleResolve(false)}>
              {opts.cancelLabel ?? 'Cancelar'}
            </Button>
            <Button
              variant={opts.danger ? 'danger' : 'primary'}
              onClick={() => handleResolve(true)}
            >
              {opts.confirmLabel ?? 'Confirmar'}
            </Button>
          </>
        }
      >
        <div />
      </Modal>
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}
