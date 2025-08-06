import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import * as pdfjsLib from 'pdfjs-dist';
import type { Book } from '@shared/schema';

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

interface FlipPagePDFViewerProps {
  book: Book;
  pdfUrl: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  onDocumentLoad: (totalPages: number) => void;
}

export default function FlipPagePDFViewer({
  book,
  pdfUrl,
  currentPage,
  onPageChange,
  onDocumentLoad
}: FlipPagePDFViewerProps) {
  const { toast } = useToast();
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [pageImage, setPageImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load PDF document
  const loadPDF = useCallback(async () => {
    if (!pdfUrl) return;

    try {
      setIsLoading(true);
      console.log('Loading PDF from:', pdfUrl);
      
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      
      setPdfDoc(pdf);
      const pages = pdf.numPages;
      setTotalPages(pages);
      onDocumentLoad(pages);
      
      console.log(`PDF loaded: ${pages} pages`);
      
      // Render first page
      await renderPage(pdf, currentPage);
      
      setIsLoading(false);
      
      toast({
        title: "Book Ready",
        description: `${pages} pages loaded successfully`,
      });
    } catch (error) {
      console.error('Error loading PDF:', error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to load PDF. Please try again.",
        variant: "destructive",
      });
    }
  }, [pdfUrl, currentPage, onDocumentLoad, toast]);

  // Render specific page
  const renderPage = useCallback(async (pdf: any, pageNum: number) => {
    if (!pdf || !canvasRef.current || pageNum < 1) return;

    try {
      setIsRendering(true);
      
      const page = await pdf.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;
      
      // Get container dimensions
      const container = containerRef.current;
      const containerWidth = container?.clientWidth || window.innerWidth;
      const containerHeight = container?.clientHeight || window.innerHeight - 160; // Account for toolbars
      
      // Calculate optimal scale
      const viewport = page.getViewport({ scale: 1.0 });
      const scaleX = (containerWidth - 40) / viewport.width;
      const scaleY = (containerHeight - 40) / viewport.height;
      const scale = Math.min(scaleX, scaleY, 2.0); // Max scale of 2.0
      
      const scaledViewport = page.getViewport({ scale });
      
      // Set canvas dimensions
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;
      
      // Clear canvas
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Render page
      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport,
      };
      
      await page.render(renderContext).promise;
      
      // Convert to image for better performance
      const imageData = canvas.toDataURL('image/png', 0.95);
      setPageImage(imageData);
      
      setIsRendering(false);
      
    } catch (error) {
      console.error('Error rendering page:', error);
      setIsRendering(false);
      toast({
        title: "Render Error",
        description: `Failed to render page ${pageNum}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Handle page changes
  useEffect(() => {
    if (pdfDoc && currentPage >= 1 && currentPage <= totalPages) {
      renderPage(pdfDoc, currentPage);
    }
  }, [pdfDoc, currentPage, totalPages, renderPage]);

  // Load PDF on mount or URL change
  useEffect(() => {
    loadPDF();
  }, [loadPDF]);

  // Navigate to page
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  }, [totalPages, onPageChange]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (pdfDoc && currentPage) {
        renderPage(pdfDoc, currentPage);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pdfDoc, currentPage, renderPage]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">Loading your book...</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {book.title} by {book.author}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-full w-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center overflow-hidden relative"
    >
      {/* Page Image Display */}
      <div className="relative flex items-center justify-center w-full h-full">
        <AnimatePresence mode="wait">
          {pageImage && (
            <motion.img
              key={`page-${currentPage}`}
              src={pageImage}
              alt={`Page ${currentPage} of ${book.title}`}
              className="max-w-full max-h-full object-contain shadow-2xl rounded-lg bg-white dark:bg-gray-800"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ 
                duration: 0.4, 
                ease: [0.25, 0.46, 0.45, 0.94] // Custom easing for smooth animation
              }}
              style={{
                filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.2))'
              }}
            />
          )}
        </AnimatePresence>

        {/* Loading overlay for page rendering */}
        {isRendering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm"
          >
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </motion.div>
        )}
      </div>

      {/* Page Counter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10"
      >
        <div className="bg-black/80 backdrop-blur-sm rounded-full px-6 py-3 text-white text-sm font-medium shadow-lg">
          Page {currentPage} of {totalPages}
        </div>
      </motion.div>

      {/* Invisible Navigation Areas */}
      <div className="absolute inset-0 flex">
        {/* Previous page area (left half) */}
        <div
          className="flex-1 cursor-pointer"
          onClick={() => currentPage > 1 && goToPage(currentPage - 1)}
          title="Previous page"
        />
        {/* Next page area (right half) */}
        <div
          className="flex-1 cursor-pointer"
          onClick={() => currentPage < totalPages && goToPage(currentPage + 1)}
          title="Next page"
        />
      </div>

      {/* Hidden canvas for rendering */}
      <canvas
        ref={canvasRef}
        className="hidden"
        style={{ display: 'none' }}
      />
    </div>
  );
}