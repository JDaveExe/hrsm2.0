import { useEffect, useCallback, useRef, useState } from 'react';

export const usePerformanceMonitor = (componentName) => {
  const renderStartTime = useRef(performance.now());
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    const renderTime = performance.now() - renderStartTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} render #${renderCount.current} took ${renderTime.toFixed(2)}ms`);
    }
    
    renderStartTime.current = performance.now();
  });

  const measureFunction = useCallback((funcName, func) => {
    return (...args) => {
      const start = performance.now();
      const result = func(...args);
      const end = performance.now();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName}.${funcName} took ${(end - start).toFixed(2)}ms`);
      }
      
      return result;
    };
  }, [componentName]);

  return { measureFunction };
};

export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const useThrottle = (callback, delay) => {
  const lastRun = useRef(Date.now());

  return useCallback((...args) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]);
};
