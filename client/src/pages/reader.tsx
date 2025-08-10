import React from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { SimplePDFReader } from "@/components/SimplePDFReader";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

export default function ReaderPage() {
  const { bookId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isLoading: authLoading, isAuthenticated, user } = useAuth();

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

  // Redirect if not authenticated - but only after loading is done
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You need to be logged in to read books. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 1500);
      return;
    }
  }, [authLoading, isAuthenticated, setLocation, toast]);

  // Handle loading state
  if (!bookId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 safe-area-top safe-area-bottom">
        <div className="text-center px-4">
          <h1 className="text-responsive-xl font-semibold text-gray-900 dark:text-white">Book not found</h1>
          <p className="text-responsive-base text-gray-600 dark:text-gray-400 mt-2">The requested book could not be loaded.</p>
        </div>
      </div>
    );
  }

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Checking authentication...</p>
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
    <main id="main-content" className="pdf-viewer book-content" role="main" aria-label="Book Reader">
      <SimplePDFReader
        pdfUrl={`/api/stream-pdf/${bookId}`}
        bookTitle={(book as any)?.title || 'Unknown Book'}
        onClose={() => setLocation('/dashboard')}
      />
    </main>
  );
}