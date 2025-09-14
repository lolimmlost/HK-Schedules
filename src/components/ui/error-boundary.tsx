import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ScheduleTable ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border rounded-md bg-destructive/10 border-destructive/30">
          <h2 className="text-destructive font-semibold">Something went wrong rendering schedules</h2>
          <details className="mt-2 text-sm text-destructive-foreground">
            <summary>Click to see error details</summary>
            <pre className="mt-2 p-2 bg-destructive/5 rounded">{this.state.error?.message}</pre>
          </details>
          <p className="text-sm text-muted-foreground mt-2">
            Please refresh the page or check the console for more details.
          </p>
        </div>
      )
    }

    return this.props.children
  }
}

export { ErrorBoundary }