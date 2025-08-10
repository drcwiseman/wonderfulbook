import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Bookmark, 
  BookmarkCheck, 
  Menu, 
  X, 
  Search,
  Sun,
  Moon,
  Settings,
  Volume2,
  VolumeX,
  List,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useCopyProtection } from '@/hooks/useCopyProtection';

// Configure PDF.js worker with better error handling
const configureWorker = () => {
  if (pdfjs.GlobalWorkerOptions.workerSrc) {
    console.log('PDF.js worker already configured:', pdfjs.GlobalWorkerOptions.workerSrc);
    return; // Already configured
  }
  
  try {
    // Try to import the worker URL from Vite
    import('pdfjs-dist/build/pdf.worker.min.js?url').then(({ default: workerUrl }) => {
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      console.log('PDF.js worker configured with Vite URL:', workerUrl);
    }).catch(() => {
      // Fallback 1: Try CDN
      const cdnWorker = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      pdfjs.GlobalWorkerOptions.workerSrc = cdnWorker;
      console.log('PDF.js worker configured with CDN:', cdnWorker);
    });
  } catch (error) {
    // Fallback 2: Alternative CDN
    console.warn('Primary worker setup failed, using unpkg fallback:', error);
    const unpkgWorker = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    pdfjs.GlobalWorkerOptions.workerSrc = unpkgWorker;
    console.log('PDF.js worker configured with unpkg fallback:', unpkgWorker);
  }
};

// Configure worker on module load - use immediate fallback
if (!pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  console.log('PDF.js worker configured immediately with unpkg CDN');
}

configureWorker();

interface AppleBooksPDFReaderProps {
  bookId: string;
  bookTitle: string;
  initialPage?: number;
  onPageChange?: (page: number, totalPages: number) => void;
  bookmarks?: Array<{ page: number; note?: string }>;
}

