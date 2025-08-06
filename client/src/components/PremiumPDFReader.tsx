import { useState, useEffect, useRef, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Bookmark, BookmarkCheck, Menu, X, RotateCcw, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Configure PDF.js with a reliable CDN - using unpkg.com which has better CORS support
pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

interface PremiumPDFReaderProps {
  bookId: string;
  bookTitle: string;
  initialPage?: number;
  onPageChange?: (page: number, totalPages: number) => void;
  bookmarks?: Array<{ page: number; note?: string }>;
}

export function PremiumPDFReader({ 
  bookId, 
  bookTitle, 
  initialPage = 1, 
  onPageChange,
  bookmarks = []
}: PremiumPDFReaderProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(initialPage);
  const [scale, setScale] = useState(1.2);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const pdfUrl = `/api/stream/${bookId}`;

  // Memoize PDF options and file config to prevent unnecessary reloads
  const pdfOptions = useMemo(() => ({
    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
    disableAutoFetch: false,
    disableStream: false
  }), []);

  const pdfFile = useMemo(() => ({
    url: pdfUrl,
    httpHeaders: {
      'X-Requested-With': 'XMLHttpRequest',
    },
    withCredentials: true
  }), [pdfUrl]);

  // Check if current page is bookmarked
  useEffect(() => {
    const currentPageBookmark = bookmarks.find(b => b.page === pageNumber);
    setIsBookmarked(!!currentPageBookmark);
  }, [bookmarks, pageNumber]);

  // Auto-hide controls
  const resetControlsTimer = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Update reading progress
  const updateProgressMutation = useMutation({
    mutationFn: async ({ page, total }: { page: number; total: number }) => {
      await apiRequest('POST', '/api/progress', {
        bookId,
        currentPage: page,
        totalPages: total
      });
    },
    onError: (error) => {
      console.warn('Failed to update reading progress:', error);
    }
  });

  // Bookmark mutation
  const toggleBookmarkMutation = useMutation({
    mutationFn: async ({ bookId, page, isBookmarked }: { bookId: string; page: number; isBookmarked: boolean }) => {
      if (isBookmarked) {
        await apiRequest('DELETE', `/api/bookmarks/${bookId}/${page}`);
      } else {
        await apiRequest('POST', '/api/bookmarks', {
          bookId,
          page,
          note: `Page ${page} bookmark`
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks'] });
      setIsBookmarked(!isBookmarked);
      toast({
        title: isBookmarked ? "Bookmark removed" : "Bookmark added",
        description: `Page ${pageNumber} ${isBookmarked ? 'removed from' : 'added to'} bookmarks`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive",
      });
    }
  });

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoading(false);
    console.log('PDF loaded:', numPages, 'pages');
  }

  function onDocumentLoadError(error: Error) {
    console.error('Error loading PDF:', error);
    setIsLoading(false);
    
    // Check if it's an authentication error
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access this book",
        variant: "destructive",
      });
    } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
      toast({
        title: "Upgrade Required",
        description: "This book requires a higher subscription tier",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Error loading book",
        description: "Failed to load PDF file. Please try refreshing the page.",
        variant: "destructive",
      });
    }
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= (numPages || 1)) {
      setPageNumber(page);
      onPageChange?.(page, numPages || 1);
      
      // Update reading progress
      if (numPages) {
        updateProgressMutation.mutate({ page, total: numPages });
      }
      
      resetControlsTimer();
    }
  }

  function nextPage() {
    goToPage(pageNumber + 1);
  }

  function previousPage() {
    goToPage(pageNumber - 1);
  }

  function handleZoomIn() {
    setScale(prev => Math.min(prev + 0.2, 3.0));
    resetControlsTimer();
  }

  function handleZoomOut() {
    setScale(prev => Math.max(prev - 0.2, 0.5));
    resetControlsTimer();
  }

  function handleScaleChange(value: number[]) {
    setScale(value[0]);
    resetControlsTimer();
  }

  function toggleBookmark() {
    toggleBookmarkMutation.mutate({
      bookId,
      page: pageNumber,
      isBookmarked
    });
  }

  // Keyboard navigation
  useEffect(() => {
    function handleKeyPress(event: KeyboardEvent) {
      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          previousPage();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
          event.preventDefault();
          nextPage();
          break;
        case 'Escape':
          setShowSidebar(false);
          break;
        case 'b':
        case 'B':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            toggleBookmark();
          }
          break;
      }
    }

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [pageNumber, numPages, isBookmarked]);

  // Touch/swipe support for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    resetControlsTimer();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) nextPage();
    if (isRightSwipe) previousPage();
  };

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 z-50 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}
      onMouseMove={resetControlsTimer}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Controls Bar */}
      <div className={`absolute top-0 left-0 right-0 z-10 transition-all duration-500 ease-in-out ${
        showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}>
        <div className={`${isDarkMode ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-md border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className={`${isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
              >
                <ChevronLeft className="h-5 w-5 mr-1" />
                Back
              </Button>
              
              <div className="hidden md:block">
                <h1 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate max-w-md`}>
                  {bookTitle}
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Page Navigation */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={previousPage}
                  disabled={pageNumber <= 1}
                  className={`${isDarkMode ? 'text-white hover:bg-gray-700 disabled:text-gray-500' : 'text-gray-700 hover:bg-gray-100 disabled:text-gray-400'}`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} min-w-[80px] text-center`}>
                  {numPages ? `${pageNumber} / ${numPages}` : 'Loading...'}
                </span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={nextPage}
                  disabled={!numPages || pageNumber >= numPages}
                  className={`${isDarkMode ? 'text-white hover:bg-gray-700 disabled:text-gray-500' : 'text-gray-700 hover:bg-gray-100 disabled:text-gray-400'}`}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Zoom Controls */}
              <div className="hidden md:flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={scale <= 0.5}
                  className={`${isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                
                <div className="w-20">
                  <Slider
                    value={[scale]}
                    onValueChange={handleScaleChange}
                    min={0.5}
                    max={3.0}
                    step={0.1}
                    className="cursor-pointer"
                  />
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={scale >= 3.0}
                  className={`${isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>

              {/* Action Buttons */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleBookmark}
                disabled={toggleBookmarkMutation.isPending}
                className={`${isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} ${
                  isBookmarked ? 'text-orange-500' : ''
                }`}
              >
                {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`${isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className={`${isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} md:hidden`}
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-full pt-20 flex items-center justify-center overflow-auto">
        {isLoading && (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <span className={`ml-3 text-lg ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Loading book...</span>
          </div>
        )}

        <Document
          file={pdfFile}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading=""
          className="flex items-center justify-center"
          options={pdfOptions}
        >
          {numPages && (
            <div className="transition-all duration-300 ease-in-out">
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={false}
                className={`shadow-2xl transition-all duration-500 ease-out ${
                  isDarkMode ? 'shadow-black/50' : 'shadow-gray-400/30'
                } hover:shadow-3xl transform hover:scale-[1.02]`}
                canvasBackground={isDarkMode ? '#1f2937' : 'white'}
                loading={
                  <div className={`flex items-center justify-center p-8 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mr-3"></div>
                    Loading page...
                  </div>
                }
                error={
                  <div className={`flex items-center justify-center p-8 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                    Failed to load page
                  </div>
                }
              />
            </div>
          )}
        </Document>
      </div>

      {/* Bottom Progress Bar */}
      <div className={`absolute bottom-0 left-0 right-0 z-10 transition-all duration-500 ease-in-out ${
        showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}>
        <div className={`${isDarkMode ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-md border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} min-w-[60px]`}>
                Page {pageNumber}
              </span>
              
              {numPages && (
                <div className="flex-1">
                  <Slider
                    value={[pageNumber]}
                    onValueChange={(value) => goToPage(value[0])}
                    min={1}
                    max={numPages}
                    step={1}
                    className="cursor-pointer"
                  />
                </div>
              )}
              
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} min-w-[60px] text-right`}>
                {numPages ? `${Math.round((pageNumber / numPages) * 100)}%` : '0%'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSidebar(false)} />
          <div className={`absolute right-0 top-0 bottom-0 w-80 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 shadow-xl transform transition-transform duration-300 ease-in-out translate-x-0`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Reader Options</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(false)}
                className={`${isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile Zoom Controls */}
            <div className="space-y-4">
              <div>
                <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} block mb-2`}>
                  Zoom Level: {Math.round(scale * 100)}%
                </label>
                <Slider
                  value={[scale]}
                  onValueChange={handleScaleChange}
                  min={0.5}
                  max={3.0}
                  step={0.1}
                  className="cursor-pointer"
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={handleZoomOut}
                  disabled={scale <= 0.5}
                  className="flex-1"
                >
                  <ZoomOut className="h-4 w-4 mr-2" />
                  Zoom Out
                </Button>
                <Button
                  variant="outline"
                  onClick={handleZoomIn}
                  disabled={scale >= 3.0}
                  className="flex-1"
                >
                  <ZoomIn className="h-4 w-4 mr-2" />
                  Zoom In
                </Button>
              </div>
            </div>

            {/* Bookmarks */}
            {bookmarks.length > 0 && (
              <div className="mt-6">
                <h4 className={`text-md font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>Bookmarks</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {bookmarks.map((bookmark, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        goToPage(bookmark.page);
                        setShowSidebar(false);
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                      } ${bookmark.page === pageNumber ? 'bg-orange-500/10 text-orange-500' : ''}`}
                    >
                      <div className="flex items-center">
                        <Bookmark className="h-4 w-4 mr-2" />
                        Page {bookmark.page}
                      </div>
                      {bookmark.note && (
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {bookmark.note}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}