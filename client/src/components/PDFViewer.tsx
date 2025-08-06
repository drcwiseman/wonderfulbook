import { useEffect, useState, useCallback, useRef } from 'react';
import { Worker } from '@react-pdf-viewer/core';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import type { Book } from '@shared/schema';
import * as pdfjsLib from 'pdfjs-dist';

// Import CSS
import '@react-pdf-viewer/core/lib/styles/index.css';

interface PDFViewerProps {
  book: Book;
  pdfUrl: string;
  bookId: string;
  currentPage?: number;
  onPageChange?: (page: number, totalPages: number) => void;
  onDocumentLoad?: (totalPages: number) => void;
  onGoToPage?: (page: number) => void;
}

export default function PDFViewer({ 
  book, 
  pdfUrl, 
  bookId,
  currentPage: externalCurrentPage = 1,
  onPageChange, 
  onDocumentLoad,
  onGoToPage
}: PDFViewerProps) {
  const { toast } = useToast();
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isScrollMode, setIsScrollMode] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageImage, setPageImage] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<any>(null);

  // Use external current page if provided, otherwise use internal state
  const currentPage = externalCurrentPage || internalCurrentPage;

  // Load and initialize PDF document
  const loadPDF = useCallback(async () => {
    if (!pdfUrl) return;

    try {
      const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
      setPdfDoc(pdf);
      const pages = pdf.numPages;
      setTotalPages(pages);
      onDocumentLoad?.(pages);
      
      // Load first page
      await renderPage(pdf, 1);
      
      toast({
        title: "Book Ready",
        description: `${pages} pages loaded successfully`,
      });
    } catch (error) {
      console.error('Error loading PDF:', error);
      toast({
        title: "Error",
        description: "Failed to load PDF",
        variant: "destructive",
      });
    }
  }, [pdfUrl, onDocumentLoad, toast]);

  // Render a specific page
  const renderPage = useCallback(async (pdf: any, pageNum: number) => {
    if (!pdf || !canvasRef.current) return;

    try {
      const page = await pdf.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Calculate scale to fit the container
      const containerWidth = canvas.parentElement?.clientWidth || 800;
      const containerHeight = canvas.parentElement?.clientHeight || 600;
      
      const viewport = page.getViewport({ scale: 1 });
      const scaleX = (containerWidth - 40) / viewport.width;
      const scaleY = (containerHeight - 100) / viewport.height;
      const scale = Math.min(scaleX, scaleY, 2) * zoom;
      
      const scaledViewport = page.getViewport({ scale });
      
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;
      
      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport,
      };
      
      await page.render(renderContext).promise;
      
      // Convert to data URL for better performance
      const dataUrl = canvas.toDataURL();
      setPageImage(dataUrl);
      
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  }, [zoom]);

  // Load PDF when URL changes
  useEffect(() => {
    loadPDF();
  }, [loadPDF]);

  // Navigate to specific page
  const goToPage = useCallback(async (page: number) => {
    if (page >= 1 && page <= totalPages && pdfDoc) {
      setInternalCurrentPage(page);
      onPageChange?.(page, totalPages);
      onGoToPage?.(page);
      await renderPage(pdfDoc, page);
    }
  }, [totalPages, onPageChange, onGoToPage, pdfDoc, renderPage]);

  // Re-render current page when zoom changes
  useEffect(() => {
    if (pdfDoc && currentPage) {
      renderPage(pdfDoc, currentPage);
    }
  }, [zoom, pdfDoc, currentPage, renderPage]);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  // Toggle scroll/single page mode
  const toggleScrollMode = useCallback(() => {
    setIsScrollMode(prev => !prev);
  }, []);

  return (
    <div className="h-full w-full relative bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        <div 
          ref={viewerRef}
          className="h-full w-full flex items-center justify-center overflow-hidden"
        >
          {pageImage ? (
            <motion.img
              key={currentPage}
              src={pageImage}
              alt={`Page ${currentPage}`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            />
          ) : (
            <div className="flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          )}
          
          {/* Hidden canvas for rendering */}
          <canvas
            ref={canvasRef}
            className="hidden"
          />
        </div>
      </Worker>

      {/* Page Controls Overlay */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10"
        >
          <div className="bg-black/20 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm">
            Page {currentPage} of {totalPages}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}