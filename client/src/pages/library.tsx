import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
  Heart
} from "lucide-react";
import { Book } from "@shared/schema";

interface LibraryBook extends Book {
  readingProgress?: {
    currentPage: number;
    totalPages: number;
    progressPercentage: string;
    lastReadAt: Date;
  };
  isBookmarked?: boolean;
  accessGranted?: Date;
}

export default function Library() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("recent");

  // Get user's accessible books based on subscription
  const { data: allBooks = [], isLoading: booksLoading } = useQuery<Book[]>({
    queryKey: ['/api/books']
  });

  // Get user's reading progress
  const { data: progressData = [], isLoading: progressLoading } = useQuery<any[]>({
    queryKey: ['/api/user/reading-progress'],
    enabled: isAuthenticated
  });

  // Get user's bookmarks
  const { data: bookmarks = [], isLoading: bookmarksLoading } = useQuery<any[]>({
    queryKey: ['/api/bookmarks'],
    enabled: isAuthenticated
  });

  // Filter books based on user's subscription tier
  const userTier = (user as any)?.subscriptionTier || 'free';
  const tierHierarchy: Record<string, number> = { free: 0, basic: 1, premium: 2 };

  const libraryBooks: LibraryBook[] = allBooks
    .filter(book => {
      const bookTier = book.requiredTier || 'free';
      return tierHierarchy[userTier] >= tierHierarchy[bookTier];
    })
    .map(book => {
      const progress = (progressData as any[]).find((p: any) => p.bookId === book.id);
      const isBookmarked = (bookmarks as any[]).some((b: any) => b.bookId === book.id);
      
      return {
        ...book,
        readingProgress: progress,
        isBookmarked,
        accessGranted: new Date() // Mock access date - would be from subscription date
      };
    });

  // Filter and sort books
  const filteredBooks = libraryBooks
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
    });

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

  const isLoading = booksLoading || progressLoading || bookmarksLoading;

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-orange-50/30 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading your personal library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-orange-50/30 pt-20">
      {/* Header Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                  My Library
                </h1>
                <p className="text-xl text-gray-600">
                  Your personal collection of {libraryBooks.length} books
                </p>
              </div>
              
              <div className="text-right">
                <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-bold mb-2">
                  {userTier.toUpperCase()} MEMBER
                </Badge>
                <div className="text-sm text-gray-600">
                  {readingBooks.length} currently reading • {completedBooks.length} completed
                </div>
              </div>
            </div>

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
          </div>
        </div>
      </section>

      {/* Library Content */}
      <section className="px-6 pb-16">
        <div className="container mx-auto max-w-7xl">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="grid w-full md:w-auto grid-cols-5 bg-white border border-orange-200 mb-8">
              <TabsTrigger value="all" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                All ({libraryBooks.length})
              </TabsTrigger>
              <TabsTrigger value="reading" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                <Play className="w-4 h-4 mr-1" />
                Reading ({readingBooks.length})
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
      </section>
    </div>
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
  const progressPercent = parseFloat(book.readingProgress?.progressPercentage || '0');
  const isCompleted = progressPercent >= 95;
  const isStarted = progressPercent > 0;

  const handleBookClick = () => {
    if (isStarted && !isCompleted) {
      window.location.href = `/reader/${book.id}`;
    } else {
      window.location.href = `/book/${book.id}`;
    }
  };

  const getReadingStatus = () => {
    if (isCompleted) return { text: 'Completed', color: 'text-green-600 bg-green-100' };
    if (isStarted) return { text: 'Reading', color: 'text-blue-600 bg-blue-100' };
    return { text: 'Unread', color: 'text-gray-600 bg-gray-100' };
  };

  const status = getReadingStatus();

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
                className="w-20 h-28 object-cover rounded-md shadow-md"
              />
              {book.isBookmarked && (
                <div className="absolute -top-2 -right-2">
                  <Heart className="w-5 h-5 text-red-500 fill-current" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">{book.title}</h3>
                  <p className="text-orange-600 font-medium">{book.author}</p>
                </div>
                
                <Badge className={`${status.color} text-xs font-bold px-2 py-1 rounded-full`}>
                  {status.text}
                </Badge>
              </div>
              
              <p className="text-gray-600 text-sm line-clamp-2 mb-3">{book.description}</p>
              
              {isStarted && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(progressPercent)}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                  <div className="text-xs text-gray-500 mt-1">
                    Page {book.readingProgress?.currentPage} of {book.readingProgress?.totalPages}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{book.rating || '0.0'}</span>
                  </div>
                  
                  {book.readingProgress?.lastReadAt && (
                    <div className="text-xs text-gray-500">
                      Last read: {new Date(book.readingProgress.lastReadAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
                
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                  {isStarted && !isCompleted ? 'Continue' : isCompleted ? 'Read Again' : 'Start Reading'}
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
          
          <div className="absolute top-2 left-2">
            <Badge className={`${status.color} text-xs font-bold px-2 py-1 rounded-full`}>
              {status.text}
            </Badge>
          </div>
          
          {book.isBookmarked && (
            <div className="absolute top-2 right-2">
              <Heart className="w-5 h-5 text-red-500 fill-current" />
            </div>
          )}
          
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