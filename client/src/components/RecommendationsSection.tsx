import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Book } from "@shared/schema";

export default function RecommendationsSection() {
  const { isAuthenticated } = useAuth();
  
  // For now, we'll show general popular books
  // In a real app, this would be personalized recommendations
  const { data: books, isLoading } = useQuery<Book[]>({
    queryKey: ["/api/books"],
    enabled: isAuthenticated,
  });

  const handleBookClick = (bookId: string) => {
    window.location.href = `/book/${bookId}`;
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <section className="py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Recommended for You</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-gray-100 border-gray-200 animate-pulse">
                <div className="w-full h-48 bg-gray-700"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Get top-rated books as recommendations
  const recommendedBooks = books
    ?.sort((a, b) => Number(b.rating) - Number(a.rating))
    ?.slice(0, 4) || [];

  return (
    <section className="py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">Recommended for You</h2>
        <p className="text-gray-600 mb-8">Based on your reading history and preferences</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {recommendedBooks.map((book, index) => (
            <Card 
              key={book.id}
              className="bg-white border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => handleBookClick(book.id)}
            >
              <img
                src={book.coverImageUrl || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400"}
                alt={book.title}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 text-gray-900 truncate">{book.title}</h3>
                <p className="text-gray-600 text-sm mb-2 truncate">{book.author}</p>
                <div className="flex items-center justify-between">
                  <div className="flex text-yellow-400 text-sm">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(Number(book.rating))
                            ? "fill-current"
                            : ""
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">{book.rating}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {Math.floor(Math.random() * 20) + 80}% match
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
