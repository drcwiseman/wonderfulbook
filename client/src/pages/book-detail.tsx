import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Star, Bookmark, Book, ArrowLeft } from "lucide-react";
import type { Book as BookType, ReadingProgress, Bookmark as BookmarkType } from "@shared/schema";

export default function BookDetail() {
  const [, params] = useRoute("/book/:id");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(0);

  const { data: book, isLoading: bookLoading } = useQuery<BookType>({
    queryKey: ["/api/books", params?.id],
    enabled: !!params?.id,
  });

  const { data: progress } = useQuery<ReadingProgress>({
    queryKey: ["/api/reading-progress", params?.id],
    enabled: !!params?.id && isAuthenticated,
  });

  const { data: bookmarks } = useQuery<BookmarkType[]>({
    queryKey: ["/api/bookmarks"],
    enabled: !!params?.id && isAuthenticated,
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (progressData: any) => {
      return await apiRequest("POST", "/api/reading-progress", progressData);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to update reading progress",
        variant: "destructive",
      });
    },
  });

  const createBookmarkMutation = useMutation({
    mutationFn: async (bookmarkData: any) => {
      return await apiRequest("POST", "/api/bookmarks", bookmarkData);
    },
    onSuccess: () => {
      toast({
        title: "Bookmark Added",
        description: "Page bookmarked successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to create bookmark",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (progress) {
      setCurrentPage(progress.currentPage || 0);
    }
  }, [progress]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (book && isAuthenticated) {
      const totalPages = 100; // This would come from the PDF
      const progressPercentage = (page / totalPages) * 100;
      
      updateProgressMutation.mutate({
        bookId: book.id,
        currentPage: page,
        totalPages,
        progressPercentage: progressPercentage.toFixed(2),
      });
    }
  };

  const handleAddBookmark = () => {
    if (book && isAuthenticated) {
      createBookmarkMutation.mutate({
        bookId: book.id,
        page: currentPage,
        note: `Bookmark at page ${currentPage}`,
      });
    }
  };

  const canAccessBook = () => {
    if (!book || !user) return false;
    
    if (book.requiredTier === "free") return true;
    if ((user as any).subscriptionTier === "premium") return true;
    if ((user as any).subscriptionTier === "basic" && book.requiredTier !== "premium") return true;
    
    return false;
  };

  if (bookLoading) {
    return (
      <div className="min-h-screen bg-netflix-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-netflix-red border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-netflix-black flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <Book className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Book Not Found</h1>
              <p className="text-gray-600">The requested book could not be found.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canAccessBook()) {
    return (
      <div className="min-h-screen bg-netflix-black text-white">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="mb-6 text-white hover:text-netflix-red"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                <img
                  src={book.coverImageUrl || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400"}
                  alt={book.title}
                  className="w-full rounded-lg shadow-2xl"
                />
              </div>
              
              <div className="md:col-span-2">
                <h1 className="text-4xl font-bold mb-4">{book.title}</h1>
                <p className="text-xl text-gray-300 mb-4">by {book.author}</p>
                
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(Number(book.rating))
                            ? "text-yellow-400 fill-current"
                            : "text-gray-400"
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-gray-300">{book.rating}</span>
                  </div>
                  <Badge variant="secondary">{book.category}</Badge>
                </div>
                
                <p className="text-gray-300 mb-8 leading-relaxed">
                  {book.description}
                </p>
                
                <div className="bg-netflix-red/10 border-l-4 border-netflix-red p-6 rounded">
                  <h3 className="text-xl font-semibold mb-2 text-netflix-red">
                    {book.requiredTier === 'free' ? 'Login Required' : 'Upgrade Required'}
                  </h3>
                  <p className="text-gray-300 mb-4">
                    {book.requiredTier === 'free' 
                      ? 'Please log in to start reading this book for free.'
                      : `This book requires a ${book.requiredTier} subscription to access.`
                    }
                  </p>
                  <Button
                    onClick={() => window.location.href = book.requiredTier === 'free' ? '/api/login' : '/subscribe'}
                    className="bg-netflix-red hover:bg-red-700"
                  >
                    {book.requiredTier === 'free' ? 'Log In to Read' : 'Upgrade Now'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-netflix-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="text-white hover:text-netflix-red"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Button>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={handleAddBookmark}
              disabled={createBookmarkMutation.isPending}
              className="border-gray-600 text-white hover:bg-gray-800"
            >
              <Bookmark className="w-4 h-4 mr-2" />
              Bookmark
            </Button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Book Info Sidebar */}
            <div className="lg:col-span-1">
              <Card className="bg-netflix-gray border-gray-700">
                <CardContent className="p-6">
                  <img
                    src={book.coverImageUrl || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400"}
                    alt={book.title}
                    className="w-full rounded-lg mb-4"
                  />
                  
                  <h2 className="text-xl font-bold mb-2 text-white">{book.title}</h2>
                  <p className="text-gray-300 mb-4">by {book.author}</p>
                  
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(Number(book.rating))
                            ? "text-yellow-400 fill-current"
                            : "text-gray-400"
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-gray-300 text-sm">{book.rating}</span>
                  </div>

                  <Badge variant="secondary" className="mb-4">{book.category}</Badge>
                  
                  <Button 
                    onClick={() => setLocation(`/reader/${params?.id}`)}
                    className="w-full bg-netflix-red hover:bg-red-700 text-white mb-4"
                  >
                    Read Now
                  </Button>
                  
                  {progress && (
                    <>
                      <Separator className="my-4 bg-gray-600" />
                      <div>
                        <h3 className="font-semibold mb-2 text-white">Reading Progress</h3>
                        <p className="text-sm text-gray-300">
                          Page {progress.currentPage} of {progress.totalPages}
                        </p>
                        <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                          <div
                            className="bg-netflix-red h-2 rounded-full"
                            style={{ width: `${progress.progressPercentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {progress.progressPercentage}% complete
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* PDF Reader */}
            <div className="lg:col-span-3">
              <Card className="bg-netflix-gray border-gray-700">
                <CardContent className="p-6">
                  <div className="bg-white rounded-lg" style={{ minHeight: "600px" }}>
                    {/* This would contain the actual PDF viewer */}
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <Book className="w-16 h-16 mx-auto mb-4" />
                        <p className="text-lg font-semibold">PDF Reader</p>
                        <p className="text-sm">Page {currentPage + 1}</p>
                        <div className="mt-4 space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
                            disabled={currentPage === 0}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handlePageChange(currentPage + 1)}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
