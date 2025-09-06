import React from 'react';

class AssetErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      isAssetError: false
    };
  }

  static getDerivedStateFromError(error) {
    // Check if error is related to asset loading
    const isAssetError = error.message && (
      error.message.includes('Loading chunk') ||
      error.message.includes('Loading CSS') ||
      error.message.includes('ChunkLoadError') ||
      error.message.includes('Failed to fetch') ||
      error.stack?.includes('chunk')
    );

    return { 
      hasError: true,
      isAssetError
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log asset-related errors
    if (this.state.isAssetError) {
      console.error('Asset loading error caught by boundary:', error);
      console.error('Error info:', errorInfo);
      
      // Attempt automatic recovery for asset errors
      this.attemptAssetRecovery();
    }
  }

  attemptAssetRecovery = async () => {
    try {
      console.log('Attempting asset recovery...');
      
      // Clear service worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('Cleared service worker caches');
      }

      // Wait a moment, then reload
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (recoveryError) {
      console.error('Asset recovery failed:', recoveryError);
    }
  };

  handleManualRecovery = () => {
    // Force hard reload with cache bust
    window.location.href = window.location.origin + window.location.pathname + '?recovery=' + Date.now();
  };

  handleClearAllData = async () => {
    try {
      // Clear all browser storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      // Unregister service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));
      }

      // Redirect to login
      window.location.href = window.location.origin + '/auth';
      
    } catch (error) {
      console.error('Failed to clear data:', error);
      window.location.reload(true);
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.state.isAssetError) {
        // Special UI for asset loading errors
        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#f8f9fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Arial, sans-serif',
            zIndex: 10000
          }}>
            <div style={{
              textAlign: 'center',
              padding: '40px',
              backgroundColor: 'white',
              borderRadius: '10px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              maxWidth: '600px',
              margin: '20px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
              <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>
                Resource Loading Error
              </h2>
              <p style={{ marginBottom: '20px', lineHeight: '1.6', color: '#6c757d' }}>
                Some application resources failed to load properly. This usually happens due to:
              </p>
              <ul style={{ 
                textAlign: 'left', 
                marginBottom: '30px', 
                color: '#6c757d',
                lineHeight: '1.6'
              }}>
                <li>Browser cache issues</li>
                <li>Network connectivity problems</li>
                <li>Server-side asset changes</li>
              </ul>
              
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  backgroundColor: '#e9ecef',
                  padding: '15px',
                  borderRadius: '5px',
                  marginBottom: '20px',
                  fontSize: '14px',
                  color: '#495057'
                }}>
                  🔄 Automatic recovery in progress...
                </div>
              </div>

              <div>
                <button 
                  onClick={this.handleManualRecovery}
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    margin: '5px',
                    fontSize: '16px'
                  }}
                >
                  🔄 Manual Reload
                </button>
                <button 
                  onClick={this.handleClearAllData}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    margin: '5px',
                    fontSize: '16px'
                  }}
                >
                  🗑️ Reset Application
                </button>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <details style={{ marginTop: '20px', textAlign: 'left' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                    Debug Information
                  </summary>
                  <pre style={{
                    backgroundColor: '#f8f9fa',
                    padding: '15px',
                    borderRadius: '5px',
                    fontSize: '12px',
                    overflow: 'auto',
                    maxHeight: '200px',
                    marginTop: '10px'
                  }}>
                    {this.state.error && this.state.error.toString()}
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        );
      }

      // General error fallback
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#f8f9fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Arial, sans-serif'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: 'white',
            borderRadius: '10px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ color: '#dc3545' }}>Something went wrong</h2>
            <p style={{ marginBottom: '20px' }}>
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
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

export default AssetErrorBoundary;
