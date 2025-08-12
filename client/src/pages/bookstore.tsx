import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Star, 
  Lock, 
  Crown, 
  Zap, 
  Grid3x3,
  List,
  BookOpen,
  Award,
  Clock,
  Download,
  Plus,
  Home,
  ArrowLeft,
  BarChart3
} from "lucide-react";
import { Book } from "@shared/schema";
import { SEOHead, seoConfigs } from "@/components/SEOHead";
import { BookCollectionStructuredData } from "@/components/BookStructuredData";
import BookCoverImage from "@/components/BookCoverImage";
import PageHeader from "@/components/PageHeader";
import UserNavigationHelper from "@/components/UserNavigationHelper";

interface BookWithAccess extends Book {
  hasAccess: boolean;
  accessReason?: string;
  tier?: string;
}

// Helper functions
const getTierIcon = (tier: string) => {
  switch (tier) {
    case 'premium':
      return <Crown className="w-4 h-4 text-orange-500" />;
    case 'basic':
      return <Zap className="w-4 h-4 text-orange-400" />;
    default:
      return <BookOpen className="w-4 h-4 text-gray-500" />;
  }
};

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'premium':
      return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white';
    case 'basic':
      return 'bg-orange-400 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

export default function Bookstore() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: books = [], isLoading } = useQuery<Book[]>({
    queryKey: ["/api/books"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Determine user's subscription tier and access
  const userTier = (user as any)?.subscription?.tier || 'free';
  const isTrialActive = (user as any)?.subscription?.trialEndsAt && new Date((user as any).subscription.trialEndsAt) > new Date();
  
  const booksWithAccess: BookWithAccess[] = books.map(book => {
    let hasAccess = false;
    let accessReason = '';

    const bookTier = (book as any).tier || 'free';

    if (bookTier === 'free') {
      hasAccess = true;
    } else if (isTrialActive) {
      hasAccess = true;
      accessReason = 'Available during trial';
    } else if (bookTier === 'basic' && ['basic', 'premium'].includes(userTier)) {
      hasAccess = true;
    } else if (bookTier === 'premium' && userTier === 'premium') {
      hasAccess = true;
    } else {
      hasAccess = false;
      accessReason = `Requires ${bookTier?.charAt(0).toUpperCase() + bookTier?.slice(1)} subscription`;
    }

    return { ...book, hasAccess, accessReason, tier: bookTier };
  });

  // Filtering and sorting logic
  const filteredBooks = booksWithAccess
    .filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           book.author.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return parseFloat(b.rating || '0') - parseFloat(a.rating || '0');
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return a.author.localeCompare(b.author);
        case 'newest':
          return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
        default: // featured
          return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      }
    });

  const featuredBooks = filteredBooks.filter(book => book.isFeatured);
  const newReleases = filteredBooks.slice(0, 6);
  const topRated = filteredBooks.filter(book => parseFloat(book.rating || '0') > 4.0);

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-orange-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading book store...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead {...seoConfigs.bookstore} />
      <BookCollectionStructuredData 
        books={filteredBooks}
        collectionName="Wonderful Books Digital Bookstore"
        collectionUrl="https://mywonderfulbooks.com/bookstore"
      />
      <div className="min-h-screen bg-gradient-to-b from-white to-orange-50/30 pt-20">
        <PageHeader 
          title="Book Store"
          subtitle={`Discover transformational books curated for your personal growth journey`}
          breadcrumbs={[
            { label: "Home", href: "/", icon: Home },
            { label: "Book Store", icon: BookOpen }
          ]}
          backButtonLabel="Back to Home"
          backButtonHref="/"
          actions={
            <div className="flex items-center space-x-4">
              {isAuthenticated && (
                <Button 
                  onClick={() => window.location.href = '/dashboard'} 
                  variant="outline" 
                  className="border-orange-500 text-orange-600 hover:bg-orange-50"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  My Dashboard
                </Button>
              )}
              <div className="text-sm text-gray-600">
                {books.length} books available
              </div>
            </div>
          }
        />

        {/* Search and Filters Section */}
        <section className="relative py-8 px-6">
          <div className="container mx-auto max-w-7xl">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search books by title or author..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-white border-orange-200 focus:border-orange-500"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className="h-12 w-12"
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className="h-12 w-12"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Sort Controls */}
            <div className="mb-8 flex justify-center">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-orange-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:border-orange-500"
              >
                <option value="featured">Featured</option>
                <option value="rating">Highest Rated</option>
                <option value="title">Title A-Z</option>
                <option value="author">Author A-Z</option>
                <option value="newest">Newest First</option>
              </select>
            </div>

            {/* Book Categories */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="all">All Books ({filteredBooks.length})</TabsTrigger>
                <TabsTrigger value="featured">Featured ({featuredBooks.length})</TabsTrigger>
                <TabsTrigger value="new">New Releases ({newReleases.length})</TabsTrigger>
                <TabsTrigger value="top-rated">Top Rated ({topRated.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <BookGrid books={filteredBooks} viewMode={viewMode} />
              </TabsContent>
              
              <TabsContent value="featured">
                <BookGrid books={featuredBooks} viewMode={viewMode} />
              </TabsContent>
              
              <TabsContent value="new">
                <BookGrid books={newReleases} viewMode={viewMode} />
              </TabsContent>
              
              <TabsContent value="top-rated">
                <BookGrid books={topRated} viewMode={viewMode} />
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </div>
      <UserNavigationHelper currentPage="Book Store" />
    </>
  );
}

interface BookGridProps {
  books: BookWithAccess[];
  viewMode: 'grid' | 'list';
}

function BookGrid({ books, viewMode }: BookGridProps) {
  if (books.length === 0) {
    return (
      <div className="text-center py-16">
        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No books found</h3>
        <p className="text-gray-500">Try adjusting your search or filters</p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {books.map((book) => (
          <BookCard key={book.id} book={book} layout="list" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
      {books.map((book) => (
        <BookCard key={book.id} book={book} layout="grid" />
      ))}
    </div>
  );
}

interface BookCardProps {
  book: BookWithAccess;
  layout: 'grid' | 'list';
}

function BookCard({ book, layout }: BookCardProps) {
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);

  const handleBookClick = () => {
    // Always go to book detail page first to show description and details
    window.location.href = `/book/${book.id}`;
  };

  const handleReadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (book.hasAccess) {
      window.location.href = `/reader/${book.id}`;
    } else {
      toast({
        title: "Access Required",
        description: book.accessReason,
        variant: "destructive",
      });
    }
  };

  if (layout === 'list') {
    return (
      <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer" onClick={handleBookClick}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative w-20 h-28 flex-shrink-0">
              <BookCoverImage
                src={book.coverImageUrl}
                alt={`Cover of "${book.title}" by ${book.author} - Available in the Wonderful Books digital library`}
                className="rounded-lg overflow-hidden"
                width={80}
                height={112}
                fallbackIcon={<BookOpen className="w-8 h-8 text-orange-600" />}
              />
              {book.tier && book.tier !== 'free' && (
                <Badge className={`absolute -top-1 -right-1 text-xs px-1 py-0.5 ${getTierColor(book.tier)}`}>
                  {book.tier}
                </Badge>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">{book.title}</h3>
              <p className="text-orange-600 text-sm font-medium mb-2">{book.author}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">{book.rating || '0.0'}</span>
                </div>
                
                <div className="flex gap-2">
                  {book.hasAccess ? (
                    <Button 
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={handleReadClick}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Read Now
                    </Button>
                  ) : (
                    <Button 
                      size="sm"
                      variant="outline"
                      className="border-orange-500 text-orange-600 hover:bg-orange-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = '/subscribe';
                      }}
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Subscribe
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid layout
  return (
    <Card 
      className="group hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 bg-white border border-orange-100"
      onClick={handleBookClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-3">
        <div className="relative aspect-[3/4] mb-3">
          <BookCoverImage
            src={book.coverImageUrl}
            alt={`Cover of "${book.title}" by ${book.author} - ${book.hasAccess ? 'Available to read now' : 'Subscription required'} in Wonderful Books digital library`}
            className="rounded-lg overflow-hidden"
            width={200}
            height={267}
            fallbackIcon={<BookOpen className="w-8 h-8 text-orange-600" />}
          />
          
          {book.tier && book.tier !== 'free' && (
            <Badge className={`absolute -top-1 -right-1 text-xs px-1.5 py-0.5 ${getTierColor(book.tier)}`}>
              {getTierIcon(book.tier)}
            </Badge>
          )}
          
          {!book.hasAccess && (
            <div className="absolute inset-0 bg-gray-900/40 rounded-lg flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
        
        <div>
          <h3 className="font-semibold text-base text-gray-900 line-clamp-2 mb-1">{book.title}</h3>
          <p className="text-orange-600 text-sm font-medium mb-2">{book.author}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium">{book.rating || '0.0'}</span>
            </div>
            
            {isHovered && book.hasAccess && (
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-xs h-7 px-3">
                Read Now
              </Button>
            )}
            
            {isHovered && !book.hasAccess && (
              <Button 
                size="sm" 
                variant="outline"
                className="border-orange-500 text-orange-600 hover:bg-orange-50 text-xs h-7 px-3"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = '/subscribe';
                }}
              >
                Subscribe
              </Button>
            )}
          </div>
          
          {!book.hasAccess && !isHovered && (
            <p className="text-xs text-gray-500 mt-1 text-center">{book.accessReason}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}