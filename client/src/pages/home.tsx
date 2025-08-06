import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Star, Play, Plus, Info, ChevronRight, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// Category Row Component - Netflix style
function CategoryRow({ title, books, category }: { title: string; books: any[]; category?: string }) {
  const categoryBooks = category ? books.filter(book => book.category === category) : books;
  
  if (categoryBooks.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <Button variant="ghost" className="text-gray-400 hover:text-white">
          See All <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {categoryBooks.slice(0, 10).map((book: any) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  );
}

// Individual Book Card - Netflix style
function BookCard({ book }: { book: any }) {
  return (
    <div className="group relative flex-shrink-0 w-48 cursor-pointer">
      <div className="relative aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden transition-transform duration-300 group-hover:scale-105">
        {book.coverImageUrl ? (
          <img
            src={book.coverImageUrl}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-white/80" />
          </div>
        )}
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300">
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button size="sm" className="bg-white text-black hover:bg-gray-200">
              <Play className="w-4 h-4 mr-1" />
              Read
            </Button>
          </div>
        </div>
        
        {/* Rating badge */}
        {book.rating && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-black/70 text-white text-xs">
              <Star className="w-3 h-3 mr-1" />
              {book.rating}
            </Badge>
          </div>
        )}
        
        {/* Tier badge */}
        {book.tier && book.tier !== 'free' && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-orange-600 text-white text-xs">
              {book.tier === 'premium' ? 'PREMIUM' : 'BASIC'}
            </Badge>
          </div>
        )}
      </div>
      
      {/* Book info */}
      <div className="mt-2 space-y-1">
        <h3 className="text-white font-medium text-sm line-clamp-2 group-hover:text-orange-400 transition-colors">
          {book.title}
        </h3>
        <p className="text-gray-400 text-xs">{book.author}</p>
        {book.category && (
          <p className="text-gray-500 text-xs capitalize">{book.category}</p>
        )}
      </div>
    </div>
  );
}

// Featured Hero Section
function FeaturedHero({ book }: { book: any }) {
  if (!book) return null;

  return (
    <div className="relative h-[80vh] min-h-[600px] bg-gradient-to-r from-black via-black/90 to-transparent">
      {/* Background image */}
      <div className="absolute inset-0">
        {book.coverImageUrl ? (
          <img
            src={book.coverImageUrl}
            alt={book.title}
            className="w-full h-full object-cover opacity-30"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-900 to-red-900 opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 h-full flex items-center">
        <div className="max-w-2xl">
          <div className="mb-4">
            <Badge className="bg-orange-600 text-white mb-2">
              FEATURED
            </Badge>
            {book.category && (
              <Badge variant="outline" className="border-gray-500 text-gray-300 ml-2">
                {book.category}
              </Badge>
            )}
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
            {book.title}
          </h1>
          
          <p className="text-xl text-gray-300 mb-2">
            by {book.author}
          </p>
          
          {book.description && (
            <p className="text-lg text-gray-400 mb-8 line-clamp-3 max-w-xl">
              {book.description}
            </p>
          )}
          
          <div className="flex items-center gap-4 mb-8">
            {book.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="text-white font-medium">{book.rating}</span>
                <span className="text-gray-400">/ 5</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-4">
            <Button 
              onClick={() => window.location.href = `/reader/${book.id}`}
              className="bg-white text-black hover:bg-gray-200 px-8 py-3 text-lg font-semibold"
            >
              <Play className="w-5 h-5 mr-2" />
              Read Now
            </Button>
            <Button 
              variant="outline"
              className="border-gray-500 text-white hover:bg-gray-800 px-8 py-3 text-lg"
            >
              <Info className="w-5 h-5 mr-2" />
              More Info
            </Button>
            <Button 
              variant="ghost"
              className="text-white hover:bg-gray-800 px-4 py-3"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: booksData = [] } = useQuery({
    queryKey: ["/api/books"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const books = Array.isArray(booksData) ? booksData : [];
  const featuredBook = books.find((book: any) => book.rating >= 4.5) || books[0];
  const categories = ['Self-Improvement', 'Business', 'Psychology', 'Leadership', 'Health'];

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      {/* Featured Hero */}
      <FeaturedHero book={featuredBook} />
      
      {/* Content Rows */}
      <div className="relative z-10 bg-black pt-8">
        <div className="container mx-auto px-6 space-y-8">
          
          {/* Continue Reading */}
          {isAuthenticated && (
            <CategoryRow title="Continue Reading" books={books.slice(0, 5)} />
          )}
          
          {/* Popular Now */}
          <CategoryRow title="Popular Now" books={books.filter((book: any) => book.rating >= 4.0)} />
          
          {/* Category Rows */}
          {categories.map(category => (
            <CategoryRow 
              key={category}
              title={category}
              books={books}
              category={category.toLowerCase()}
            />
          ))}
          
          {/* All Books */}
          <CategoryRow title="All Books" books={books} />
          
        </div>
      </div>
      
      <Footer />
    </div>
  );
}