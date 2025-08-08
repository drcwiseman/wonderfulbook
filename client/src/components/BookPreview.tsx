import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, X, Book, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BookPreviewProps {
  book: {
    id: string;
    title: string;
    author: string;
    coverImageUrl?: string;
    previewPageCount?: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

interface PreviewPage {
  pageNumber: number;
  content: string;
  isLeft?: boolean;
}

// Sample preview content - in a real app, this would come from the API
const generatePreviewPages = (book: any): PreviewPage[] => {
  const pages: PreviewPage[] = [];
  
  // Cover page
  pages.push({
    pageNumber: 0,
    content: `
      <div class="h-full flex flex-col justify-center items-center text-center p-8 bg-gradient-to-br from-orange-50 to-white">
        <h1 class="text-4xl font-bold text-gray-900 mb-4">${book.title}</h1>
        <p class="text-xl text-gray-600 mb-8">by ${book.author}</p>
        <div class="w-24 h-1 bg-orange-500 mx-auto"></div>
      </div>
    `
  });

  // Table of Contents
  pages.push({
    pageNumber: 1,
    content: `
      <div class="h-full p-8">
        <h2 class="text-3xl font-bold text-gray-900 mb-8">Table of Contents</h2>
        <div class="space-y-4">
          <div class="flex justify-between border-b pb-2">
            <span class="text-gray-700">Chapter 1: Introduction</span>
            <span class="text-gray-500">3</span>
          </div>
          <div class="flex justify-between border-b pb-2">
            <span class="text-gray-700">Chapter 2: Getting Started</span>
            <span class="text-gray-500">15</span>
          </div>
          <div class="flex justify-between border-b pb-2">
            <span class="text-gray-700">Chapter 3: Core Concepts</span>
            <span class="text-gray-500">28</span>
          </div>
          <div class="flex justify-between border-b pb-2">
            <span class="text-gray-700">Chapter 4: Advanced Techniques</span>
            <span class="text-gray-500">45</span>
          </div>
          <div class="flex justify-between border-b pb-2">
            <span class="text-gray-700">Chapter 5: Practical Applications</span>
            <span class="text-gray-500">62</span>
          </div>
        </div>
      </div>
    `
  });

  // Sample content pages
  for (let i = 2; i < (book.previewPageCount || 5); i++) {
    pages.push({
      pageNumber: i,
      content: `
        <div class="h-full p-8">
          <h3 class="text-2xl font-bold text-gray-900 mb-6">Chapter ${Math.floor(i/2)}</h3>
          <div class="prose prose-gray max-w-none">
            <p class="text-gray-700 leading-relaxed mb-4">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
            <p class="text-gray-700 leading-relaxed mb-4">
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
              Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
            <p class="text-gray-700 leading-relaxed mb-4">
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, 
              totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
            </p>
            <p class="text-gray-700 leading-relaxed">
              Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni 
              dolores eos qui ratione voluptatem sequi nesciunt.
            </p>
          </div>
          <div class="absolute bottom-8 right-8 text-gray-400 text-sm">
            Page ${i + 1}
          </div>
        </div>
      `
    });
  }

  return pages;
};

export default function BookPreview({ book, isOpen, onClose }: BookPreviewProps) {
  const [currentSpread, setCurrentSpread] = useState(0); // 0 = cover, 1 = pages 1-2, etc.
  const [isFlipping, setIsFlipping] = useState(false);
  const [previewPages] = useState(() => generatePreviewPages(book));

  const nextSpread = () => {
    if (isFlipping) return;
    const maxSpread = Math.ceil(previewPages.length / 2) - 1;
    if (currentSpread < maxSpread) {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentSpread(currentSpread + 1);
        setIsFlipping(false);
      }, 300);
    }
  };

  const prevSpread = () => {
    if (isFlipping) return;
    if (currentSpread > 0) {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentSpread(currentSpread - 1);
        setIsFlipping(false);
      }, 300);
    }
  };

  const getLeftPage = () => {
    if (currentSpread === 0) return null; // Cover page takes full spread
    const pageIndex = (currentSpread - 1) * 2 + 1;
    return previewPages[pageIndex] || null;
  };

  const getRightPage = () => {
    if (currentSpread === 0) return previewPages[0]; // Cover page
    const pageIndex = (currentSpread - 1) * 2 + 2;
    return previewPages[pageIndex] || null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-3">
            <Book className="w-6 h-6 text-orange-600" />
            <div>
              <h3 className="font-semibold text-gray-900">{book.title}</h3>
              <p className="text-sm text-gray-600">Preview - {book.previewPageCount || 5} pages</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Book Content */}
        <div className="relative bg-gray-100 p-8">
          <div className="relative mx-auto" style={{ width: '800px', height: '600px', perspective: '1000px' }}>
            
            {/* Book Base */}
            <div className="absolute inset-0 bg-gray-800 rounded-r-lg shadow-2xl" 
                 style={{ transform: 'rotateY(-5deg)' }}>
            </div>

            {/* Left Page */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`left-${currentSpread}`}
                className="absolute left-0 top-0 w-1/2 h-full bg-white shadow-lg border-r border-gray-300 overflow-hidden"
                initial={{ rotateY: isFlipping ? -180 : 0 }}
                animate={{ rotateY: 0 }}
                exit={{ rotateY: 180 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                style={{ 
                  transformOrigin: 'right center',
                  transformStyle: 'preserve-3d'
                }}
              >
                <div className="h-full relative">
                  {getLeftPage() && (
                    <div 
                      className="h-full w-full"
                      dangerouslySetInnerHTML={{ __html: getLeftPage()!.content }}
                    />
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Right Page */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`right-${currentSpread}`}
                className="absolute right-0 top-0 w-1/2 h-full bg-white shadow-lg overflow-hidden"
                initial={{ rotateY: isFlipping ? 180 : 0 }}
                animate={{ rotateY: 0 }}
                exit={{ rotateY: -180 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                style={{ 
                  transformOrigin: 'left center',
                  transformStyle: 'preserve-3d'
                }}
              >
                <div className="h-full relative">
                  {getRightPage() && (
                    <div 
                      className="h-full w-full"
                      dangerouslySetInnerHTML={{ __html: getRightPage()!.content }}
                    />
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Page Numbers */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-sm text-gray-500">
              {currentSpread === 0 ? 'Cover' : `Pages ${(currentSpread - 1) * 2 + 1}-${Math.min((currentSpread - 1) * 2 + 2, previewPages.length)}`}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-4 bg-gray-50 border-t">
          <Button
            variant="outline"
            onClick={prevSpread}
            disabled={currentSpread === 0 || isFlipping}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          <div className="flex items-center space-x-2">
            {Array.from({ length: Math.ceil(previewPages.length / 2) }, (_, i) => (
              <button
                key={i}
                className={`w-3 h-3 rounded-full transition-colors ${
                  i === currentSpread ? 'bg-orange-500' : 'bg-gray-300'
                }`}
                onClick={() => {
                  if (!isFlipping && i !== currentSpread) {
                    setIsFlipping(true);
                    setTimeout(() => {
                      setCurrentSpread(i);
                      setIsFlipping(false);
                    }, 300);
                  }
                }}
              />
            ))}
          </div>

          <Button
            variant="outline"
            onClick={nextSpread}
            disabled={currentSpread >= Math.ceil(previewPages.length / 2) - 1 || isFlipping}
            className="flex items-center space-x-2"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Call to Action */}
        <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-t">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Enjoying the preview? Get full access to continue reading.
              </p>
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={onClose}>
                Close Preview
              </Button>
              <Button className="bg-orange-600 hover:bg-orange-700">
                Start Reading
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}