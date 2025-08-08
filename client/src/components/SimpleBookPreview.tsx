import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLocation } from 'wouter';

interface BookPreviewProps {
  book: {
    id: string;
    title: string;
    author: string;
    coverImageUrl?: string | null;
    previewPageCount?: number | null;
  };
  isOpen: boolean;
  onClose: () => void;
}

const generateSimplePages = (book: any) => {
  
  const pages = [
    {
      id: 1,
      title: 'Cover',
      content: (
        <div className="flex flex-col items-center justify-center text-center bg-gradient-to-br from-orange-50 to-amber-50">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{book.title}</h1>
          <p className="text-xl text-gray-600 mb-8">by {book.author}</p>
          <div className="text-orange-600 font-semibold">PREVIEW EDITION</div>
          <div className="w-24 h-1 bg-orange-500 mx-auto mt-4"></div>
        </div>
      )
    },
    {
      id: 2,
      title: 'Table of Contents',
      content: (
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Table of Contents</h2>
          <div className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-700">Chapter 1: Introduction</span>
              <span className="text-gray-500">3</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-700">Chapter 2: Getting Started</span>
              <span className="text-gray-500">15</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-700">Chapter 3: Core Concepts</span>
              <span className="text-gray-500">28</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-700">Chapter 4: Advanced Techniques</span>
              <span className="text-gray-500">45</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-700">Chapter 5: Conclusion</span>
              <span className="text-gray-500">62</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: 'Chapter 1',
      content: (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Chapter 1: Introduction</h2>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 leading-relaxed mb-4">
              Welcome to this transformative journey that will revolutionize your understanding and approach. 
              This content has been carefully crafted to provide you with actionable insights and practical wisdom.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              In this chapter, you'll discover powerful strategies that successful individuals have used to 
              achieve remarkable results. These time-tested principles will help you unlock your potential 
              and create lasting positive change in your life.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Key concepts covered include:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Foundational principles for success</li>
              <li>Practical implementation strategies</li>
              <li>Common pitfalls and how to avoid them</li>
              <li>Real-world examples and case studies</li>
            </ul>
            <div className="mt-8 p-4 bg-orange-50 border-l-4 border-orange-400 rounded">
              <p className="text-sm text-orange-800">
                <strong>Preview Note:</strong> This is a sample of the full content. 
                Subscribe to access the complete book with detailed examples, exercises, and advanced concepts.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  // Add more sample pages based on previewPageCount
  const totalPages = book.previewPageCount || 5;
  for (let i = 4; i <= totalPages; i++) {
    pages.push({
      id: i,
      title: `Chapter ${i - 1}`,
      content: (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Chapter {i - 1}: Sample Content</h2>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 leading-relaxed mb-4">
              This is sample content for Chapter {i - 1}. In the full version, you would find detailed 
              explanations, practical exercises, and actionable insights that will help you achieve 
              your goals and transform your life.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              The complete chapter includes real-world examples, step-by-step guides, and proven 
              strategies that you can implement immediately.
            </p>
            <div className="mt-8 p-4 bg-orange-50 border-l-4 border-orange-400 rounded">
              <p className="text-sm text-orange-800">
                <strong>Preview Continues...</strong> Get full access to read the complete content.
              </p>
            </div>
          </div>
        </div>
      )
    });
  }

  return pages;
};

export default function SimpleBookPreview({ book, isOpen, onClose }: BookPreviewProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [pages] = useState(() => generateSimplePages(book));
  const [, setLocation] = useLocation();



  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        prevPage();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextPage();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isOpen, currentPage]);

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleStartReading = () => {
    onClose();
    setLocation(`/reader/${book.id}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full h-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{book.title}</h3>
            <p className="text-sm text-gray-600">Preview - {pages[currentPage]?.title}</p>
          </div>
          <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="relative bg-white flex-1 overflow-auto min-h-0">
          <div className="p-8 min-h-full">
            {pages[currentPage]?.content}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-4 bg-gray-50 border-t flex-shrink-0">
          <Button
            variant="outline"
            onClick={prevPage}
            disabled={currentPage === 0}
            className="flex items-center space-x-2 bg-white hover:bg-orange-50 border-orange-200"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 font-medium">
              {currentPage + 1} of {pages.length}
            </span>
            <div className="flex items-center space-x-2">
              {pages.map((_, i) => (
                <button
                  key={i}
                  className={`w-4 h-4 rounded-full transition-all duration-200 hover:scale-110 ${
                    i === currentPage ? 'bg-orange-500 shadow-md' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  onClick={() => setCurrentPage(i)}
                  title={`Go to page ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            onClick={nextPage}
            disabled={currentPage >= pages.length - 1}
            className="flex items-center space-x-2 bg-white hover:bg-orange-50 border-orange-200"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Call to Action */}
        <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-t flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Enjoying the preview? Get full access to continue reading.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Use arrow keys or buttons above to navigate pages
              </p>
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={onClose}>
                Close Preview
              </Button>
              <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleStartReading}>
                Start Reading
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}