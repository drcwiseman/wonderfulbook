import React, { useEffect, useState } from "react";
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
import { Star, Bookmark, Book, ArrowLeft, Home, Library, BookOpen } from "lucide-react";
import type { Book as BookType, ReadingProgress, Bookmark as BookmarkType } from "@shared/schema";
import { SEOHead, getBookSEO } from "@/components/SEOHead";
import PageHeader from "@/components/PageHeader";
import Header from "@/components/Header";
import SocialShareButtons from "@/components/SocialShareButtons";

export default function BookDetailOld() {
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
          window.location.href = "/auth/login";
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
          window.location.href = "/auth/login";
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
    
    // Allow access for free tier books
    if (book.requiredTier === "free") return true;
    
    // Allow access for premium subscribers
    if ((user as any).subscriptionTier === "premium") return true;
    
    // Allow access for basic subscribers to basic books
    if ((user as any).subscriptionTier === "basic" && book.requiredTier !== "premium") return true;
    
    // Allow access for active free trial users regardless of book tier
    const subscriptionStatus = (user as any).subscriptionStatus;
    const freeTrialEndedAt = (user as any).freeTrialEndedAt;
    const isInFreeTrial = (user as any).subscriptionTier === "free" && 
                         subscriptionStatus === "active" && 
                         freeTrialEndedAt && 
                         new Date(freeTrialEndedAt) > new Date();
    
    if (isInFreeTrial) return true;
    
    return false;
  };

  if (bookLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
          <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full" />
        </div>
      </>
    );
  }

  if (!book) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
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
      </>
    );
  }

  if (!canAccessBook()) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 text-gray-900 pt-20">
          <PageHeader 
            title="Upgrade Required"
            subtitle="This book requires a higher subscription tier"
            breadcrumbs={[
              { label: "Home", href: "/", icon: Home },
              { label: "Library", href: "/library", icon: Library },
              { label: book.title, icon: BookOpen }
            ]}
            backButtonLabel="Back to Library"
            backButtonHref="/library"
          />
          <div className="container mx-auto px-4 py-8">
          
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
                  <Badge variant="secondary">{book.requiredTier || 'free'}</Badge>
                </div>
                
                <p className="text-gray-300 mb-8 leading-relaxed">
                  {book.description}
                </p>
                
                <div className="bg-orange-50 border-l-4 border-orange-600 p-6 rounded">
                  <h3 className="text-xl font-semibold mb-2 text-orange-600">Upgrade Required</h3>
                  <p className="text-gray-300 mb-4">
                    This book requires a {book.requiredTier} subscription to access.
                  </p>
                  <Button
                    onClick={() => window.location.href = "/subscribe"}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Upgrade Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 text-gray-900 pt-20">
        {book && <SEOHead {...getBookSEO(book)} />}
        <PageHeader 
          title={book.title}
          subtitle={`by ${book.author}`}
          breadcrumbs={[
            { label: "Home", href: "/", icon: Home },
            { label: "Library", href: "/library", icon: Library },
            { label: book.title, icon: BookOpen }
          ]}
          backButtonLabel="Back to Library"
          backButtonHref="/library"
          actions={
            <Button
              variant="outline"
              onClick={handleAddBookmark}
              disabled={createBookmarkMutation.isPending}
              className="border-gray-600 text-gray-900 hover:bg-gray-100"
            >
              <Bookmark className="w-4 h-4 mr-2" />
              Bookmark
            </Button>
          }
        />
        <div className="container mx-auto px-4 py-8">

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Book Info Sidebar */}
            <div className="lg:col-span-1">
              <Card className="bg-white border-gray-200">
                <CardContent className="p-6">
                  <img
                    src={book.coverImageUrl || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400"}
                    alt={book.title}
                    className="w-full rounded-lg mb-4"
                  />
                  
                  <h2 className="text-xl font-bold mb-2 text-gray-900">{book.title}</h2>
                  <p className="text-gray-600 mb-4">by {book.author}</p>
                  
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
                    <span className="ml-2 text-gray-600 text-sm">{book.rating}</span>
                  </div>

                  <Badge variant="secondary" className="mb-4">Fiction</Badge>

                  {/* Social Share Section */}
                  <SocialShareButtons
                    bookTitle={book.title}
                    bookAuthor={book.author}
                    bookDescription={book.description || ''}
                    bookUrl={window.location.href}
                    bookCover={book.coverImageUrl || ''}
                    className="mb-4"
                    compact={true}
                  />
                  
                  <Button 
                    onClick={() => setLocation(`/reader/${params?.id}`)}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white mb-4 font-semibold"
                    size="lg"
                  >
                    Read Now
                  </Button>
                  
                  {progress && (
                    <>
                      <Separator className="my-4 bg-gray-600" />
                      <div>
                        <h3 className="font-semibold mb-2 text-gray-900">Reading Progress</h3>
                        <p className="text-sm text-gray-600">
                          Page {progress.currentPage} of {progress.totalPages}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-orange-600 h-2 rounded-full"
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

            {/* Book Preview */}
            <div className="lg:col-span-3">
              <Card className="bg-white border-gray-200">
                <CardContent className="p-6">
                  <div 
                    className="bg-gradient-to-br from-orange-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-lg border-2 border-dashed border-orange-200 dark:border-gray-600 cursor-pointer hover:border-orange-400 dark:hover:border-orange-500 transition-colors" 
                    style={{ minHeight: "600px" }}
                    onClick={() => setLocation(`/reader/${params?.id}`)}
                  >
                    <div className="flex items-center justify-center h-full text-center">
                      <div>
                        <div className="bg-orange-100 dark:bg-orange-900/20 rounded-full p-6 mx-auto mb-6 w-24 h-24 flex items-center justify-center">
                          <Book className="w-12 h-12 text-orange-600 dark:text-orange-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                          {book.title}
                        </h3>
                        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                          Click to start reading in our premium reader
                        </p>
                        <Button 
                          size="lg"
                          className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 text-lg font-semibold"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/reader/${params?.id}`);
                          }}
                        >
                          Open Book Reader
                        </Button>
                        {progress && (
                          <div className="mt-6 max-w-sm mx-auto">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                              Continue reading from page {progress.currentPage}
                            </p>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-orange-600 h-2 rounded-full"
                                style={{ width: `${progress.progressPercentage}%` }}
                              />
                            </div>
                          </div>
                        )}
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
