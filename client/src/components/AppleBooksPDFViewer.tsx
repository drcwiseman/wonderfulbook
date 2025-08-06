import { useEffect, useState, useCallback, useRef } from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  BookmarkIcon, 
  ArrowLeftIcon, 
  ArrowRightIcon,
  MenuIcon,
  XIcon,
  BookOpenIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Book, Bookmark, ReadingProgress } from '@shared/schema';

// Import required CSS
import '@react-pdf-viewer/core/lib/styles/index.css';

interface AppleBooksPDFViewerProps {
  book: Book;
  pdfUrl: string;
  bookId: string;
}

export default function AppleBooksPDFViewer({ book, pdfUrl, bookId }: AppleBooksPDFViewerProps) {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [goToPage, setGoToPage] = useState('');
  
  // Auto-hide controls after 3 seconds of inactivity
  const hideControlsTimer = useRef<NodeJS.Timeout>();
  
  const resetHideTimer = useCallback(() => {
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    setShowControls(true);
    hideControlsTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current);
      }
    };
  }, [resetHideTimer]);

  // Fetch bookmarks for this book
  const { data: bookmarks = [], refetch: refetchBookmarks } = useQuery<Bookmark[]>({
    queryKey: [`/api/bookmarks/${bookId}`],
    enabled: !!bookId,
  });

  // Fetch reading progress
  const { data: progress } = useQuery<ReadingProgress>({
    queryKey: [`/api/reading-progress/${bookId}`],
    enabled: !!bookId,
  });

  // Add bookmark mutation
  const addBookmarkMutation = useMutation({
    mutationFn: async (pageNumber: number) => {
      return apiRequest('POST', '/api/bookmarks', {
        bookId,
        pageNumber,
        note: `Page ${pageNumber}`
      });
    },
    onSuccess: () => {
      toast({
        title: "Bookmark Added",
        description: `Page ${currentPage} has been bookmarked.`,
      });
      refetchBookmarks();
      queryClient.invalidateQueries([`/api/bookmarks/${bookId}`]);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add bookmark",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update reading progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ currentPage, totalPages }: { currentPage: number; totalPages: number }) => {
      return apiRequest('POST', '/api/reading-progress', {
        bookId,
        currentPage,
        totalPages
      });
    },
  });

  // Handle PDF document load
  const handleDocumentLoad = useCallback((e: any) => {
    setTotalPages(e.doc.numPages);
    console.log('PDF loaded:', e.doc.numPages, 'pages');
    
    // Resume from last read position
    if (progress?.currentPage && progress.currentPage > 1) {
      setCurrentPage(progress.currentPage);
    }
  }, [progress]);

  // Go to specific page
  const handleGoToPage = () => {
    const pageNum = parseInt(goToPage);
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      setGoToPage('');
      toast({
        title: "Page Navigation",
        description: `Navigated to page ${pageNum}`,
      });
    }
  };

  // Add bookmark for current page
  const handleAddBookmark = () => {
    addBookmarkMutation.mutate(currentPage);
  };

  return (
    <div 
      className="relative h-full bg-white dark:bg-gray-900 overflow-hidden"
      onMouseMove={resetHideTimer}
      onClick={resetHideTimer}
    >
      {/* Top Header - Apple Books Style */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.history.back()}
                  className="hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Library
                </Button>
                <div className="hidden sm:block">
                  <h1 className="font-semibold text-lg text-gray-900 dark:text-white truncate max-w-xs">
                    {book.title}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    by {book.author}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Page Navigation */}
                <div className="hidden md:flex items-center space-x-2">
                  <Input
                    type="number"
                    placeholder="Page"
                    value={goToPage}
                    onChange={(e) => setGoToPage(e.target.value)}
                    className="w-20 h-8 text-sm"
                    min={1}
                    max={totalPages}
                  />
                  <Button
                    size="sm"
                    onClick={handleGoToPage}
                    disabled={!goToPage}
                    className="h-8"
                  >
                    Go
                  </Button>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddBookmark}
                  disabled={addBookmarkMutation.isPending}
                  className="hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <BookmarkIcon className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBookmarks(!showBookmarks)}
                  className="hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <MenuIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="px-4 pb-2">
              <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>Page {currentPage} of {totalPages}</span>
                <span className="ml-auto">
                  {totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                <div
                  className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                  style={{
                    width: totalPages > 0 ? `${(currentPage / totalPages) * 100}%` : '0%'
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bookmarks Sidebar */}
      <AnimatePresence>
        {showBookmarks && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-0 right-0 w-80 h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 z-40 shadow-xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Bookmarks</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBookmarks(false)}
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-4 space-y-3 max-h-full overflow-y-auto">
              {bookmarks.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <BookOpenIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No bookmarks yet</p>
                  <p className="text-xs">Tap the bookmark icon to save pages</p>
                </div>
              ) : (
                bookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => {
                      // Navigate to bookmarked page
                      toast({
                        title: "Bookmark",
                        description: `Navigating to page ${bookmark.page}`,
                      });
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                        Page {bookmark.page}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(bookmark.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {bookmark.note && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {bookmark.note}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF Viewer */}
      <div 
        className="h-full bg-white dark:bg-gray-800"
        style={{ paddingTop: showControls ? '130px' : '0px' }}
      >
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <div className="h-full">
            <Viewer
              fileUrl={pdfUrl}
              onDocumentLoad={handleDocumentLoad}
              theme={{
                theme: 'auto',
              }}
            />
          </div>
        </Worker>
      </div>

      {/* Bottom Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 md:hidden"
          >
            <div className="flex items-center justify-center p-4 space-x-6">
              <Button variant="ghost" size="sm">
                <ArrowLeftIcon className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="Page"
                  value={goToPage}
                  onChange={(e) => setGoToPage(e.target.value)}
                  className="w-20 h-8 text-sm"
                  min={1}
                  max={totalPages}
                />
                <Button
                  size="sm"
                  onClick={handleGoToPage}
                  disabled={!goToPage}
                  className="h-8"
                >
                  Go
                </Button>
              </div>
              
              <Button variant="ghost" size="sm">
                <ArrowRightIcon className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}