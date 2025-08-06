import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Bookmark, BookOpen, ZoomIn, ZoomOut, Menu, Sun, Moon, BookmarkCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function ReaderPage() {
  const { bookId } = useParams();
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  
  // Reader state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scrollMode, setScrollMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);
  const [pdfUrl, setPdfUrl] = useState('');
  
  // Touch gestures state
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  const viewerRef = useRef<HTMLDivElement>(null);
  const toolbarTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch book details
  const { data: book, isLoading: bookLoading } = useQuery({
    queryKey: ['/api/books', bookId],
    enabled: !!bookId,
  });

  // Fetch bookmarks
  const { data: bookmarks = [], refetch: refetchBookmarks } = useQuery({
    queryKey: ['/api/bookmarks', bookId],
    enabled: !!bookId && !!isAuthenticated,
  });

  // Fetch reading progress
  const { data: progress } = useQuery({
    queryKey: ['/api/progress', bookId],
    enabled: !!bookId && !!isAuthenticated,
  });

  // Mutations
  const updateProgressMutation = useMutation({
    mutationFn: async (data: { bookId: string; currentPage: number; totalPages: number; progressPercentage: string }) => {
      await apiRequest("POST", "/api/progress", data);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  const createBookmarkMutation = useMutation({
    mutationFn: async (data: { bookId: string; page: number; note: string }) => {
      await apiRequest("POST", "/api/bookmarks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks', bookId] });
      setIsBookmarked(true);
      toast({
        title: "Bookmark Added",
        description: `Page ${currentPage} bookmarked`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add bookmark",
        variant: "destructive",
      });
    },
  });

  // Initialize PDF URL and check access
  useEffect(() => {
    if (bookId && isAuthenticated) {
      setPdfUrl(`/api/stream/${bookId}`);
    }
  }, [bookId, isAuthenticated]);

  // Check if current page is bookmarked
  useEffect(() => {
    if (Array.isArray(bookmarks)) {
      setIsBookmarked(bookmarks.some((bookmark: any) => bookmark.page === currentPage));
    }
  }, [bookmarks, currentPage]);

  // Auto-hide toolbar
  const resetToolbarTimeout = useCallback(() => {
    if (toolbarTimeoutRef.current) {
      clearTimeout(toolbarTimeoutRef.current);
    }
    setIsToolbarVisible(true);
    toolbarTimeoutRef.current = setTimeout(() => {
      setIsToolbarVisible(false);
    }, 3000);
  }, []);

  // Handle PDF load
  const handleDocumentLoad = useCallback((e: any) => {
    const numPages = e.doc.numPages;
    setTotalPages(numPages);
    console.log('PDF loaded:', numPages, 'pages');
    
    // Resume to saved page
    if (progress && typeof progress === 'object' && 'currentPage' in progress) {
      setCurrentPage(Number(progress.currentPage));
    }
  }, [progress]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    if (page < 1 || page > totalPages) return;
    
    setCurrentPage(page);
    resetToolbarTimeout();
    
    // Auto-save progress
    if (book && typeof book === 'object' && 'id' in book && isAuthenticated && totalPages > 0) {
      const progressPercentage = ((page / totalPages) * 100).toFixed(2);
      updateProgressMutation.mutate({
        bookId: String(book.id),
        currentPage: page,
        totalPages,
        progressPercentage,
      });
    }
  }, [book, isAuthenticated, totalPages, updateProgressMutation, resetToolbarTimeout]);

  // Touch gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    };

    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = Math.abs(touchStart.y - touchEnd.y);

    // Horizontal swipe (page change)
    if (Math.abs(deltaX) > 50 && deltaY < 100) {
      if (deltaX > 0) {
        // Swipe left - next page
        handlePageChange(currentPage + 1);
      } else {
        // Swipe right - previous page
        handlePageChange(currentPage - 1);
      }
    }
  };

  // Handle bookmark toggle
  const handleBookmarkToggle = () => {
    if (isBookmarked) {
      // Remove bookmark logic would go here
      setIsBookmarked(false);
      toast({
        title: "Bookmark Removed",
        description: `Page ${currentPage} bookmark removed`,
      });
    } else {
      createBookmarkMutation.mutate({
        bookId: bookId!,
        page: currentPage,
        note: `Bookmark at page ${currentPage}`,
      });
    }
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));

  // Configure PDF viewer with better font handling
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: () => [], // Remove all sidebar tabs
    enableSmoothScroll: true,
  });

  // Security: Disable context menu and text selection
  useEffect(() => {
    const disableContextMenu = (e: Event) => e.preventDefault();
    const disableSelection = () => document.getSelection()?.removeAllRanges();
    const disableKeyboard = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === 's' || e.key === 'p' || e.key === 'a')) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', disableContextMenu);
    document.addEventListener('selectstart', disableSelection);
    document.addEventListener('keydown', disableKeyboard);

    return () => {
      document.removeEventListener('contextmenu', disableContextMenu);
      document.removeEventListener('selectstart', disableSelection);
      document.removeEventListener('keydown', disableKeyboard);
    };
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-netflix-black flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
              <p className="text-gray-600 mb-4">Please log in to access the book reader.</p>
              <Button onClick={() => window.location.href = "/api/login"}>
                Log In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (bookLoading || !book) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'} select-none`}>
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        {/* Top Toolbar */}
        <AnimatePresence>
          {isToolbarVisible && (
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLocation('/')}
                    className="hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate max-w-xs">
                    {book && typeof book === 'object' && 'title' in book ? String(book.title) : 'Loading...'}
                  </h1>
                </div>

                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={currentPage}
                    onChange={(e) => handlePageChange(Number(e.target.value))}
                    className="w-16 h-8 text-center text-sm"
                    min={1}
                    max={totalPages}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    / {totalPages}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsDarkMode(!isDarkMode)}
                  >
                    {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </Button>
                  
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Menu className="w-4 h-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Reading Options</SheetTitle>
                      </SheetHeader>
                      <div className="space-y-6 mt-6">
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium">View Mode</h3>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={scrollMode}
                              onCheckedChange={setScrollMode}
                            />
                            <span className="text-sm">Scroll Mode</span>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium">Bookmarks</h3>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {Array.isArray(bookmarks) && bookmarks.map((bookmark: any) => (
                              <Button
                                key={bookmark.id}
                                variant="ghost"
                                className="w-full justify-start text-left"
                                onClick={() => handlePageChange(bookmark.page)}
                              >
                                <Bookmark className="w-4 h-4 mr-2" />
                                <div>
                                  <div className="text-sm">Page {bookmark.page}</div>
                                  <div className="text-xs text-gray-500">{bookmark.note}</div>
                                </div>
                              </Button>
                            ))}
                            {(!Array.isArray(bookmarks) || bookmarks.length === 0) && (
                              <p className="text-sm text-gray-500">No bookmarks yet</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PDF Viewer */}
        <div 
          ref={viewerRef}
          className={`${isToolbarVisible ? 'pt-16' : 'pt-0'} ${isToolbarVisible ? 'pb-16' : 'pb-0'} transition-all duration-300`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={resetToolbarTimeout}
          style={{ 
            transform: `scale(${zoom})`,
            transformOrigin: 'center top',
            minHeight: '100vh'
          }}
        >
          {pdfUrl && (
            <Viewer
              fileUrl={pdfUrl}
              plugins={[defaultLayoutPluginInstance]}
              onDocumentLoad={handleDocumentLoad}
              onPageChange={(e) => setCurrentPage(e.currentPage + 1)}
            />
          )}
        </div>

        {/* Bottom Toolbar */}
        <AnimatePresence>
          {isToolbarVisible && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={handleZoomOut}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-12 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleZoomIn}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBookmarkToggle}
                  className={isBookmarked ? 'text-blue-600' : ''}
                >
                  {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Worker>
    </div>
  );
}