import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Star, 
  BookOpen, 
  Clock, 
  Download,
  Play,
  Bookmark,
  Filter,
  Grid3x3,
  List,
  Calendar,
  TrendingUp,
  Award,
  Heart,
  Home,
  Library as LibraryIcon
} from "lucide-react";
import { Book } from "@shared/schema";
import Header from "@/components/Header";
import PageHeader from "@/components/PageHeader";

interface LibraryBook extends Book {
  readingProgress?: {
    currentPage: number;
    totalPages: number;
    progressPercentage: string;
    lastReadAt: Date | string;
  };
  isBookmarked?: boolean;
  accessGranted: Date;
  isDownloaded?: boolean;
  downloadedAt?: Date;
  loanStatus?: 'active' | 'returned' | 'revoked';
}

export default function Library() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: allBooks = [], isLoading: booksLoading } = useQuery<Book[]>({
    queryKey: ["/api/books"],
    enabled: isAuthenticated && !isLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const { data: progressData = [], isLoading: progressLoading } = useQuery<any[]>({
    queryKey: ["/api/reading-progress"],
    enabled: isAuthenticated && !isLoading && allBooks.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const { data: bookmarks = [], isLoading: bookmarksLoading } = useQuery<any[]>({
    queryKey: ["/api/bookmarks"],
    enabled: isAuthenticated && !isLoading && allBooks.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Get downloaded books (loans)
  const { data: loansData = [], isLoading: loansLoading } = useQuery({
    queryKey: ["/api/loans"],
    enabled: isAuthenticated && !isLoading && allBooks.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Check if we're still loading any essential data
  const isLoadingEssentialData = isLoading || booksLoading;

  // Define user tier outside memoized block so it's available in component scope
  const userTier = (user as any)?.subscriptionTier || 'free';
  const tierHierarchy: Record<string, number> = { free: 0, basic: 1, premium: 2 };

  // Memoize library books to prevent unnecessary recalculations
  const libraryBooks: LibraryBook[] = useMemo(() => {
    if (isLoadingEssentialData || !allBooks.length) return [];

    return (allBooks as Book[])
      .filter((book: Book) => {
        const bookTier = book.requiredTier || 'free';
        return tierHierarchy[userTier] >= tierHierarchy[bookTier];
      })
      .map((book: Book) => {
        const progress = (progressData as any[]).find((p: any) => p.bookId === book.id);
        const isBookmarked = (bookmarks as any[]).some((b: any) => b.bookId === book.id);
        
        // Check if book is downloaded (has an active loan)
        const loans = (loansData as any)?.loans || [];
        const activeLoan = loans.find((loan: any) => 
          loan.book.id === book.id && loan.status === 'active'
        );
        
        return {
          ...book,
          readingProgress: progress,
          isBookmarked,
          accessGranted: new Date(), // Mock access date - would be from subscription date
          isDownloaded: !!activeLoan,
          downloadedAt: activeLoan ? new Date(activeLoan.startedAt) : undefined,
          loanStatus: activeLoan?.status
        };
      });
  }, [allBooks, progressData, bookmarks, loansData, user, isLoadingEssentialData]);

  // Memoize filtered books to prevent unnecessary recalculations
  const filteredBooks = useMemo(() => libraryBooks
    .filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           book.author.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesCategory = true;
      switch (selectedCategory) {
        case 'reading':
          matchesCategory = !!book.readingProgress && book.readingProgress.currentPage > 0;
          break;
        case 'completed':
          matchesCategory = !!book.readingProgress && 
            parseFloat(book.readingProgress.progressPercentage) >= 95;
          break;
        case 'bookmarked':
          matchesCategory = !!book.isBookmarked;
          break;
        case 'unread':
          matchesCategory = !book.readingProgress || book.readingProgress.currentPage === 0;
          break;
        case 'downloaded':
          matchesCategory = !!book.isDownloaded;
          break;
        default:
          matchesCategory = true;
      }
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.readingProgress?.lastReadAt || b.createdAt || '').getTime() - 
                 new Date(a.readingProgress?.lastReadAt || a.createdAt || '').getTime();
        case 'progress':
          return parseFloat(b.readingProgress?.progressPercentage || '0') - 
                 parseFloat(a.readingProgress?.progressPercentage || '0');
        case 'rating':
          return parseFloat(b.rating || '0') - parseFloat(a.rating || '0');
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return a.author.localeCompare(b.author);
        default:
          return 0;
      }
    }), [libraryBooks, searchQuery, selectedCategory, sortBy]);

  const readingBooks = libraryBooks.filter(book => 
    book.readingProgress && book.readingProgress.currentPage > 0 && 
    parseFloat(book.readingProgress.progressPercentage) < 95
  );
  
  const completedBooks = libraryBooks.filter(book => 
    book.readingProgress && parseFloat(book.readingProgress.progressPercentage) >= 95
  );
  
  const bookmarkedBooks = libraryBooks.filter(book => book.isBookmarked);
  
  const unreadBooks = libraryBooks.filter(book => 
    !book.readingProgress || book.readingProgress.currentPage === 0
  );
  
  const downloadedBooks = libraryBooks.filter(book => book.isDownloaded);

  const isLoadingState = booksLoading || progressLoading || bookmarksLoading || loansLoading;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-orange-50/30 pt-20 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Your Library</h1>
          <p className="text-gray-600 mb-6">Sign in to view your personal book collection</p>
          <Button 
            onClick={() => window.location.href = "/auth/login"}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (isLoadingState) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-b from-white to-orange-50/30 pt-20 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Loading your personal library...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-white to-orange-50/30 pt-20">
        <PageHeader 
          title="My Library"
          subtitle={`Your personal collection of ${libraryBooks.length} books`}
          breadcrumbs={[
            { label: "Home", href: "/", icon: Home },
            { label: "My Library", icon: LibraryIcon }
          ]}
          backButtonLabel="Back to Home"
          backButtonHref="/"
          actions={
            <div className="flex items-center space-x-4">
              <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-bold">
                {userTier.toUpperCase()} MEMBER
              </Badge>
              <div className="text-sm text-gray-600">
                {readingBooks.length} reading • {completedBooks.length} completed
              </div>
            </div>
          }
        />
        <div className="container mx-auto px-4 py-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white border-orange-200">
              <CardContent className="p-4 text-center">
                <BookOpen className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{libraryBooks.length}</div>
                <div className="text-sm text-gray-600">Total Books</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-orange-200">
              <CardContent className="p-4 text-center">
                <Play className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{readingBooks.length}</div>
                <div className="text-sm text-gray-600">Reading</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-orange-200">
              <CardContent className="p-4 text-center">
                <Award className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{completedBooks.length}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-orange-200">
              <CardContent className="p-4 text-center">
                <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{bookmarkedBooks.length}</div>
                <div className="text-sm text-gray-600">Bookmarked</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search your library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 border-orange-200 focus:border-orange-400"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-orange-200 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="recent">Recently Read</option>
                <option value="progress">Most Progress</option>
                <option value="rating">Highest Rated</option>
                <option value="title">Title A-Z</option>
                <option value="author">Author A-Z</option>
              </select>
              
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
          
          {/* Library Content */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="grid w-full md:w-auto grid-cols-6 bg-white border border-orange-200 mb-8">
              <TabsTrigger value="all" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                All ({libraryBooks.length})
              </TabsTrigger>
              <TabsTrigger value="reading" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                <Play className="w-4 h-4 mr-1" />
                Reading ({readingBooks.length})
              </TabsTrigger>
              <TabsTrigger value="downloaded" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                <Download className="w-4 h-4 mr-1" />
                Downloaded ({downloadedBooks.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                <Award className="w-4 h-4 mr-1" />
                Completed ({completedBooks.length})
              </TabsTrigger>
              <TabsTrigger value="bookmarked" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                <Heart className="w-4 h-4 mr-1" />
                Saved ({bookmarkedBooks.length})
              </TabsTrigger>
              <TabsTrigger value="unread" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                <BookOpen className="w-4 h-4 mr-1" />
                Unread ({unreadBooks.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <LibraryGrid books={filteredBooks} viewMode={viewMode} />
            </TabsContent>
            
            <TabsContent value="reading">
              <LibraryGrid books={readingBooks} viewMode={viewMode} />
            </TabsContent>
            
            <TabsContent value="downloaded">
              <LibraryGrid books={downloadedBooks} viewMode={viewMode} />
            </TabsContent>
            
            <TabsContent value="completed">
              <LibraryGrid books={completedBooks} viewMode={viewMode} />
            </TabsContent>
            
            <TabsContent value="bookmarked">
              <LibraryGrid books={bookmarkedBooks} viewMode={viewMode} />
            </TabsContent>
            
            <TabsContent value="unread">
              <LibraryGrid books={unreadBooks} viewMode={viewMode} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}

interface LibraryGridProps {
  books: LibraryBook[];
  viewMode: 'grid' | 'list';
}

function LibraryGrid({ books, viewMode }: LibraryGridProps) {
  if (books.length === 0) {
    return (
      <div className="text-center py-16">
        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No books found</h3>
        <p className="text-gray-500">Try browsing the bookstore to add more books to your library</p>
        <Button 
          className="mt-4 bg-orange-500 hover:bg-orange-600"
          onClick={() => window.location.href = '/bookstore'}
        >
          Browse Books
        </Button>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {books.map((book) => (
          <LibraryBookCard key={book.id} book={book} layout="list" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {books.map((book) => (
        <LibraryBookCard key={book.id} book={book} layout="grid" />
      ))}
    </div>
  );
}

interface LibraryBookCardProps {
  book: LibraryBook;
  layout: 'grid' | 'list';
}

function LibraryBookCard({ book, layout }: LibraryBookCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const progressPercent = book.readingProgress ? 
    parseFloat(book.readingProgress.progressPercentage) : 0;
  
  const isStarted = progressPercent > 0;
  const isCompleted = progressPercent >= 95;

  return (
    <Card 
      className="group cursor-pointer transition-all duration-300 hover:shadow-lg border-orange-100 hover:border-orange-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => window.location.href = `/book/${book.id}`}
    >
      <CardContent className="p-4">
        <div className="relative mb-3">
          <img
            src={book.coverImageUrl || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400"}
            alt={book.title}
            className="w-full aspect-[3/4] object-cover rounded-lg"
          />
          
          {isStarted && (
            <div className="absolute bottom-2 left-2 right-2">
              <Progress value={progressPercent} className="h-2 bg-white/80" />
              <div className="text-xs text-white font-medium mt-1 text-center bg-black/50 rounded px-1">
                {Math.round(progressPercent)}% Complete
              </div>
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
            
            {isHovered && (
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-xs h-7 px-3">
                {isStarted && !isCompleted ? 'Continue' : isCompleted ? 'Read Again' : 'Start'}
              </Button>
            )}
          </div>
          
          {book.readingProgress?.lastReadAt && !isHovered && (
            <p className="text-xs text-gray-500 mt-1 text-center">
              {new Date(book.readingProgress.lastReadAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}