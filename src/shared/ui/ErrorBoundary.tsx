import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/shared/ui/Button'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Erro de interface capturado:', error, info)
  }

  private reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="text-lg font-semibold text-danger-400">Ocorreu um erro inesperado</h1>
          <p className="mt-2 text-sm text-ink-300">
            Seus dados continuam salvos localmente. Recarregue a página para tentar novamente.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-ink-900 p-3 text-left text-xs text-ink-400">
            {this.state.error.message}
          </pre>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="secondary" onClick={this.reset}>
              Tentar novamente
            </Button>
            <Button onClick={() => window.location.reload()}>Recarregar</Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
