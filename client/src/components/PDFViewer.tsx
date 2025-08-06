import { useEffect, useState, useCallback, useRef } from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import type { Book } from '@shared/schema';

// Import CSS
import '@react-pdf-viewer/core/lib/styles/index.css';

interface PDFViewerProps {
  book: Book;
  pdfUrl: string;
  bookId: string;
  onPageChange?: (page: number, totalPages: number) => void;
  onDocumentLoad?: (totalPages: number) => void;
}

export default function PDFViewer({ 
  book, 
  pdfUrl, 
  bookId, 
  onPageChange, 
  onDocumentLoad 
}: PDFViewerProps) {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isScrollMode, setIsScrollMode] = useState(false);
  const viewerRef = useRef<any>(null);

  // Handle PDF document load
  const handleDocumentLoad = useCallback((e: any) => {
    const pages = e.doc.numPages;
    setTotalPages(pages);
    onDocumentLoad?.(pages);
    
    toast({
      title: "Book Ready",
      description: `${pages} pages loaded successfully`,
    });
  }, [onDocumentLoad, toast]);

  // Handle page change
  const handlePageChange = useCallback((e: any) => {
    const newPage = e.currentPage + 1; // PDF viewer is 0-indexed
    setCurrentPage(newPage);
    onPageChange?.(newPage, totalPages);
  }, [totalPages, onPageChange]);

  // Navigate to specific page
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      onPageChange?.(page, totalPages);
    }
  }, [totalPages, onPageChange]);

  // Next and previous page functions
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

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
    <div className="h-full w-full relative bg-gray-50 dark:bg-gray-900">
      {/* PDF Viewer */}
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        <div 
          ref={viewerRef}
          className="h-full w-full"
          style={{ 
            transform: `scale(${zoom})`,
            transformOrigin: 'center top',
          }}
        >
          <Viewer
            fileUrl={pdfUrl}
            onDocumentLoad={handleDocumentLoad}
            onPageChange={handlePageChange}
            theme="auto"
            defaultScale={1}
            scrollMode="page"
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