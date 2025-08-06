import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { PremiumPDFReader } from "@/components/PremiumPDFReader";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function ReaderPage() {
  const { bookId } = useParams();
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  // Fetch book details
  const { data: book, isLoading: bookLoading } = useQuery({
    queryKey: ['/api/books', bookId],
    enabled: !!bookId,
  });

  // Fetch bookmarks
  const { data: bookmarks = [], refetch: refetchBookmarks } = useQuery({
    queryKey: ['/api/bookmarks', bookId],
    enabled: !!bookId && !!isAuthenticated,
  });

  // Fetch reading progress
  const { data: progress } = useQuery({
    queryKey: ['/api/progress', bookId],
    enabled: !!bookId && !!isAuthenticated,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You need to be logged in to read books",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation('/');
      }, 1000);
      return;
    }
  }, [isAuthenticated, setLocation, toast]);

  // Handle loading state
  if (!bookId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Book not found</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">The requested book could not be loaded.</p>
        </div>
      </div>
    );
  }

  if (bookLoading || !book) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading book...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Please log in to read this book.</p>
        </div>
      </div>
    );
  }

  // Get initial page from progress
  const initialPage = progress && typeof progress === 'object' 
    ? (progress as any).currentPage || (progress as any).lastPage || 1 
    : 1;

  // Handle page changes - save progress
  const handlePageChange = (page: number, totalPages: number) => {
    // Progress is automatically saved by the PremiumPDFReader component
    console.log(`Page changed to ${page} of ${totalPages}`);
  };

  return (
    <PremiumPDFReader
      bookId={bookId}
      bookTitle={book.title}
      initialPage={initialPage}
      onPageChange={handlePageChange}
      bookmarks={Array.isArray(bookmarks) ? bookmarks : []}
    />
  );
}