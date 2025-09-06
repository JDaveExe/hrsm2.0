import { useEffect, useRef, useState, useCallback } from 'react';

// Performance monitoring hook
export const usePerformanceMonitor = (componentName = 'Component') => {
  const renderCount = useRef(0);
  const renderTimes = useRef([]);
  const lastRenderTime = useRef(performance.now());
  const [performanceStats, setPerformanceStats] = useState({
    renderCount: 0,
    averageRenderTime: 0,
    slowRenders: 0,
    memoryUsage: 0
  });

  useEffect(() => {
    const now = performance.now();
    const renderTime = now - lastRenderTime.current;
    
    renderCount.current++;
    renderTimes.current.push(renderTime);
    
    // Keep only last 100 render times to prevent memory leak
    if (renderTimes.current.length > 100) {
      renderTimes.current.shift();
    }
    
    const averageRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;
    const slowRenders = renderTimes.current.filter(time => time > 16).length; // 16ms = 60fps threshold
    
    setPerformanceStats({
      renderCount: renderCount.current,
      averageRenderTime: Math.round(averageRenderTime * 100) / 100,
      slowRenders,
      memoryUsage: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : 0
    });
    
    lastRenderTime.current = now;
    
    if (process.env.NODE_ENV === 'development' && renderTime > 16) {
      console.warn(`${componentName} slow render: ${renderTime.toFixed(2)}ms`);
    }
  });

  return performanceStats;
};

// FPS monitoring hook
export const useFPSMonitor = () => {
  const [fps, setFps] = useState(60);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const requestRef = useRef();

  const updateFPS = useCallback(() => {
    const now = performance.now();
    frameCount.current++;
    
    if (now - lastTime.current >= 1000) {
      setFps(frameCount.current);
      frameCount.current = 0;
      lastTime.current = now;
    }
    
    requestRef.current = requestAnimationFrame(updateFPS);
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updateFPS);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [updateFPS]);

  return fps;
};

// Memory usage monitoring
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = useState({
    used: 0,
    total: 0,
    percentage: 0
  });

  useEffect(() => {
    const updateMemoryInfo = () => {
      if (performance.memory) {
        const used = Math.round(performance.memory.usedJSHeapSize / 1048576);
        const total = Math.round(performance.memory.totalJSHeapSize / 1048576);
        const percentage = Math.round((used / total) * 100);
        
        setMemoryInfo({ used, total, percentage });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
};

// Intersection observer for lazy loading
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    const current = targetRef.current;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, [options]);

  return [targetRef, isIntersecting];
};

// Performance-optimized state updates
export const useOptimizedState = (initialState) => {
  const [state, setState] = useState(initialState);
  const isUpdating = useRef(false);

  const optimizedSetState = useCallback((newState) => {
    if (isUpdating.current) return;
    
    isUpdating.current = true;
    
    // Use requestAnimationFrame to batch updates
    requestAnimationFrame(() => {
      setState(newState);
      isUpdating.current = false;
    });
  }, []);

  return [state, optimizedSetState];
};

// Throttled event handler
export const useThrottledCallback = (callback, delay = 100) => {
  const lastRun = useRef(Date.now());

  return useCallback((...args) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]);
};

// Performance indicator component
export const PerformanceIndicator = ({ show = false }) => {
  const performanceStats = usePerformanceMonitor('InventorySystem');
  const fps = useFPSMonitor();
  const memoryInfo = useMemoryMonitor();

  if (!show || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const getPerformanceColor = () => {
    if (fps < 30 || performanceStats.slowRenders > 5) return '#dc3545'; // Red
    if (fps < 50 || performanceStats.slowRenders > 2) return '#ffc107'; // Yellow
    return '#28a745'; // Green
  };

  return (
    <div 
      className="performance-indicator show"
      style={{ 
        backgroundColor: getPerformanceColor(),
        opacity: 0.9
      }}
      title={`Renders: ${performanceStats.renderCount} | Avg: ${performanceStats.averageRenderTime}ms | Slow: ${performanceStats.slowRenders} | RAM: ${memoryInfo.used}MB (${memoryInfo.percentage}%)`}
    >
      FPS: {fps}
    </div>
  );
};

export default {
  usePerformanceMonitor,
  useFPSMonitor,
  useMemoryMonitor,
  useIntersectionObserver,
  useOptimizedState,
  useThrottledCallback,
  PerformanceIndicator
};
