import React, { useState, useRef, useEffect, memo } from 'react';

const OptimizedImage = memo(({ 
  src, 
  alt, 
  className = '', 
  style = {}, 
  placeholder = '/images/placeholder.jpg',
  loading = 'lazy',
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <div 
      ref={imgRef}
      className={`optimized-image-container ${className}`}
      style={{ 
        position: 'relative',
        backgroundColor: '#f8f9fa',
        ...style 
      }}
      {...props}
    >
      {!isLoaded && !hasError && (
        <div 
          className="image-placeholder"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#e9ecef',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6c757d'
          }}
        >
          <div className="spinner-border spinner-border-sm" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      
      {isInView && (
        <img
          src={hasError ? placeholder : src}
          alt={alt}
          loading={loading}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out'
          }}
        />
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
