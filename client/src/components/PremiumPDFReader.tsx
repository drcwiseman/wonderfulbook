import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Bookmark, BookmarkCheck, Menu, X, RotateCcw, Sun, Moon, Volume2, VolumeX, Pause, Play, Accessibility, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useCopyProtection } from '@/hooks/useCopyProtection';
import AccessibilityPanel from '@/components/AccessibilityPanel';

// Configure PDF.js worker using the bundled version from node_modules
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

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
  const [showAccessibility, setShowAccessibility] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { settings, speakText, stopReading, isReading } = useAccessibility();
  const { tracking, isBlocked, canCopy, recordCopy, getRemainingPercentage, isCloseToLimit } = useCopyProtection(bookId);

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
        
        setPdfUrl(`/api/stream-token/${token}/${bookId}`);
      } catch (error: any) {
        if (isCancelled) return;
        
        // Don't show errors for aborted requests during development
        if (error.message?.includes('aborted') || error.name === 'AbortError') {
          console.log('Token request was cancelled - this is normal during navigation');
          return;
        }
        
        console.error('Error getting PDF token:', error);
        
        console.log('Full error object:', error);
        console.log('Error response:', error.response);
        
        // Check if it's an authentication error  
        if (error.message?.includes('401') || error.message?.includes('Unauthorized') || 
            error.response?.status === 401) {
          toast({
            title: "Please log in",
            description: "You need to be logged in to read books. Redirecting to login...",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = '/auth/login';
          }, 1500);
        } else {
          toast({
            title: "Access Error",
            description: "Failed to get book access. Please try refreshing the page.",
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

  // Memoize PDF options and file config to prevent unnecessary reloads
  const pdfOptions = useMemo(() => ({
    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
    disableAutoFetch: false,
    disableStream: false
  }), []);

  const pdfFile = useMemo(() => {
    if (!pdfUrl) return null;
    return {
      url: pdfUrl,
      httpHeaders: {
        'X-Requested-With': 'XMLHttpRequest',
      },
      withCredentials: false // No credentials needed for token-based access
    };
  }, [pdfUrl]);

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

  // Disable text selection and copy if limit reached
  useEffect(() => {
    const handleContextMenu = (e: Event) => {
      // Only block context menu if truly at limit
      if (tracking && (parseFloat(tracking.copyPercentage || '0') >= 40 || tracking.isLimitReached)) {
        e.preventDefault();
        toast({
          title: "Copy Protection",
          description: "You have reached the 40% copy limit for this book",
          variant: "destructive",
        });
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection();
      const selectedText = selection?.toString() || '';
      
      if (!selectedText || selectedText.length === 0) {
        return; // Allow empty selections
      }

      // Only block if we have tracking data AND the user is actually at the limit
      if (tracking) {
        const currentPercentage = parseFloat(tracking.copyPercentage || '0');
        const additionalPercentage = (selectedText.length / tracking.totalBookCharacters) * 100;
        const newPercentage = currentPercentage + additionalPercentage;

        if (newPercentage > 40) {
          e.preventDefault();
          toast({
            title: "Copy Limit Reached",
            description: `Cannot copy ${selectedText.length} characters. Only ${getRemainingPercentage().toFixed(1)}% copy allowance remaining.`,
            variant: "destructive",
          });
          return;
        }
      }

      // Record the copy attempt for tracking
      if (selectedText && selectedText.length > 0) {
        recordCopy(selectedText);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+A (select all) if close to limit
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && isCloseToLimit()) {
        e.preventDefault();
        toast({
          title: "Copy Protection",
          description: "Select all disabled - approaching copy limit",
          variant: "destructive",
        });
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isBlocked, canCopy, recordCopy, getRemainingPercentage, isCloseToLimit, toast, tracking]);

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
    
    // Don't show error if component is unmounting or signal aborted
    if (error.message.includes('aborted') || error.message.includes('AbortError') || 
        error.name === 'AbortError' || error.message.includes('The user aborted a request')) {
      console.log('PDF loading was cancelled - this is normal during navigation or hot reloading');
      return;
    }
    
    // Check if it's an authentication error
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      toast({
        title: "Authentication Required", 
        description: "Please refresh the page to log in again",
        variant: "destructive",
      });
      // Redirect to login after showing error
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 2000);
    } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
      toast({
        title: "Upgrade Required",
        description: "This book requires a higher subscription tier",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Error loading book",
        description: "Connection issue. Please try refreshing the page.",
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

  // Accessibility functions
  function readCurrentPage() {
    if (!settings.textToSpeech) return;
    
    try {
      // Get text content from the PDF page
      const textLayer = document.querySelector('.react-pdf__Page__textContent');
      if (textLayer) {
        const text = textLayer.textContent || '';
        const cleanText = text
          .replace(/\s+/g, ' ')
          .trim();
        
        if (cleanText) {
          speakText(`Page ${pageNumber}. ${cleanText}`);
        } else {
          speakText(`Page ${pageNumber} appears to be an image or has no readable text.`);
        }
      } else {
        speakText(`Reading page ${pageNumber} of ${bookTitle}.`);
      }
    } catch (error) {
      console.error('Error reading page:', error);
      speakText(`Unable to read page ${pageNumber}.`);
    }
  }

  function readPageInfo() {
    if (settings.textToSpeech) {
      speakText(`Currently on page ${pageNumber} of ${numPages} in ${bookTitle}.`);
    }
  }

  // Auto-read when page changes if enabled
  useEffect(() => {
    if (settings.autoRead && settings.textToSpeech && !isLoading) {
      setTimeout(readCurrentPage, 500); // Small delay for page render
    }
  }, [pageNumber, settings.autoRead, settings.textToSpeech, isLoading]);

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
        case 'r':
        case 'R':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            readCurrentPage();
          }
          break;
        case 'i':
        case 'I':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            readPageInfo();
          }
          break;
        case 's':
        case 'S':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            stopReading();
          }
          break;
        case 'a':
        case 'A':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            setShowAccessibility(!showAccessibility);
          }
          break;
      }
    }

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [pageNumber, numPages, isBookmarked, settings.textToSpeech, showAccessibility]);

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

              {/* Copy Protection Status */}
              {tracking && (
                <div className="flex items-center space-x-2">
                  <div className={`flex items-center px-2 py-1 rounded text-xs ${
                    getRemainingPercentage() <= 0 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    getRemainingPercentage() <= 5 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    <Copy className="h-3 w-3 mr-1" />
                    {getRemainingPercentage().toFixed(1)}% remaining
                  </div>
                </div>
              )}

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

              {/* Text-to-Speech Controls */}
              {settings.textToSpeech && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={readCurrentPage}
                    disabled={isReading}
                    className={`${isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} ${isReading ? 'text-blue-500' : ''}`}
                    title="Read current page (Ctrl+R)"
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>

                  {isReading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={stopReading}
                      className={`${isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} text-red-500`}
                      title="Stop reading (Ctrl+S)"
                    >
                      <VolumeX className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}

              {/* Accessibility Panel Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAccessibility(!showAccessibility)}
                className={`${isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} ${showAccessibility ? 'text-blue-500' : ''}`}
                title="Accessibility settings (Ctrl+A)"
              >
                <Accessibility className="h-4 w-4" />
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
        {(isLoading || !pdfUrl) && (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <span className={`ml-3 text-lg ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
              {!pdfUrl ? 'Getting book access...' : 'Loading book...'}
            </span>
          </div>
        )}

        {pdfFile && (
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
        )}
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

      {/* Accessibility Panel */}
      <AccessibilityPanel
        isOpen={showAccessibility}
        onClose={() => setShowAccessibility(false)}
      />

      {/* Keyboard Shortcuts Help (only visible when accessibility is enabled) */}
      {settings.textToSpeech && (
        <div className="fixed bottom-4 right-4 z-30">
          <div className={`text-xs p-2 rounded ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'} max-w-xs`}>
            <div className="font-medium mb-1">Keyboard Shortcuts:</div>
            <div>Ctrl+R - Read page</div>
            <div>Ctrl+I - Page info</div>
            <div>Ctrl+S - Stop reading</div>
            <div>Ctrl+A - Accessibility</div>
          </div>
        </div>
      )}
    </div>
  );
}