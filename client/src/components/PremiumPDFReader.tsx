import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Bookmark, BookmarkCheck, Menu, X, RotateCcw, Sun, Moon, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCopyProtection } from '@/hooks/useCopyProtection';
import { useLocation } from 'wouter';

// Configure PDF.js worker
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
  
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
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
        
        if (error.message?.includes('aborted') || error.name === 'AbortError') {
          console.log('Token request was cancelled - this is normal during navigation');
          return;
        }
        
        console.error('Error getting PDF token:', error);
        
        if (error.message?.includes('401') || error.message?.includes('Unauthorized') || 
            error.response?.status === 401) {
          toast({
            title: "Access Denied",
            description: "You need to be logged in to read this book.",
            variant: "destructive",
          });
          
          setLocation('/auth/login');
          return;
        }
        
        toast({
          title: "Error Loading Book",
          description: error.message || "Failed to load the book. Please try again.",
          variant: "destructive",
        });
      }
    };

    getPdfToken();
    
    return () => {
      isCancelled = true;
    };
  }, [bookId, toast, setLocation]);

  // Other effects and functions would go here...
  // For now, let's just include the basic structure

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    if (onPageChange) {
      onPageChange(pageNumber, numPages);
    }
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setIsLoading(false);
    toast({
      title: "Error Loading Book",
      description: "Failed to load the PDF. Please try again.",
      variant: "destructive",
    });
  };

  const nextPage = () => {
    if (numPages && pageNumber < numPages) {
      const newPage = pageNumber + 1;
      setPageNumber(newPage);
      if (onPageChange) {
        onPageChange(newPage, numPages);
      }
    }
  };

  const previousPage = () => {
    if (pageNumber > 1) {
      const newPage = pageNumber - 1;
      setPageNumber(newPage);
      if (onPageChange && numPages) {
        onPageChange(newPage, numPages);
      }
    }
  };

  return (
    <div className={`h-screen w-full relative ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`} ref={containerRef}>
      {/* Top Controls */}
      <div className={`absolute top-0 left-0 right-0 z-20 transition-opacity duration-300 \${
        showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <div className={`\${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-b backdrop-blur-sm`}>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <h1 className={`text-lg font-semibold truncate max-w-xs \${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {bookTitle}
              </h1>
              <div className={`text-sm \${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {numPages ? `Page \${pageNumber} of \${numPages}` : 'Loading...'}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={previousPage}
                disabled={pageNumber <= 1}
                className={`\${isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={nextPage}
                disabled={!numPages || pageNumber >= numPages}
                className={`\${isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2 mx-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                  className={`\${isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                
                <span className={`text-sm min-w-[60px] text-center \${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {Math.round(scale * 100)}%
                </span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setScale(Math.min(3, scale + 0.1))}
                  className={`\${isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`\${isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className={`\${isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} md:hidden`}
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
            <span className={`ml-3 text-lg \${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
              {!pdfUrl ? 'Getting book access...' : 'Loading book...'}
            </span>
          </div>
        )}

        {pdfUrl && (
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading=""
            className="flex items-center justify-center"
          >
            {numPages && (
              <Page
                pageNumber={pageNumber}
                scale={scale}
                loading=""
                className={`\${isDarkMode ? 'invert' : ''}`}
              />
            )}
          </Document>
        )}
      </div>
    </div>
  );
}
