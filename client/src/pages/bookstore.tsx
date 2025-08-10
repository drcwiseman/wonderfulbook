import { useState } from "react";
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
  Plus
} from "lucide-react";
import { Book } from "@shared/schema";
import { SEOHead, seoConfigs } from "@/components/SEOHead";

interface BookWithAccess extends Book {
  hasAccess: boolean;
  accessReason?: string;
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

const getTierSmallIcon = (tier: string) => {
  switch (tier) {
    case 'premium':
      return <Crown className="w-3 h-3" />;
    case 'basic':
      return <Zap className="w-3 h-3" />;
    default:
      return <BookOpen className="w-3 h-3" />;
  }
};

export default function BookStore() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("featured");

  const { data: books = [], isLoading } = useQuery<Book[]>({
    queryKey: ['/api/books']
  });

  // Determine book access based on user subscription
  const booksWithAccess: BookWithAccess[] = books.map(book => {
    const bookTier = book.requiredTier || 'free';
    
    if (!isAuthenticated) {
      return {
        ...book,
        hasAccess: bookTier === 'free',
        accessReason: bookTier !== 'free' ? 'Sign in required' : undefined
      };
    }

    const userTier = (user as any)?.subscriptionTier || 'free';
    const tierHierarchy: Record<string, number> = { free: 0, basic: 1, premium: 2 };
    const hasAccess = tierHierarchy[userTier] >= tierHierarchy[bookTier];

    return {
      ...book,
      hasAccess,
      accessReason: !hasAccess ? `${bookTier.toUpperCase()} subscription required` : undefined
    };
  });

  // Filter and sort books
  const filteredBooks = booksWithAccess
    .filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           book.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || (book.requiredTier || 'free') === selectedCategory;
      return matchesSearch && matchesCategory;
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-orange-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading your book library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-orange-50/30 pt-20">
      <SEOHead {...seoConfigs.bookstore} />
      {/* Hero Section */}
      <section className="relative py-16 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              Book Store
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Discover transformational books curated for your personal growth journey
            </p>
            
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search books, authors, topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 border-orange-200 focus:border-orange-400"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-orange-500 hover:bg-orange-600' : 'border-orange-200 hover:border-orange-400'}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-orange-500 hover:bg-orange-600' : 'border-orange-200 hover:border-orange-400'}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collection Tabs */}
      <section className="px-6 mb-16">
        <div className="container mx-auto max-w-7xl">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <TabsList className="grid w-full md:w-auto grid-cols-4 bg-white border border-orange-200">
                <TabsTrigger value="all" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                  All Books
                </TabsTrigger>
                <TabsTrigger value="featured" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                  <Award className="w-4 h-4 mr-1" />
                  Featured
                </TabsTrigger>
                <TabsTrigger value="new" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                  <Clock className="w-4 h-4 mr-1" />
                  New
                </TabsTrigger>
                <TabsTrigger value="top-rated" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                  <Star className="w-4 h-4 mr-1" />
                  Top Rated
                </TabsTrigger>
              </TabsList>

              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-orange-200 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="featured">Featured</option>
                  <option value="rating">Highest Rated</option>
                  <option value="title">Title A-Z</option>
                  <option value="author">Author A-Z</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            </div>

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
  const [isHovered, setIsHovered] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const hasActiveSubscription = () => {
    if (!user) return false;
    return (user as any).subscriptionTier !== "free" && (user as any).subscriptionStatus === "active";
  };

  const canBorrowBook = () => {
    if (!user) return false;
    if (book.requiredTier === "free") return true;
    if ((user as any).subscriptionTier === "premium") return true;
    if ((user as any).subscriptionTier === "basic" && book.requiredTier !== "premium") return true;
    return false;
  };

  // Create loan (borrow book) mutation
  const borrowBookMutation = useMutation({
    mutationFn: async (bookId: string) => {
      const response = await fetch('/api/loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ bookId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to borrow book');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Book borrowed successfully!',
        description: 'You can now start reading this book.',
      });
      // Redirect to reader
      window.location.href = `/reader/${book.id}`;
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to borrow book',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const handleBookClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking a button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    window.location.href = `/book/${book.id}`;
  };

