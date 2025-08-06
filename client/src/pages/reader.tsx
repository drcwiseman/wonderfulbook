import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import AppleBooksPDFViewer from '@/components/AppleBooksPDFViewer';
import type { Book } from '@shared/schema';

export default function ReaderPage() {
  const [, paramsReader] = useRoute('/reader/:bookId');
  const [, paramsRead] = useRoute('/read/:bookId');
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  const bookId = paramsReader?.bookId || paramsRead?.bookId;

  // Fetch book details
  const { data: book, isLoading: bookLoading } = useQuery<Book>({
    queryKey: [`/api/books/${bookId}`],
    enabled: !!bookId,
  });

  // Load PDF with proper blob handling
  useEffect(() => {
    let isCancelled = false;

    const loadPdf = async () => {
      if (!bookId || !isAuthenticated || authLoading || pdfUrl) {
        return;
      }

      setIsLoadingPdf(true);
      try {
        const response = await fetch(`/api/stream/${bookId}`, {
          credentials: 'include',
        });

        if (isCancelled) return;

        if (!response.ok) {
          if (response.status === 401) {
            toast({
              title: "Session Expired",
              description: "Please log in again to continue reading.",
              variant: "destructive",
            });
            setTimeout(() => {
              window.location.href = "/api/login";
            }, 1000);
            return;
          }
          if (response.status === 403) {
            const errorData = await response.json();
            setAccessError(errorData.message || 'Access denied. Please upgrade your subscription.');
            return;
          }
          throw new Error(`Failed to load PDF: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        if (isCancelled) return;

        // Create blob URL for PDF.js
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        setAccessError(null);
      } catch (error) {
        if (isCancelled) return;
        console.error('Error loading PDF:', error);
        setAccessError('Failed to load the book. Please try again.');
      } finally {
        if (!isCancelled) {
          setIsLoadingPdf(false);
        }
      }
    };

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [bookId, isAuthenticated, authLoading, toast, pdfUrl]);

  // Cleanup PDF URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  // Security: Disable right-click, F12, and other shortcuts
  useEffect(() => {
    const disableRightClick = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const disableKeyShortcuts = (e: KeyboardEvent) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S, Ctrl+P, etc.
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 's') ||
        (e.ctrlKey && e.key === 'p') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.key === 'a')
      ) {
        e.preventDefault();
        return false;
      }
    };

    const disableSelection = () => {
      document.onselectstart = () => false;
      document.ondragstart = () => false;
    };

    document.addEventListener('contextmenu', disableRightClick);
    document.addEventListener('keydown', disableKeyShortcuts);
    disableSelection();

    return () => {
      document.removeEventListener('contextmenu', disableRightClick);
      document.removeEventListener('keydown', disableKeyShortcuts);
      document.onselectstart = null;
      document.ondragstart = null;
    };
  }, []);

  if (authLoading || bookLoading || isLoadingPdf) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-gray-900 dark:text-white">Loading your book...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Book Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">The book you're looking for doesn't exist or has been removed.</p>
          <Button
            onClick={() => setLocation('/')}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  if (accessError) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center max-w-md px-6">
          <Lock className="w-16 h-16 mx-auto mb-6 text-yellow-500" />
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Access Required</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{accessError}</p>
          <div className="space-y-4">
            <Button
              onClick={() => setLocation('/subscribe')}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              Upgrade Subscription
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation('/')}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Library
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-gray-900 dark:text-white">Loading your book...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
      <AppleBooksPDFViewer 
        book={book} 
        pdfUrl={pdfUrl} 
        bookId={bookId || ''} 
      />
    </div>
  );
}