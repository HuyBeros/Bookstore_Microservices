import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

/**
 * ErrorBoundary: bắt lỗi render
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
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <AlertTriangle size={48} className="text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Có lỗi xảy ra</h1>
          <p className="text-gray-600 text-center mb-6 max-w-sm">
            Ứng dụng gặp sự cố không mong muốn. Vui lòng tải lại trang để tiếp tục.
          </p>
          <Button variant="primary" onClick={this.handleReset}>
            Tải lại trang
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