  const handleBorrowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    borrowBookMutation.mutate(book.id);
  };

  const bookTier = book.requiredTier || 'free';

  if (layout === 'list') {
    return (
      <Card 
        className="bg-white hover:shadow-xl transition-all duration-300 cursor-pointer border-orange-200 hover:border-orange-400"
        onClick={handleBookClick}
      >
        <CardContent className="p-6">
          <div className="flex gap-6">
            <div className="relative">
              <img
                src={book.coverImageUrl || "/api/placeholder/120/160"}
                alt={book.title}
                className="w-20 h-28 object-cover rounded-md shadow-md retina-ready"
                loading="lazy"
                decoding="async"
              />
              {!book.hasAccess && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-md">
                  <Lock className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">{book.title}</h3>
                  <p className="text-orange-600 font-medium">{book.author}</p>
                </div>
                
                <Badge className={`${getTierColor(bookTier)} text-xs font-bold`}>
                  {bookTier.toUpperCase()}
                </Badge>
              </div>
              
              <p className="text-gray-600 text-sm line-clamp-2 mb-3">{book.description}</p>
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{book.rating || '0.0'}</span>
                  </div>
                  
                  {book.isFeatured && (
                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                      Featured
                    </Badge>
                  )}
                </div>
                
                {!book.hasAccess && (
                  <span className="text-xs text-gray-500">{book.accessReason}</span>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                {canBorrowBook() ? (
                  <Button 
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 text-white flex-1"
                    onClick={handleBorrowClick}
                    disabled={borrowBookMutation.isPending}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    {borrowBookMutation.isPending ? 'Borrowing...' : 'Borrow'}
                  </Button>
                ) : (
                  <Button 
                    size="sm"
                    variant="outline"
                    className="border-orange-500 text-orange-600 hover:bg-orange-50 flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = '/subscribe';
                    }}
                  >
                    <Crown className="w-4 h-4 mr-1" />
                    Subscribe
                  </Button>
                )}
                <Button 
                  size="sm"
                  variant="outline"
                  className="px-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/book/${book.id}`;
                  }}
                >
                  Details
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="bg-white hover:shadow-2xl transition-all duration-300 cursor-pointer border-orange-200 hover:border-orange-400 hover:scale-105 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleBookClick}
    >
      <CardContent className="p-4">
        <div className="relative mb-4">
          <img
            src={book.coverImageUrl || "/api/placeholder/200/280"}
            alt={book.title}
            className="w-full aspect-[3/4] object-cover rounded-lg shadow-lg group-hover:shadow-xl transition-shadow duration-300"
          />
          
          {!book.hasAccess && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
              <div className="text-center text-white">
                <Lock className="w-8 h-8 mx-auto mb-2" />
                <Badge className={`${getTierColor(bookTier)} text-xs font-bold`}>
                  {bookTier.toUpperCase()}
                </Badge>
              </div>
            </div>
          )}
          
          {book.isFeatured && (
            <Badge className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold">
              Featured
            </Badge>
          )}
          
          <div className="absolute top-2 right-2">
            <Badge className={`${getTierColor(bookTier)} text-xs font-bold`}>
              {getTierSmallIcon(bookTier)}
            </Badge>
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold text-base text-gray-900 line-clamp-2 mb-1">{book.title}</h3>
          <p className="text-orange-600 text-sm font-medium mb-2">{book.author}</p>
          
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium">{book.rating || '0.0'}</span>
              <span className="text-xs text-gray-500">({book.totalRatings || 0})</span>
            </div>
          </div>
          
          {/* Grid Action Buttons */}
          <div className="space-y-1">
            {canBorrowBook() ? (
              <Button 
                size="sm"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs h-7"
                onClick={handleBorrowClick}
                disabled={borrowBookMutation.isPending}
              >
                <Download className="w-3 h-3 mr-1" />
                {borrowBookMutation.isPending ? 'Borrowing...' : 'Borrow'}
              </Button>
            ) : (
              <Button 
                size="sm"
                variant="outline"
                className="w-full border-orange-500 text-orange-600 hover:bg-orange-50 text-xs h-7"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = '/subscribe';
                }}
              >
                <Crown className="w-3 h-3 mr-1" />
                Subscribe
              </Button>
            )}
          </div>
          
          {!book.hasAccess && (
            <p className="text-xs text-gray-500 mt-1 text-center">{book.accessReason}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}