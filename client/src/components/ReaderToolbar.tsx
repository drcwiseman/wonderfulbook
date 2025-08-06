import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Bookmark, 
  BookmarkCheck,
  ZoomIn, 
  ZoomOut,
  Menu,
  Moon,
  Sun,
  BookOpen,
  Scroll
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import type { Book } from '@shared/schema';

interface ReaderToolbarProps {
  book: Book;
  currentPage: number;
  totalPages: number;
  isBookmarked: boolean;
  showToolbars: boolean;
  isScrollMode: boolean;
  isDarkMode: boolean;
  onBack: () => void;
  onToggleBookmark: () => void;
  onGoToPage: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleScrollMode: () => void;
  onToggleDarkMode: () => void;
  onToggleSidebar: () => void;
}

export default function ReaderToolbar({
  book,
  currentPage,
  totalPages,
  isBookmarked,
  showToolbars,
  isScrollMode,
  isDarkMode,
  onBack,
  onToggleBookmark,
  onGoToPage,
  onZoomIn,
  onZoomOut,
  onToggleScrollMode,
  onToggleDarkMode,
  onToggleSidebar
}: ReaderToolbarProps) {
  const [pageInput, setPageInput] = useState('');
  const { toast } = useToast();

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(pageInput);
    if (page >= 1 && page <= totalPages) {
      onGoToPage(page);
      setPageInput('');
    } else {
      toast({
        title: "Invalid Page",
        description: `Please enter a page between 1 and ${totalPages}`,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Top Toolbar */}
      <AnimatePresence>
        {showToolbars && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 left-0 right-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <div className="flex items-center justify-between p-4">
              {/* Left - Back Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Library
              </Button>

              {/* Center - Book Info & Page Input */}
              <div className="flex-1 flex items-center justify-center space-x-4 max-w-md mx-4">
                <div className="text-center flex-shrink-0">
                  <h1 className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-32 sm:max-w-48">
                    {book.title}
                  </h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-32 sm:max-w-48">
                    {book.author}
                  </p>
                </div>

                {/* Page Input */}
                <form onSubmit={handlePageSubmit} className="flex items-center space-x-2">
                  <Input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    placeholder={currentPage.toString()}
                    className="w-16 h-8 text-center text-sm"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    / {totalPages}
                  </span>
                </form>
              </div>

              {/* Right - Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleSidebar}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Menu className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Toolbar */}
      <AnimatePresence>
        {showToolbars && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <div className="flex items-center justify-between p-4">
              {/* Left - Bookmark */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleBookmark}
                className={`${
                  isBookmarked 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'text-gray-700 dark:text-gray-300'
                } hover:bg-gray-100 dark:hover:bg-gray-800`}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="w-4 h-4" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
              </Button>

              {/* Center - Page Navigation & Controls */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onZoomOut}
                  className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>

                <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg px-2 py-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onGoToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30"
                  >
                    ←
                  </Button>
                  <span className="text-xs text-gray-600 dark:text-gray-300 mx-2 min-w-12 text-center">
                    {currentPage}/{totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onGoToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30"
                  >
                    →
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleScrollMode}
                  className={`${
                    isScrollMode 
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                      : 'text-gray-700 dark:text-gray-300'
                  } hover:bg-gray-100 dark:hover:bg-gray-800`}
                  title={isScrollMode ? "Switch to Page Mode" : "Switch to Scroll Mode"}
                >
                  {isScrollMode ? (
                    <Scroll className="w-4 h-4" />
                  ) : (
                    <BookOpen className="w-4 h-4" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onZoomIn}
                  className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>

              {/* Right - Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleDarkMode}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}