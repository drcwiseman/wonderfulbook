import React, { useState, useEffect, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Configure PDF.js worker
const configureWorker = () => {
  try {
    const workerSrc = `${window.location.origin}/node_modules/pdfjs-dist/build/pdf.worker.min.js`;
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    
    fetch(workerSrc).catch(() => {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    });
  } catch (error) {
    console.warn('Worker configuration failed, using fallback:', error);
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
  }
};

configureWorker();

interface SimplePDFReaderProps {
  bookId: string;
  bookTitle: string;
  initialPage?: number;
  onPageChange?: (page: number, totalPages: number) => void;
}

export function SimplePDFReader({ 
  bookId, 
  bookTitle, 
  initialPage = 1, 
  onPageChange
}: SimplePDFReaderProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(initialPage);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Get PDF access token
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
        
        console.error('Error getting PDF token:', error);
        
        if (error.message?.includes('401') || error.response?.status === 401) {
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

  // PDF configuration
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
      withCredentials: false
    };
  }, [pdfUrl]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoading(false);
    console.log('PDF loaded:', numPages, 'pages');
  }

  function onDocumentLoadError(error: Error) {
    console.error('Error loading PDF:', error);
    setIsLoading(false);
    
    if (error.message.includes('aborted') || error.name === 'AbortError') {
      console.log('PDF load error:', error);
      return;
    }
    
    toast({
      title: "Loading Failed",
      description: "Unable to load the book. Please try again.",
      variant: "destructive",
    });
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= (numPages || 1)) {
      setPageNumber(page);
      onPageChange?.(page, numPages || 1);
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
  }

  function handleZoomOut() {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  }

  if (!pdfFile) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Preparing book...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {bookTitle}
          </h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[4rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={scale >= 3.0}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        {isLoading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-orange-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading book...</p>
          </div>
        ) : (
          <Document
            file={pdfFile}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mx-auto mb-2"></div>
                <p>Loading PDF...</p>
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
            <Page
              pageNumber={pageNumber}
              scale={scale}
              loading={
                <div className="flex items-center justify-center h-96">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
                </div>
              }
              error={
                <div className="flex items-center justify-center h-96 text-red-500">
                  Failed to load page
                </div>
              }
              className="shadow-lg rounded-lg overflow-hidden"
            />
          </Document>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="outline"
            onClick={previousPage}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {pageNumber} of {numPages || 0}
          </span>
          
          <Button
            variant="outline"
            onClick={nextPage}
            disabled={pageNumber >= (numPages || 1)}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}