import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useOfflineReading } from '@/hooks/useOfflineReading';
import { Download, Check, X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

interface DownloadBookButtonProps {
  book: {
    id: string;
    title: string;
    author: string;
    pdfUrl?: string | null;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function DownloadBookButton({ book, className = '', size = 'md' }: DownloadBookButtonProps) {
  const { 
    isOnline, 
    isBookCached, 
    cacheBook, 
    removeCachedBook, 
    downloadProgress, 
    isDownloading 
  } = useOfflineReading();

  const isCached = isBookCached(book.id);
  const isCurrentlyDownloading = isDownloading[book.id] || false;
  const progress = downloadProgress[book.id] || 0;

  const handleDownload = async () => {
    if (!book.pdfUrl) {
      console.error('No PDF URL available for book:', book.id);
      return;
    }

    if (isCached) {
      // Remove from offline storage
      await removeCachedBook(book.id, book.pdfUrl);
    } else {
      // Download for offline reading
      await cacheBook(book.id, book.pdfUrl, book);
    }
  };

  const buttonSizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base'
  };

  if (isCurrentlyDownloading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Button
          disabled
          className={`${buttonSizes[size]} bg-orange-500/20 text-orange-400 border border-orange-500/30`}
        >
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Downloading...
        </Button>
        <Progress value={progress} className="h-1" />
        <p className="text-xs text-gray-400 text-center">{Math.round(progress)}%</p>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      <Button
        onClick={handleDownload}
        disabled={!isOnline && !isCached}
        className={`${buttonSizes[size]} ${
          isCached
            ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30'
            : 'bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30'
        }`}
        title={
          isCached 
            ? 'Remove from offline storage' 
            : !isOnline 
              ? 'Requires internet connection' 
              : 'Download for offline reading'
        }
      >
        {isCached ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Downloaded</span>
            <span className="sm:hidden">✓</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Download</span>
            <span className="sm:hidden">↓</span>
          </>
        )}
      </Button>
    </motion.div>
  );
}