import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface CachedBook {
  id: string;
  title: string;
  author: string;
  cachedAt: string;
  size?: number;
}

interface OfflineReadingHook {
  isOnline: boolean;
  cachedBooks: CachedBook[];
  isBookCached: (bookId: string) => boolean;
  cacheBook: (bookId: string, bookUrl: string, bookData: any) => Promise<void>;
  removeCachedBook: (bookId: string, bookUrl: string) => Promise<void>;
  getCachedBookData: (bookId: string) => any | null;
  downloadProgress: { [bookId: string]: number };
  isDownloading: { [bookId: string]: boolean };
}

export function useOfflineReading(): OfflineReadingHook {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedBooks, setCachedBooks] = useState<CachedBook[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<{ [bookId: string]: number }>({});
  const [isDownloading, setIsDownloading] = useState<{ [bookId: string]: boolean }>({});
  const { toast } = useToast();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connection Restored",
        description: "You're back online! You can now download new books.",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "You're Offline",
        description: "Don't worry - you can still read your downloaded books!",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Load cached books from localStorage on mount
  useEffect(() => {
    const loadCachedBooks = () => {
      try {
        const cached = localStorage.getItem('wonderfulbooks_cached');
        if (cached) {
          setCachedBooks(JSON.parse(cached));
        }
      } catch (error) {
        console.error('Failed to load cached books:', error);
      }
    };

    loadCachedBooks();
  }, []);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully');
          
          // Listen for messages from service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'BOOK_CACHED') {
              const { bookId, success, error } = event.data;
              
              setIsDownloading(prev => ({ ...prev, [bookId]: false }));
              setDownloadProgress(prev => ({ ...prev, [bookId]: 0 }));
              
              if (success) {
                toast({
                  title: "Book Downloaded",
                  description: "Book is now available for offline reading!",
                });
              } else {
                toast({
                  title: "Download Failed",
                  description: error || "Failed to download book for offline reading.",
                  variant: "destructive",
                });
              }
            }
          });
        })
        .catch((error) => {
          console.log('Service Worker registration failed (normal in development):', error);
        });
    } else {
      console.log('Service Workers require HTTPS or localhost (normal in development)');
    }
  }, [toast]);

  const isBookCached = useCallback((bookId: string): boolean => {
    return cachedBooks.some(book => book.id === bookId);
  }, [cachedBooks]);

  const cacheBook = useCallback(async (bookId: string, bookUrl: string, bookData: any): Promise<void> => {
    if (!isOnline) {
      toast({
        title: "Offline",
        description: "You need an internet connection to download books.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsDownloading(prev => ({ ...prev, [bookId]: true }));
      setDownloadProgress(prev => ({ ...prev, [bookId]: 0 }));

      // Store book metadata in localStorage
      const cachedBook: CachedBook = {
        id: bookId,
        title: bookData.title,
        author: bookData.author,
        cachedAt: new Date().toISOString(),
      };

      // Add to cached books list
      const updatedCachedBooks = [...cachedBooks.filter(book => book.id !== bookId), cachedBook];
      setCachedBooks(updatedCachedBooks);
      
      // Store in localStorage
      localStorage.setItem('wonderfulbooks_cached', JSON.stringify(updatedCachedBooks));
      localStorage.setItem(`wonderfulbooks_book_${bookId}`, JSON.stringify(bookData));

      // Simulate download progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          progress = 100;
          clearInterval(progressInterval);
        }
        setDownloadProgress(prev => ({ ...prev, [bookId]: progress }));
      }, 200);

      // Send message to service worker to cache the book
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_BOOK',
          bookUrl,
          bookId
        });
      }

      toast({
        title: "Downloading Book",
        description: "Preparing book for offline reading...",
      });

    } catch (error) {
      console.error('Failed to cache book:', error);
      setIsDownloading(prev => ({ ...prev, [bookId]: false }));
      setDownloadProgress(prev => ({ ...prev, [bookId]: 0 }));
      
      toast({
        title: "Download Failed",
        description: "Failed to prepare book for offline reading.",
        variant: "destructive",
      });
    }
  }, [isOnline, cachedBooks, toast]);

  const removeCachedBook = useCallback(async (bookId: string, bookUrl: string): Promise<void> => {
    try {
      // Remove from cached books list
      const updatedCachedBooks = cachedBooks.filter(book => book.id !== bookId);
      setCachedBooks(updatedCachedBooks);
      
      // Remove from localStorage
      localStorage.setItem('wonderfulbooks_cached', JSON.stringify(updatedCachedBooks));
      localStorage.removeItem(`wonderfulbooks_book_${bookId}`);

      // Send message to service worker to remove cached book
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'REMOVE_CACHED_BOOK',
          bookUrl
        });
      }

      toast({
        title: "Book Removed",
        description: "Book removed from offline storage.",
      });

    } catch (error) {
      console.error('Failed to remove cached book:', error);
      toast({
        title: "Removal Failed",
        description: "Failed to remove book from offline storage.",
        variant: "destructive",
      });
    }
  }, [cachedBooks, toast]);

  const getCachedBookData = useCallback((bookId: string): any | null => {
    try {
      const bookData = localStorage.getItem(`wonderfulbooks_book_${bookId}`);
      return bookData ? JSON.parse(bookData) : null;
    } catch (error) {
      console.error('Failed to get cached book data:', error);
      return null;
    }
  }, []);

  return {
    isOnline,
    cachedBooks,
    isBookCached,
    cacheBook,
    removeCachedBook,
    getCachedBookData,
    downloadProgress,
    isDownloading,
  };
}