import React, { useState } from 'react';

interface BookCoverImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fallbackIcon?: React.ReactNode;
}

const BookCoverImage: React.FC<BookCoverImageProps> = ({
  src,
  alt,
  className = '',
  width = 200,
  height = 280,
  fallbackIcon
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(!!src);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Use fallback immediately if no src provided
  const shouldShowFallback = !src || hasError;
  const placeholderUrl = `/api/placeholder/${width}/${height}`;

  if (shouldShowFallback) {
    return (
      <div className={`relative ${className}`}>
        <img
          src={placeholderUrl}
          alt={alt}
          className="w-full h-full object-cover"
          style={{ width: `${width}px`, height: `${height}px` }}
        />
        {fallbackIcon && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
            {fallbackIcon}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-orange-100 to-amber-100 animate-pulse flex items-center justify-center"
          style={{ width: `${width}px`, height: `${height}px` }}
        >
          <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        style={{ width: `${width}px`, height: `${height}px` }}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
      />
    </div>
  );
};

export default BookCoverImage;