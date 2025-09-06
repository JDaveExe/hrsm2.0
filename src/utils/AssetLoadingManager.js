// Asset Loading Recovery Utility
class AssetLoadingManager {
  constructor() {
    this.retryCount = 0;
    this.maxRetries = 3;
    this.init();
  }

  init() {
    // Detect CSS loading failures
    this.detectCSSFailures();
    // Detect JS chunk loading failures
    this.detectJSFailures();
    // Monitor for missing icons/fonts
    this.detectFontFailures();
  }

  detectCSSFailures() {
    // Check if Bootstrap CSS is loaded
    const testBootstrap = () => {
      const testElement = document.createElement('div');
      testElement.className = 'container d-none';
      document.body.appendChild(testElement);
      
      const computedStyle = window.getComputedStyle(testElement);
      const isBootstrapLoaded = computedStyle.maxWidth !== 'none' || computedStyle.display === 'none';
      
      document.body.removeChild(testElement);
      return isBootstrapLoaded;
    };

    // Check after a short delay to allow CSS to load
    setTimeout(() => {
      if (!testBootstrap()) {
        console.warn('Bootstrap CSS failed to load, attempting recovery...');
        this.recoverCSS();
      }
    }, 1000);
  }

  detectJSFailures() {
    // Listen for chunk loading failures
    window.addEventListener('error', (event) => {
      if (event.filename && (event.filename.includes('.js') || event.filename.includes('.css'))) {
        console.warn('Asset loading failed:', event.filename);
        this.handleAssetFailure(event.filename);
      }
    });

    // Listen for unhandled promise rejections (chunk loading failures)
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.message && event.reason.message.includes('Loading chunk')) {
        console.warn('Chunk loading failed:', event.reason.message);
        this.handleChunkFailure();
      }
    });
  }

  detectFontFailures() {
    // Check if FontAwesome or other icon fonts are loaded
    setTimeout(() => {
      const testIcon = document.createElement('i');
      testIcon.className = 'fas fa-test';
      testIcon.style.position = 'absolute';
      testIcon.style.left = '-9999px';
      document.body.appendChild(testIcon);

      const computedStyle = window.getComputedStyle(testIcon, '::before');
      const isFontAwesome = computedStyle.fontFamily.includes('Font Awesome');

      document.body.removeChild(testIcon);

      if (!isFontAwesome) {
        console.warn('Icon fonts may not be loaded properly');
        this.recoverFonts();
      }
    }, 2000);
  }

  recoverCSS() {
    if (this.retryCount >= this.maxRetries) {
      this.showRecoveryModal();
      return;
    }

    this.retryCount++;
    
    // Force reload Bootstrap CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css';
    link.onload = () => {
      console.log('Bootstrap CSS recovered from CDN');
    };
    link.onerror = () => {
      console.error('Failed to recover Bootstrap CSS from CDN');
    };
    document.head.appendChild(link);
  }

  recoverFonts() {
    // Load FontAwesome from CDN as fallback
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    link.onload = () => {
      console.log('FontAwesome recovered from CDN');
    };
    document.head.appendChild(link);
  }

  handleAssetFailure(filename) {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      // Force a cache refresh
      this.clearCacheAndReload();
    } else {
      this.showRecoveryModal();
    }
  }

  handleChunkFailure() {
    console.warn('JavaScript chunk loading failed, attempting recovery...');
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      this.showRecoveryModal();
    }
  }

  async clearCacheAndReload() {
    try {
      // Clear service worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Unregister service worker
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));
      }
      
      // Hard reload
      window.location.reload(true);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      window.location.reload();
    }
  }

  showRecoveryModal() {
    // Create a simple recovery modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: Arial, sans-serif;
    `;

    modal.innerHTML = `
      <div style="
        background: white;
        padding: 30px;
        border-radius: 10px;
        text-align: center;
        max-width: 400px;
        margin: 20px;
      ">
        <h3 style="color: #dc3545; margin-bottom: 20px;">⚠️ Asset Loading Issue</h3>
        <p>Some stylesheets or scripts failed to load properly. This can happen due to caching issues.</p>
        <button onclick="window.assetManager.forceRefresh()" style="
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          margin: 10px;
        ">🔄 Force Refresh</button>
        <button onclick="window.assetManager.clearAllData()" style="
          background: #dc3545;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          margin: 10px;
        ">🗑️ Clear All & Restart</button>
      </div>
    `;

    document.body.appendChild(modal);
  }

  forceRefresh() {
    window.location.href = window.location.href + '?cache=' + Date.now();
  }

  async clearAllData() {
    try {
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      // Unregister service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));
      }

      // Force hard reload
      window.location.href = window.location.origin;
    } catch (error) {
      console.error('Failed to clear data:', error);
      window.location.reload(true);
    }
  }
}

// Initialize asset manager
window.assetManager = new AssetLoadingManager();

export default AssetLoadingManager;
