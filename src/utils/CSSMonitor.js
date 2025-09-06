// CSS and Font Loading Monitor
class CSSMonitor {
  constructor() {
    this.checkedCSS = new Set();
    this.checkedFonts = new Set();
    this.init();
  }

  init() {
    // Monitor CSS loading
    this.monitorCSSLoading();
    // Monitor font loading
    this.monitorFontLoading();
    // Set up periodic health checks
    this.setupHealthChecks();
  }

  monitorCSSLoading() {
    // Monitor all stylesheet links
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'LINK' && node.rel === 'stylesheet') {
            this.checkCSSLink(node);
          }
        });
      });
    });

    observer.observe(document.head, { childList: true, subtree: true });

    // Check existing CSS links
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      this.checkCSSLink(link);
    });
  }

  checkCSSLink(link) {
    if (this.checkedCSS.has(link.href)) return;
    this.checkedCSS.add(link.href);

    const timeout = setTimeout(() => {
      if (!link.sheet) {
        console.warn('CSS failed to load:', link.href);
        this.handleCSSFailure(link);
      }
    }, 5000);

    link.addEventListener('load', () => {
      clearTimeout(timeout);
      console.log('CSS loaded successfully:', link.href);
    });

    link.addEventListener('error', () => {
      clearTimeout(timeout);
      console.error('CSS load error:', link.href);
      this.handleCSSFailure(link);
    });
  }

  handleCSSFailure(failedLink) {
    // Try to reload the CSS with cache busting
    const newLink = document.createElement('link');
    newLink.rel = 'stylesheet';
    newLink.href = failedLink.href + (failedLink.href.includes('?') ? '&' : '?') + 'retry=' + Date.now();
    
    newLink.onload = () => {
      console.log('CSS recovered after retry:', newLink.href);
      // Remove the failed link
      if (failedLink.parentNode) {
        failedLink.parentNode.removeChild(failedLink);
      }
    };

    newLink.onerror = () => {
      // If retry fails, load from CDN for critical CSS
      if (failedLink.href.includes('bootstrap')) {
        this.loadBootstrapFromCDN();
      }
    };

    document.head.appendChild(newLink);
  }

  loadBootstrapFromCDN() {
    const bootstrapCDN = document.createElement('link');
    bootstrapCDN.rel = 'stylesheet';
    bootstrapCDN.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css';
    bootstrapCDN.crossOrigin = 'anonymous';
    bootstrapCDN.integrity = 'sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM';
    document.head.appendChild(bootstrapCDN);
    console.log('Bootstrap loaded from CDN as fallback');
  }

  monitorFontLoading() {
    if ('fonts' in document) {
      // Monitor font loading using Font Loading API
      document.fonts.addEventListener('loadingdone', (event) => {
        console.log('Fonts loaded:', event.fontfaces.length);
      });

      document.fonts.addEventListener('loadingerror', (event) => {
        console.warn('Font loading error:', event);
        this.handleFontFailure();
      });

      // Check if fonts are already loaded
      document.fonts.ready.then(() => {
        console.log('All fonts loaded');
      });
    }
  }

  handleFontFailure() {
    // Load FontAwesome from CDN as fallback
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const fontAwesome = document.createElement('link');
      fontAwesome.rel = 'stylesheet';
      fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
      fontAwesome.crossOrigin = 'anonymous';
      document.head.appendChild(fontAwesome);
      console.log('FontAwesome loaded from CDN as fallback');
    }
  }

  setupHealthChecks() {
    // Periodic health check every 30 seconds
    setInterval(() => {
      this.performHealthCheck();
    }, 30000);

    // Initial health check after 5 seconds
    setTimeout(() => {
      this.performHealthCheck();
    }, 5000);
  }

  performHealthCheck() {
    // Check if Bootstrap is working
    const testBootstrap = () => {
      const test = document.createElement('div');
      test.className = 'container-fluid';
      test.style.position = 'absolute';
      test.style.left = '-9999px';
      document.body.appendChild(test);

      const style = window.getComputedStyle(test);
      const isWorking = style.paddingLeft !== '0px' || style.paddingRight !== '0px';

      document.body.removeChild(test);
      return isWorking;
    };

    if (!testBootstrap()) {
      console.warn('Bootstrap health check failed');
      this.loadBootstrapFromCDN();
    }

    // Check if critical CSS classes exist
    this.checkCriticalClasses();
  }

  checkCriticalClasses() {
    const criticalClasses = [
      'btn', 'btn-primary', 'form-control', 'card', 'navbar', 'container'
    ];

    const missingClasses = criticalClasses.filter(className => {
      const test = document.createElement('div');
      test.className = className;
      test.style.position = 'absolute';
      test.style.left = '-9999px';
      document.body.appendChild(test);

      const style = window.getComputedStyle(test);
      const hasStyles = style.display !== 'block' || 
                       style.padding !== '0px' || 
                       style.margin !== '0px' ||
                       style.backgroundColor !== 'rgba(0, 0, 0, 0)';

      document.body.removeChild(test);
      return !hasStyles;
    });

    if (missingClasses.length > 0) {
      console.warn('Missing critical CSS classes:', missingClasses);
      // If critical classes are missing, force reload Bootstrap
      this.loadBootstrapFromCDN();
    }
  }
}

// Initialize CSS monitor
if (typeof window !== 'undefined') {
  window.cssMonitor = new CSSMonitor();
}

export default CSSMonitor;
