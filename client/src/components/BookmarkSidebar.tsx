import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, 
  Bookmark, 
  Trash2,
  Plus,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Bookmark as BookmarkType } from '@shared/schema';

interface BookmarkSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  currentPage: number;
  onGoToPage: (page: number) => void;
}

export default function BookmarkSidebar({
  isOpen,
  onClose,
  bookId,
  currentPage,
  onGoToPage
}: BookmarkSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const { toast } = useToast();

  // Fetch bookmarks
  const { data: bookmarks = [], isLoading } = useQuery<BookmarkType[]>({
    queryKey: [`/api/bookmarks/${bookId}`],
    enabled: !!bookId,
  });

  // Add bookmark mutation
  const addBookmarkMutation = useMutation({
    mutationFn: async (data: { page: number; note?: string }) => {
      return await apiRequest('POST', '/api/bookmarks', {
        bookId,
        page: data.page,
        note: data.note || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bookmarks/${bookId}`] });
      setNoteInput('');
      toast({
        title: "Bookmark Added",
        description: `Page ${currentPage} bookmarked successfully`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add bookmark",
        variant: "destructive",
      });
    },
  });

  // Delete bookmark mutation
  const deleteBookmarkMutation = useMutation({
    mutationFn: async (bookmarkId: string) => {
      return await apiRequest('DELETE', `/api/bookmarks/${bookmarkId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bookmarks/${bookId}`] });
      toast({
        title: "Bookmark Removed",
        description: "Bookmark deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete bookmark",
        variant: "destructive",
      });
    },
  });

  const handleAddBookmark = () => {
    addBookmarkMutation.mutate({
      page: currentPage,
      note: noteInput.trim() || undefined,
    });
  };

  const handleDeleteBookmark = (bookmarkId: string) => {
    deleteBookmarkMutation.mutate(bookmarkId);
  };

  const handleGoToBookmark = (page: number) => {
    onGoToPage(page);
    onClose();
  };

  // Filter bookmarks based on search
  const filteredBookmarks = bookmarks.filter(bookmark =>
    bookmark.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bookmark.page.toString().includes(searchTerm)
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-80 max-w-[90vw] bg-white dark:bg-gray-900 shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Bookmark className="w-5 h-5 mr-2" />
                  Bookmarks
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-700 dark:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search bookmarks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Add New Bookmark */}
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Add note (optional)"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                />
                <Button
                  onClick={handleAddBookmark}
                  disabled={addBookmarkMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Bookmark Page {currentPage}
                </Button>
              </div>
            </div>

            {/* Bookmarks List */}
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading bookmarks...</p>
                </div>
              ) : filteredBookmarks.length === 0 ? (
                <div className="p-4 text-center">
                  <Bookmark className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'No bookmarks match your search' : 'No bookmarks yet'}
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {filteredBookmarks.map((bookmark) => (
                    <motion.div
                      key={bookmark.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => handleGoToBookmark(bookmark.page)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Bookmark className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              Page {bookmark.page}
                            </span>
                          </div>
                          {bookmark.note && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                              {bookmark.note}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {bookmark.createdAt ? new Date(bookmark.createdAt).toLocaleDateString() : 'Recently added'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBookmark(bookmark.id);
                          }}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}