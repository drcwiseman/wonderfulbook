import React, { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

// Completely disable PDF.js worker to avoid compatibility issues in Replit
pdfjs.GlobalWorkerOptions.workerSrc = null;
(pdfjs as any).disableWorker = true;

interface SimplePDFReaderProps {
  pdfUrl: string;
  bookTitle: string;
  onClose: () => void;
}

export function SimplePDFReader({ pdfUrl, bookTitle, onClose }: SimplePDFReaderProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.3);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-700 hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Back
            </Button>
            <h1 className="text-lg font-semibold text-gray-900 truncate max-w-md">
              {bookTitle}
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={zoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button variant="ghost" size="sm" onClick={zoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto">
          <Document
            file={{
              url: pdfUrl,
              httpHeaders: {
                'Cache-Control': 'no-cache'
              }
            }}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => {
              console.error('PDF load error:', error);
            }}
            className="flex justify-center"
            error={
              <div className="flex items-center justify-center p-20 text-red-600">
                <span className="text-lg">Failed to load PDF - Check console for details</span>
              </div>
            }
            loading={
              <div className="flex items-center justify-center p-20 text-gray-700">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mr-4"></div>
                <span className="text-lg">Loading PDF...</span>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={false}
              className="shadow-xl rounded-lg overflow-hidden bg-white"
              canvasBackground="white"
              loading={
                <div className="flex items-center justify-center p-20 text-gray-700">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              }
              error={
                <div className="flex items-center justify-center p-20 text-red-600">
                  <span>Failed to load page</span>
                </div>
              }
            />
          </Document>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="bg-white shadow-sm border-t border-gray-200 p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="text-gray-700 hover:bg-gray-100"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Page {pageNumber} of {numPages}
            </span>
            <span className="text-sm text-gray-500">
              {numPages ? `${Math.round((pageNumber / numPages) * 100)}%` : '0%'}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="text-gray-700 hover:bg-gray-100"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}