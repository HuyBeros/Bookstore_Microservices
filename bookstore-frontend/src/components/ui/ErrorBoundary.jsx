import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

/**
 * ErrorBoundary Component
 * Catches rendering errors and displays fallback UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-surface-muted dark:bg-surface rounded-card border-2 border-danger/20 dark:border-danger/20">
          <AlertTriangle className="w-12 h-12 text-danger mb-4" />
          <h2 className="text-heading-md font-semibold text-ink dark:text-ink mb-2">
            Đã xảy ra lỗi
          </h2>
          <p className="text-body-sm text-ink-muted dark:text-ink-muted mb-4 max-w-sm">
            Xin lỗi, có lỗi khi hiển thị trang này. Vui lòng thử lại.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="w-full mb-6 text-left">
              <summary className="cursor-pointer text-caption text-danger mb-2">
                Chi tiết lỗi (dev only)
              </summary>
              <pre className="bg-ink/5 dark:bg-ink/10 p-3 rounded text-caption overflow-auto text-danger">
                {this.state.error?.message}
              </pre>
            </details>
          )}
          <Button onClick={this.handleReset} variant="primary">
            Tải lại trang
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
