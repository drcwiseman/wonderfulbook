import { useEffect, useState, useCallback } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import type { Book } from '@shared/schema';

// Import CSS
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

export default function ReaderPage() {
  const [, params] = useRoute('/reader/:bookId');
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  const bookId = params?.bookId;

  // Fetch book details
  const { data: book, isLoading: bookLoading } = useQuery<Book>({
    queryKey: [`/api/books/${bookId}`],
    enabled: !!bookId,
  });

  // Simple check for authentication and set ready state
  useEffect(() => {
    if (bookId && isAuthenticated && !authLoading) {
      // Skip blob creation, just set pdfUrl to indicate ready
      setPdfUrl('ready');
      setAccessError(null);
      setIsLoadingPdf(false);
    }
  }, [bookId, isAuthenticated, authLoading]);

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

  // Configure PDF viewer with security options
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => [
      // Keep only the thumbnail and bookmark tabs
      ...defaultTabs.filter((tab: any) => 
        tab.id !== 'download' && 
        tab.id !== 'print'
      ),
    ],
  });

  if (authLoading || bookLoading || isLoadingPdf) {
    return (
      <div className="min-h-screen bg-netflix-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin w-8 h-8 border-4 border-netflix-red border-t-transparent rounded-full mx-auto mb-4" />
          <p>{isLoadingPdf ? 'Loading your book...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (accessError) {
    return (
      <div className="min-h-screen bg-netflix-black text-white">
        <div className="container mx-auto px-4 py-8">
          <Button
            onClick={() => setLocation('/')}
            className="mb-6 bg-gray-800 hover:bg-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="flex flex-col items-center justify-center text-center py-20">
            <div className="bg-gray-900 p-8 rounded-lg max-w-md">
              <AlertCircle className="h-16 w-16 text-netflix-red mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Access Restricted</h2>
              <p className="text-gray-300 mb-6">{accessError}</p>
              
              {accessError.includes('upgrade') && (
                <Button
                  onClick={() => setLocation('/#pricing')}
                  className="bg-netflix-red hover:bg-red-700"
                >
                  View Subscription Plans
                </Button>
              )}
              
              {accessError.includes('log in') && (
                <Button
                  onClick={() => window.location.href = '/api/login'}
                  className="bg-netflix-red hover:bg-red-700"
                >
                  Log In
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-netflix-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Book Not Found</h2>
          <Button onClick={() => setLocation('/')}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-netflix-black">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setLocation('/')}
              variant="ghost"
              className="text-white hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Library
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-white">{book.title}</h1>
              <p className="text-sm text-gray-400">by {book.author}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Lock className="h-4 w-4" />
            <span>Secure Reading</span>
          </div>
        </div>
      </div>

      {/* PDF Reader */}
      <div className="h-[calc(100vh-80px)]">
        {pdfUrl ? (
          <div className="h-full bg-gray-100 flex flex-col">
            <div className="p-4 bg-gray-800 text-white text-center">
              <h2 className="text-lg font-semibold">{book.title}</h2>
              <p className="text-sm text-gray-300">by {book.author}</p>
            </div>
            <div className="flex-1 relative">
              {/* Try multiple approaches for maximum compatibility */}
              <object
                data={`/api/stream/${bookId}#toolbar=0&navpanes=0&scrollbar=0`}
                type="application/pdf"
                className="w-full h-full absolute inset-0"
              >
                <iframe
                  src={`/api/stream/${bookId}#toolbar=0&navpanes=0&scrollbar=0`}
                  className="w-full h-full absolute inset-0"
                  title={`${book.title} - PDF Reader`}
                >
                  <div className="flex items-center justify-center h-full text-gray-600">
                    <div className="text-center">
                      <p className="mb-4">PDF could not be displayed in browser.</p>
                      <a 
                        href={`/api/stream/${bookId}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open Book in New Tab
                      </a>
                    </div>
                  </div>
                </iframe>
              </object>
            </div>
          </div>
        ) : !accessError ? (
          <div className="flex items-center justify-center h-full text-white">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-netflix-red border-t-transparent rounded-full mx-auto mb-4" />
              <p>Loading your book...</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}