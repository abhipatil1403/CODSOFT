import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          height: '100vh',
          width: '100vw',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0c10',
          color: '#f0f4f9',
          padding: '24px',
          fontFamily: 'Outfit, sans-serif'
        }}>
          <div className="glass-card" style={{
            maxWidth: '480px',
            padding: '32px',
            textAlign: 'center',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            background: 'rgba(239, 68, 68, 0.05)'
          }}>
            <h2 style={{ color: '#ef4444', marginBottom: '12px', fontSize: '20px', fontWeight: '700' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#8b9bb4', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              An unexpected error occurred in the workspace. This might be due to a connection drop or database change.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-primary"
              style={{ display: 'inline-flex', margin: '0 auto' }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
