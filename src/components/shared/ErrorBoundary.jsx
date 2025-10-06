import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(_error, _info) {
    // You can wire this to an error reporting tool
    // console.error('ErrorBoundary caught', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Something went wrong.</h2>
          <p className="text-sm text-muted-foreground">
            Try reloading the page.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
