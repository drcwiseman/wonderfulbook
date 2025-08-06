import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Bookmark, 
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Menu,
  Moon,
  Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import type { Book } from '@shared/schema';

interface FlipPageToolbarProps {
  book: Book;
  currentPage: number;
  totalPages: number;
  isBookmarked: boolean;
  showToolbars: boolean;
  isDarkMode: boolean;
  onBack: () => void;
  onToggleBookmark: () => void;
  onGoToPage: (page: number) => void;
  onToggleDarkMode: () => void;
  onToggleSidebar: () => void;
}

export default function FlipPageToolbar({
  book,
  currentPage,
  totalPages,
  isBookmarked,
  showToolbars,
  isDarkMode,
  onBack,
  onToggleBookmark,
  onGoToPage,
  onToggleDarkMode,
  onToggleSidebar
}: FlipPageToolbarProps) {
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

  const goToPrevPage = () => {
    if (currentPage > 1) {
      onGoToPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      onGoToPage(currentPage + 1);
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
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute top-0 left-0 right-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <div className="flex items-center justify-between p-4">
              {/* Left - Back Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="flex items-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Library</span>
              </Button>

              {/* Center - Book Info */}
              <div className="flex-1 text-center px-4">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {book.title}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  by {book.author}
                </p>
              </div>

              {/* Right - Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleSidebar}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <div className="flex items-center justify-between p-4">
              {/* Left - Bookmark */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleBookmark}
                  className={`${
                    isBookmarked 
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' 
                      : 'text-gray-700 dark:text-gray-300'
                  } hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="w-5 h-5" />
                  ) : (
                    <Bookmark className="w-5 h-5" />
                  )}
                </Button>
              </div>

              {/* Center - Page Navigation */}
              <div className="flex items-center space-x-4">
                {/* Previous Page Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToPrevPage}
                  disabled={currentPage <= 1}
                  className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>

                {/* Page Input */}
                <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                  <form onSubmit={handlePageSubmit} className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={pageInput}
                      onChange={(e) => setPageInput(e.target.value)}
                      placeholder={currentPage.toString()}
                      className="w-16 h-8 text-center text-sm bg-transparent border-none shadow-none focus:ring-0 focus:outline-none"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                      / {totalPages}
                    </span>
                  </form>
                </div>

                {/* Next Page Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage >= totalPages}
                  className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              {/* Right - Dark Mode Toggle */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleDarkMode}
                  className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}