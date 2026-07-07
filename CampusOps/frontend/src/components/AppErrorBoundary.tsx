import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

type AppErrorBoundaryProps = {
  children: ReactNode
}

type AppErrorBoundaryState = {
  hasError: boolean
  message: string
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    message: '',
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error.message,
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('CampusOps UI error', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <main className="app-error">
        <section>
          <AlertTriangle size={28} />
          <div>
            <span>Recoverable UI error</span>
            <h1>CampusOps AI needs a refresh</h1>
            <p>{this.state.message || 'An unexpected interface error occurred.'}</p>
          </div>
          <button type="button" className="primary-action" onClick={() => window.location.reload()}>
            <RotateCcw size={16} />
            <span>Reload app</span>
          </button>
        </section>
      </main>
    )
  }
}
