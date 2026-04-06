import { Component } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import config from '../../config/env.config'

/**
 * Error Boundary Components
 * Catches JavaScript errors anywhere in the child component tree
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Send error to logging service in production
    if (config.isProd) {
      this.logErrorToService(error, errorInfo)
    }
  }

  logErrorToService = (error, errorInfo) => {
    // Implement error logging service integration
    // This could be Sentry, LogRocket, or custom logging service
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        username: localStorage.getItem('username'),
        tenantId: localStorage.getItem('tenantId'),
        campusId: localStorage.getItem('campusId')
      }
      
      // TODO: Send to logging service
      console.log('Error logged:', errorData)
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError)
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props

      // Use custom fallback component if provided
      if (Fallback) {
        return (
          <Fallback 
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onRetry={this.handleRetry}
          />
        )
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-secondary-50 px-4">
          <div className="max-w-lg w-full">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-error-100 p-4 rounded-full">
                  <AlertTriangle className="h-12 w-12 text-error-600" />
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-secondary-900 mb-4">
                Something went wrong
              </h1>
              
              <p className="text-secondary-600 mb-8">
                We're sorry, but something unexpected happened. Our team has been notified and is working to fix the issue.
              </p>

              {/* Error details for development */}
              {import.meta.env.DEV && this.state.error && (
                <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-semibold text-error-800 mb-2">
                    Error Details (Development Mode)
                  </h3>
                  <p className="text-sm text-error-700 font-mono mb-2">
                    {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <details className="text-xs text-error-600">
                      <summary className="cursor-pointer hover:text-error-800">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 whitespace-pre-wrap break-all">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={this.handleRetry}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go to Dashboard
                </button>
              </div>

              {/* Contact support */}
              <div className="mt-8 pt-8 border-t border-secondary-200">
                <p className="text-sm text-secondary-500">
                  If this problem persists, please{' '}
                  <a 
                    href="mailto:support@yourschool.com"
                    className="text-primary-600 hover:text-primary-700 underline"
                  >
                    contact support
                  </a>
                  {' '}with the error details.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
