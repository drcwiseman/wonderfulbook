import { useEffect, useState, useCallback, useRef } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import FlipPagePDFViewer from '@/components/FlipPagePDFViewer';
import FlipPageToolbar from '@/components/FlipPageToolbar';
import BookmarkSidebar from '@/components/BookmarkSidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Book, Bookmark, ReadingProgress } from '@shared/schema';

export default function ReaderPage() {
  const [, paramsReader] = useRoute('/reader/:bookId');
  const [, paramsRead] = useRoute('/read/:bookId');
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [showToolbars, setShowToolbars] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isScrollMode, setIsScrollMode] = useState(false);
  
  // Touch/gesture handling
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [lastTap, setLastTap] = useState<number>(0);
  const hideToolbarTimeoutRef = useRef<NodeJS.Timeout>();

  const bookId = paramsReader?.bookId || paramsRead?.bookId;

  // Fetch book details
  const { data: book, isLoading: bookLoading } = useQuery<Book>({
    queryKey: [`/api/books/${bookId}`],
    enabled: !!bookId,
  });

  // Fetch reading progress
  const { data: progress } = useQuery<ReadingProgress>({
    queryKey: [`/api/reading-progress/${bookId}`],
    enabled: !!bookId && !!isAuthenticated,
  });

  // Fetch bookmarks to check if current page is bookmarked
  const { data: bookmarks = [] } = useQuery<Bookmark[]>({
    queryKey: [`/api/bookmarks/${bookId}`],
    enabled: !!bookId && !!isAuthenticated,
  });

  const isCurrentPageBookmarked = bookmarks.some(b => b.page === currentPage);

  // Update reading progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async (data: { currentPage: number; totalPages: number }) => {
      return await apiRequest('POST', '/api/reading-progress', {
        bookId,
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        progressPercentage: Math.round((data.currentPage / data.totalPages) * 100),
      });
    },
    onError: () => {
      console.error('Failed to update reading progress');
    },
  });

  // Bookmark toggle mutation
  const toggleBookmarkMutation = useMutation({
    mutationFn: async () => {
      const existingBookmark = bookmarks.find(b => b.page === currentPage);
      if (existingBookmark) {
        return await apiRequest('DELETE', `/api/bookmarks/${existingBookmark.id}`, {});
      } else {
        return await apiRequest('POST', '/api/bookmarks', {
          bookId,
          page: currentPage,
          note: null,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bookmarks/${bookId}`] });
      toast({
        title: isCurrentPageBookmarked ? "Bookmark Removed" : "Bookmark Added",
        description: isCurrentPageBookmarked 
          ? "Page bookmark removed" 
          : `Page ${currentPage} bookmarked`,
      });
    },
  });

  // Load PDF with proper blob handling
  useEffect(() => {
    let isCancelled = false;

    const loadPdf = async () => {
      if (!bookId || !isAuthenticated || authLoading || pdfUrl) {
        return;
      }

      setIsLoadingPdf(true);
      try {
        const response = await fetch(`/api/stream/${bookId}`, {
          credentials: 'include',
        });

        if (isCancelled) return;

        if (!response.ok) {
          if (response.status === 401) {
            toast({
              title: "Session Expired",
              description: "Please log in again to continue reading.",
              variant: "destructive",
            });
            setTimeout(() => window.location.href = "/api/login", 1000);
            return;
          }
          if (response.status === 403) {
            const errorData = await response.json();
            setAccessError(errorData.message || 'Access denied. Please upgrade your subscription.');
            return;
          }
          throw new Error(`Failed to load PDF: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        if (isCancelled) return;

        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        setAccessError(null);
      } catch (error) {
        if (isCancelled) return;
        console.error('Error loading PDF:', error);
        setAccessError('Failed to load the book. Please try again.');
      } finally {
        if (!isCancelled) {
          setIsLoadingPdf(false);
        }
      }
    };

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [bookId, isAuthenticated, authLoading, toast, pdfUrl]);

  // Resume reading position
  useEffect(() => {
    if (progress?.currentPage && progress.currentPage > 1) {
      setCurrentPage(progress.currentPage);
    }
  }, [progress]);

  // Auto-hide toolbars
  const resetHideTimer = useCallback(() => {
    if (hideToolbarTimeoutRef.current) {
      clearTimeout(hideToolbarTimeoutRef.current);
    }
    hideToolbarTimeoutRef.current = setTimeout(() => {
      setShowToolbars(false);
    }, 3000);
  }, []);

  const showToolbarsTemporarily = useCallback(() => {
    setShowToolbars(true);
    resetHideTimer();
  }, [resetHideTimer]);

  // Handle page changes
  const handlePageChange = useCallback((page: number, total: number) => {
    setCurrentPage(page);
    if (total > 0) {
      updateProgressMutation.mutate({ currentPage: page, totalPages: total });
    }
    showToolbarsTemporarily();
  }, [updateProgressMutation, showToolbarsTemporarily]);

  const handleDocumentLoad = useCallback((total: number) => {
    setTotalPages(total);
  }, []);

  // Navigation functions
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      updateProgressMutation.mutate({ currentPage: page, totalPages });
      showToolbarsTemporarily();
    }
  }, [totalPages, updateProgressMutation, showToolbarsTemporarily]);

  // Touch and gesture handling
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      });
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStart) return;

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    };

    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;
    const now = Date.now();

    // Handle double tap to toggle toolbars
    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      if (now - lastTap < 300) {
        setShowToolbars(prev => !prev);
        if (showToolbars) {
          resetHideTimer();
        }
      }
      setLastTap(now);
    }

    // Handle swipe gestures for page flipping
    if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 100) {
      if (deltaX > 0 && currentPage < totalPages) {
        // Swipe left - next page
        goToPage(currentPage + 1);
      } else if (deltaX < 0 && currentPage > 1) {
        // Swipe right - previous page
        goToPage(currentPage - 1);
      }
    }

    setTouchStart(null);
  }, [touchStart, lastTap, showToolbars, currentPage, totalPages, goToPage, resetHideTimer]);

  // Security: Disable right-click, F12, and other shortcuts
  useEffect(() => {
    const disableRightClick = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const disableKeyShortcuts = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 's') ||
        (e.ctrlKey && e.key === 'p') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.key === 'a')
      ) {
        e.preventDefault();
        return false;
      }
    };

    const disableSelection = () => {
      document.onselectstart = () => false;
      document.ondragstart = () => false;
    };

    document.addEventListener('contextmenu', disableRightClick);
    document.addEventListener('keydown', disableKeyShortcuts);
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    disableSelection();

    return () => {
      document.removeEventListener('contextmenu', disableRightClick);
      document.removeEventListener('keydown', disableKeyShortcuts);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      document.onselectstart = null;
      document.ondragstart = null;
    };
  }, [handleTouchStart, handleTouchEnd]);

  // Cleanup PDF URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => window.location.href = "/api/login", 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  // Loading state
  if (authLoading || bookLoading || isLoadingPdf) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-gray-900 dark:text-white">Loading your book...</p>
          {book && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {book.title} by {book.author}
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  // Error states
  if (!book) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Book Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">The book you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation('/')} className="bg-blue-600 text-white hover:bg-blue-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Button>
        </motion.div>
      </div>
    );
  }

  if (accessError) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md px-6"
        >
          <Lock className="w-16 h-16 mx-auto mb-6 text-yellow-500" />
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Access Required</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{accessError}</p>
          <div className="space-y-4">
            <Button onClick={() => setLocation('/subscribe')} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
              Upgrade Subscription
            </Button>
            <Button variant="outline" onClick={() => setLocation('/')} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Library
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-gray-900 dark:text-white">Preparing your book...</p>
        </motion.div>
      </div>
    );
  }

  // Main reader interface
  return (
    <div 
      className={`h-screen w-screen overflow-hidden relative reader-container ${isDarkMode ? 'dark' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => e.preventDefault()} // Disable right-click
    >
      {/* Custom PDF Viewer - No Scrolling */}
      <FlipPagePDFViewer
        book={book}
        pdfUrl={pdfUrl}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onDocumentLoad={handleDocumentLoad}
      />

      {/* Enhanced Toolbars */}
      <FlipPageToolbar
        book={book}
        currentPage={currentPage}
        totalPages={totalPages}
        isBookmarked={isCurrentPageBookmarked}
        showToolbars={showToolbars}
        isDarkMode={isDarkMode}
        onBack={() => setLocation('/')}
        onToggleBookmark={() => toggleBookmarkMutation.mutate()}
        onGoToPage={goToPage}
        onToggleDarkMode={() => setIsDarkMode(prev => !prev)}
        onToggleSidebar={() => setShowSidebar(true)}
      />

      {/* Bookmark Sidebar */}
      <BookmarkSidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        bookId={bookId!}
        currentPage={currentPage}
        onGoToPage={(page) => {
          goToPage(page);
          setShowSidebar(false);
        }}
      />
    </div>
  );
}