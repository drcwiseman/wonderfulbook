import { useEffect, useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Star, 
  Book, 
  ArrowLeft, 
  Clock, 
  User, 
  BookOpen, 
  Crown, 
  Zap,
  ChevronRight,
  Calendar,
  Target,
  Users,
  ThumbsUp,
  ThumbsDown,
  MessageSquare
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AccessibleContent from "@/components/AccessibleContent";
import SimpleBookPreview from "@/components/SimpleBookPreview";
import type { Book as BookType, BookReview } from "@shared/schema";
import { SEOHead, getBookSEO } from "@/components/SEOHead";

interface ReviewWithUser extends BookReview {
  user: {
    firstName: string;
    lastName: string;
  };
}

export default function BookDetail() {
  const [, params] = useRoute("/book/:id");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { data: book, isLoading: bookLoading } = useQuery<BookType>({
    queryKey: ["/api/books", params?.id],
    enabled: !!params?.id,
  });

  const { data: reviews = [] } = useQuery<ReviewWithUser[]>({
    queryKey: ["/api/books", params?.id, "reviews"],
    enabled: !!params?.id,
  });

  const hasActiveSubscription = () => {
    if (!user) return false;
    return (user as any).subscriptionTier !== "free" && (user as any).subscriptionStatus === "active";
  };

  const canAccessFullContent = () => {
    if (!book || !user) return false;
    
    if (book.requiredTier === "free") return true;
    if ((user as any).subscriptionTier === "premium") return true;
    if ((user as any).subscriptionTier === "basic" && book.requiredTier !== "premium") return true;
    
    return false;
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : "text-gray-300"
        }`}
      />
    ));
  };

  if (bookLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="text-center">
                <Book className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Book Not Found</h1>
                <p className="text-gray-600">The requested book could not be found.</p>
                <Button asChild className="mt-4">
                  <Link href="/bookstore">Browse All Books</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <SEOHead {...getBookSEO(book)} />
      <div className="min-h-screen bg-white">
        <Header />
        
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 py-12">
          <div className="container mx-auto px-4">
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="mb-6 text-orange-600 hover:text-orange-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Books
            </Button>
            
            <div className="grid lg:grid-cols-5 gap-8">
              {/* Book Cover */}
              <div className="lg:col-span-2">
                <div className="sticky top-8">
                  <img
                    src={book.coverImageUrl || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600"}
                    alt={book.title}
                    className="w-full max-w-sm mx-auto rounded-xl shadow-2xl"
                  />
                  
                  {/* Action Buttons */}
                  <div className="mt-6 space-y-3">
                    {canAccessFullContent() ? (
                      <div className="space-y-3">
                        <Button asChild className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-lg py-3">
                          <Link href={`/reader/${book.id}`}>
                            <BookOpen className="w-5 h-5 mr-2" />
                            Start Reading
                          </Link>
                        </Button>
                        
                        {/* Always show preview for all users */}
                        {book.previewPageCount && book.previewPageCount > 0 && (
                          <Button 
                            variant="outline" 
                            className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
                            onClick={() => setIsPreviewOpen(true)}
                          >
                            <Book className="w-4 h-4 mr-2" />
                            Interactive Preview ({book.previewPageCount} pages)
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {hasActiveSubscription() ? (
                          <Button asChild className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-lg py-3">
                            <Link href="/book-selection">
                              <Target className="w-5 h-5 mr-2" />
                              Select This Book
                            </Link>
                          </Button>
                        ) : (
                          <Button asChild className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-lg py-3">
                            <Link href="/subscribe">
                              <Crown className="w-5 h-5 mr-2" />
                              Start Free Trial
                            </Link>
                          </Button>
                        )}
                        
                        {/* Always show preview for all users */}
                        {book.previewPageCount && book.previewPageCount > 0 && (
                          <Button 
                            variant="outline" 
                            className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
                            onClick={() => setIsPreviewOpen(true)}
                          >
                            <Book className="w-4 h-4 mr-2" />
                            Interactive Preview ({book.previewPageCount} pages)
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Book Information */}
              <div className="lg:col-span-3 space-y-6">
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">{book.title}</h1>
                  <p className="text-xl text-gray-600 mb-4">by {book.author}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="flex items-center">
                      {renderStars(Number(book.rating))}
                      <span className="ml-2 text-gray-600 font-medium">{book.rating} ({book.totalRatings} ratings)</span>
                    </div>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                      {book.requiredTier === "free" ? "Free" : book.requiredTier}
                    </Badge>
                    {book.pageCount && (
                      <div className="flex items-center text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {book.pageCount} pages
                      </div>
                    )}
                  </div>
                  
                  <div className="text-gray-700 text-lg leading-relaxed prose dark:prose-invert max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: book.description || '' }} />
                  </div>
                </div>

                {/* Subscription Gate */}
                {!canAccessFullContent() && (
                  <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="bg-orange-100 p-3 rounded-full">
                          <Crown className="w-6 h-6 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {hasActiveSubscription() ? "Select This Book" : "Premium Content"}
                          </h3>
                          <p className="text-gray-700 mb-4">
                            {hasActiveSubscription() 
                              ? "This book is available with your subscription. Add it to your reading list to start reading."
                              : "This book requires a premium subscription. Start your free trial to access our complete library."
                            }
                          </p>
                          <Button asChild className="btn-orange-accessible">
                            <Link href={hasActiveSubscription() ? "/book-selection" : "/subscribe"}>
                              <Zap className="w-4 h-4 mr-2" />
                              {hasActiveSubscription() ? "Add to Library" : "Start Free Trial"}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="container mx-auto px-4 py-12">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="contents">Contents</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({book.totalReviews || 0})</TabsTrigger>
              <TabsTrigger value="about">About Author</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-8">
              {/* Book Details */}
              <div className="grid md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="w-5 h-5 mr-2 text-orange-600" />
                      What You'll Learn
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {book.keyTakeaways && book.keyTakeaways.length > 0 ? (
                      <ul className="space-y-2">
                        {book.keyTakeaways.map((takeaway, index) => (
                          <li key={index} className="flex items-start">
                            <ChevronRight className="w-4 h-4 mt-0.5 mr-2 text-orange-500 flex-shrink-0" />
                            <span className="text-gray-700">{takeaway}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-600">Key takeaways will be displayed here.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="w-5 h-5 mr-2 text-orange-600" />
                      Perfect For
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">
                      {book.targetAudience || "Readers interested in personal growth and professional development."}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="outline">Leadership</Badge>
                      <Badge variant="outline">Personal Growth</Badge>
                      <Badge variant="outline">Business</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Extended Description */}
              {book.longDescription && (
                <Card>
                  <CardHeader>
                    <CardTitle>About This Book</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-gray max-w-none">
                      <div className="text-gray-700 leading-relaxed prose dark:prose-invert max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: book.longDescription || '' }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="contents">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Book className="w-5 h-5 mr-2 text-orange-600" />
                    Table of Contents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {book.tableOfContents && book.tableOfContents.length > 0 ? (
                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        {book.tableOfContents.map((chapter, index) => (
                          <div key={index} className="flex items-center py-2 border-b border-gray-100 last:border-0">
                            <span className="text-sm text-gray-500 w-8">
                              {index + 1}.
                            </span>
                            <span className="text-gray-700 flex-1">{chapter}</span>
                            {!canAccessFullContent() && (
                              <Badge variant="outline" className="text-xs">Premium</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <p className="text-gray-600">Table of contents will be displayed here.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews">
              <div className="space-y-6">
                {/* Review Summary */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-gray-900 mb-2">{book.rating}</div>
                        <div className="flex justify-center mb-2">
                          {renderStars(Number(book.rating))}
                        </div>
                        <p className="text-gray-600">{book.totalRatings} ratings</p>
                      </div>
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((stars) => (
                          <div key={stars} className="flex items-center">
                            <span className="text-sm text-gray-600 w-8">{stars}</span>
                            <Star className="w-4 h-4 text-yellow-400 fill-current mr-2" />
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-yellow-400 h-2 rounded-full" 
                                style={{ width: `${Math.random() * 80 + 20}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start space-x-4">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="font-medium text-gray-900">
                                  {review.user?.firstName} {review.user?.lastName?.charAt(0)}.
                                </span>
                                <div className="flex">
                                  {renderStars(review.rating)}
                                </div>
                                {review.isVerifiedPurchase && (
                                  <Badge variant="outline" className="text-xs">Verified</Badge>
                                )}
                              </div>
                              {review.reviewTitle && (
                                <h4 className="font-semibold text-gray-900 mb-2">{review.reviewTitle}</h4>
                              )}
                              <p className="text-gray-700 mb-3">{review.reviewText}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}</span>
                                <button className="flex items-center space-x-1 hover:text-gray-700">
                                  <ThumbsUp className="w-4 h-4" />
                                  <span>Helpful ({review.helpfulVotes})</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center text-gray-500">
                          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No reviews yet. Be the first to review this book!</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="about">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2 text-orange-600" />
                    About {book.author}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed">
                      {book.authorBio || `${book.author} is a renowned author and thought leader in the field of personal development and professional growth.`}
                    </p>
                    
                    {book.publishedYear && (
                      <div className="mt-6 flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Published in {book.publishedYear}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <Footer />
      </div>
      
      {/* Book Preview Modal */}
      {book && (
        <SimpleBookPreview
          book={book}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </>
  );
}