export function AppleBooksPDFReader({ 
  bookId, 
  bookTitle, 
  initialPage = 1, 
  onPageChange,
  bookmarks = []
}: AppleBooksPDFReaderProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(initialPage);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [pageInput, setPageInput] = useState(pageNumber.toString());
  
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { settings, isReading } = useAccessibility();
  const { tracking, canCopy, recordCopy, getRemainingPercentage } = useCopyProtection(bookId);

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Get PDF access token on mount
  useEffect(() => {
    let isCancelled = false;
    
    const getPdfToken = async () => {
      try {
        const response = await apiRequest('POST', `/api/pdf-token/${bookId}`);
        if (isCancelled) return;
        
        const { token } = await response.json();
        if (isCancelled) return;
        
        const pdfStreamUrl = `/api/stream-token/${token}/${bookId}`;
        console.log('Setting PDF URL:', pdfStreamUrl);
        setPdfUrl(pdfStreamUrl);
        
        // Keep loading state true until PDF document loads
        console.log('PDF token received, PDF document will start loading');
      } catch (error: any) {
        if (isCancelled) return;
        
        if (error.message?.includes('aborted') || error.name === 'AbortError') {
          return;
        }
        
        console.error('Error getting PDF token:', error);
        
        if (error.message?.includes('401') || error.message?.includes('Unauthorized') || 
            error.response?.status === 401) {
          toast({
            title: "Authentication Required",
            description: "Please log in to access this book",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Access Error",
            description: "Unable to load book. Please try again.",
            variant: "destructive",
          });
        }
      }
    };
    
    getPdfToken();
    
    return () => {
      isCancelled = true;
    };
  }, [bookId, toast]);

  // PDF configuration with better error handling
  const pdfOptions = useMemo(() => ({
    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
    disableAutoFetch: false,
    disableStream: false,
    useSystemFonts: true
  }), []);

  const pdfFile = useMemo(() => {
    if (!pdfUrl) {
      console.log('No PDF URL available yet');
      return null;
    }
    console.log('Creating PDF file object with URL:', pdfUrl);
    return {
      url: pdfUrl,
      httpHeaders: {
        'X-Requested-With': 'XMLHttpRequest',
      },
      withCredentials: false
    };
  }, [pdfUrl]);

  // Check if current page is bookmarked
  useEffect(() => {
    const currentPageBookmark = bookmarks.find(b => b.page === pageNumber);
    setIsBookmarked(!!currentPageBookmark);
  }, [bookmarks, pageNumber]);

  // Update page input when page changes
  useEffect(() => {
    setPageInput(pageNumber.toString());
  }, [pageNumber]);

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (!showSidebar && !showSearch) {
        setShowControls(false);
      }
    }, 4000);
  }, [showSidebar, showSearch]);

  // Progress tracking
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
    }
  });

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoading(false);
    console.log('PDF loaded:', numPages, 'pages');
    
    toast({
      title: "Book loaded",
      description: `Ready to read ${numPages} pages`,
    });
  }

  function onDocumentLoadError(error: Error) {
    console.error('Error loading PDF:', error);
    setIsLoading(false);
    
    if (error.message.includes('aborted') || error.name === 'AbortError') {
      return;
    }
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      toast({
        title: "Authentication Required", 
        description: "Please refresh the page to log in again",
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
        title: "Loading Failed",
        description: "Unable to load the book. Please check your connection and try again.",
        variant: "destructive",
      });
    }
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= (numPages || 1)) {
      setPageNumber(page);
      onPageChange?.(page, numPages || 1);
      
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
    setScale(prev => Math.min(prev + 0.1, 3.0));
    resetControlsTimer();
  }

  function handleZoomOut() {
    setScale(prev => Math.max(prev - 0.1, 0.5));
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

  function handlePageInputSubmit(e: React.FormEvent) {
    e.preventDefault();
    const page = parseInt(pageInput, 10);
    if (!isNaN(page)) {
      goToPage(page);
    } else {
      setPageInput(pageNumber.toString());
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }

  // Keyboard navigation
  useEffect(() => {
    function handleKeyPress(event: KeyboardEvent) {
      if (showSearch && event.target instanceof HTMLInputElement) return;
      
      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          previousPage();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
          if (!event.target || (event.target as HTMLElement).tagName !== 'INPUT') {
            event.preventDefault();
            nextPage();
          }
          break;
        case 'Escape':
          setShowSidebar(false);
          setShowSearch(false);
          if (isFullscreen) {
            document.exitFullscreen?.();
          }
          break;
        case 'f':
        case 'F':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            setShowSearch(!showSearch);
          }
          break;
        case 'F11':
          event.preventDefault();
          toggleFullscreen();
          break;
      }
    }

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [pageNumber, numPages, showSearch, isFullscreen]);

  // Touch/swipe support
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
      className={`apple-books-reader fixed inset-0 z-50 transition-all duration-300 ${
        isDarkMode 
          ? 'dark bg-black text-white' 
          : 'bg-white text-gray-900'
      }`}
      onMouseMove={resetControlsTimer}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Controls Bar - Apple Books Style */}
      <div className={`absolute top-0 left-0 right-0 z-20 transition-all duration-300 ease-in-out ${
        showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}>
        <div className={`apple-books-controls pdf-controls-transition border-b px-4 py-3 ${
          isDarkMode ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            {/* Left Section */}
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="text-blue-500 hover:text-blue-600"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Library
              </Button>
            </div>

            {/* Center Section */}
            <div className="flex items-center space-x-4">
              <h1 className="font-medium text-lg truncate max-w-xs">
                {bookTitle}
              </h1>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSearch(!showSearch)}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Search className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleBookmark}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {isBookmarked ? (
                  <BookmarkCheck className="w-5 h-5 text-blue-500" />
                ) : (
                  <Bookmark className="w-5 h-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <List className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className={`apple-books-controls absolute top-16 left-0 right-0 z-20 border-b px-4 py-3 ${
          isDarkMode ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <div className="max-w-md mx-auto">
            <Input
              type="text"
              placeholder="Search in book..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Sidebar */}
      {showSidebar && (
        <div className={`apple-books-sidebar absolute left-0 top-0 bottom-0 w-80 z-30 border-r ${
          isDarkMode ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Contents</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Bookmarks */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Bookmarks
              </h3>
              {bookmarks.length > 0 ? (
                <div className="space-y-1">
                  {bookmarks.map((bookmark, index) => (
                    <button
                      key={index}
                      onClick={() => goToPage(bookmark.page)}
                      className={`w-full text-left p-2 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-800 ${
                        bookmark.page === pageNumber 
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' 
                          : ''
                      }`}
                    >
                      Page {bookmark.page}
                      {bookmark.note && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {bookmark.note}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No bookmarks yet
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`${showSidebar ? 'ml-80' : ''} h-full pt-16 ${showSearch ? 'pt-28' : ''}`}>
        <div className="flex items-center justify-center h-full p-4">
          {isLoading ? (
            <div className="text-center">
              <div className="apple-loading-spinner w-12 h-12 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Loading book...</p>
            </div>
          ) : pdfFile ? (
            <Document
              file={pdfFile}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="text-center">
                  <div className="apple-loading-spinner w-12 h-12 mx-auto mb-4"></div>
                  <p className="font-medium">Loading PDF...</p>
                </div>
              }
              error={
                <div className="text-center text-red-500">
                  <p>Failed to load PDF</p>
                  <p className="text-sm">Please check your connection and try again</p>
                </div>
              }
              options={pdfOptions}
            >
              <div className="relative">
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  loading={
                    <div className="flex items-center justify-center h-96">
                      <div className="apple-loading-spinner w-8 h-8"></div>
                    </div>
                  }
                  error={
                    <div className="flex items-center justify-center h-96 text-red-500">
                      Failed to load page
                    </div>
                  }
                  className="shadow-xl rounded-lg overflow-hidden"
                />
                
                {/* Page Navigation Overlay */}
                <div className="absolute inset-0 flex">
                  {/* Previous Page Area */}
                  <div 
                    className="w-1/3 cursor-pointer flex items-center justify-start pl-4"
                    onClick={previousPage}
                  >
                    {pageNumber > 1 && (
                      <ChevronLeft className="w-8 h-8 text-gray-400 hover:text-gray-600 opacity-0 hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                  
                  {/* Middle Area - Show controls on click */}
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={resetControlsTimer}
                  />
                  
                  {/* Next Page Area */}
                  <div 
                    className="w-1/3 cursor-pointer flex items-center justify-end pr-4"
                    onClick={nextPage}
                  >
                    {pageNumber < (numPages || 1) && (
                      <ChevronRight className="w-8 h-8 text-gray-400 hover:text-gray-600 opacity-0 hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>
              </div>
            </Document>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400">Preparing book...</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls - Apple Books Style */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-300 ease-in-out ${
        showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}>
        <div className={`apple-books-controls pdf-controls-transition border-t px-4 py-3 ${
          isDarkMode ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            {/* Left Section - Page Navigation */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={previousPage}
                disabled={pageNumber <= 1}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <form onSubmit={handlePageInputSubmit} className="flex items-center space-x-2">
                <Input
                  type="text"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  className="w-16 text-center h-8"
                />
                <span className="text-sm text-gray-500">of {numPages || 0}</span>
              </form>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={nextPage}
                disabled={pageNumber >= (numPages || 1)}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Center Section - Zoom Controls */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              
              <div className="w-32">
                <Slider
                  value={[scale]}
                  onValueChange={handleScaleChange}
                  min={0.5}
                  max={3.0}
                  step={0.1}
                />
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={scale >= 3.0}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              
              <span className="text-xs text-gray-500 min-w-[3rem] text-center">
                {Math.round(scale * 100)}%
              </span>
            </div>

            {/* Right Section - Settings */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDarkMode(!isDarkMode)}
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-5 h-5" />
                ) : (
                  <Maximize2 className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Copy Protection Warning */}
      {tracking && getRemainingPercentage() < 10 && (
        <div className={`absolute top-20 right-4 z-30 ${
          isDarkMode ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200'
        } border rounded-lg p-3 max-w-sm`}>
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            Copy Limit Warning
          </p>
          <p className="text-xs text-red-600 dark:text-red-300">
            {getRemainingPercentage().toFixed(1)}% copy allowance remaining
          </p>
        </div>
      )}
    </div>
  );
}