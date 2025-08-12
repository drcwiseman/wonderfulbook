import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import type { Book } from "@shared/schema";
import BookCoverImage from "@/components/BookCoverImage";

export default function FeaturedBooks() {
  const { data: books, isLoading } = useQuery<Book[]>({
    queryKey: ["/api/books?featured=true"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const handleBookClick = (bookId: string) => {
    window.location.href = `/book/${bookId}`;
  };

  if (isLoading) {
    return (
      <section id="featured" className="py-16 px-4 md:px-8 opacity-80">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Featured This Week</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse will-change-auto">
                <div className="bg-gray-300 rounded-lg h-64 md:h-80 mb-2 transition-all duration-300"></div>
                <div className="h-4 bg-gray-300 rounded mb-1"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="featured" className="py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">Featured This Week</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {books?.map((book) => (
            <div 
              key={book.id}
              className="group cursor-pointer transform hover:scale-105 transition-all duration-300"
              onClick={() => handleBookClick(book.id)}
            >
              <div className="relative rounded-lg overflow-hidden shadow-2xl">
                <BookCoverImage
                  src={book.coverImageUrl}
                  alt={`${book.title} by ${book.author} - Book cover image for ${book.requiredTier || 'personal development'} book`}
                  className="h-64 md:h-80"
                  width={200}
                  height={320}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="font-semibold text-sm mb-1 truncate">{book.title}</h3>
                    <p className="text-xs text-gray-300 truncate">{book.author}</p>
                    <div className="flex items-center mt-2">
                      <div className="flex text-yellow-400 text-xs">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.floor(Number(book.rating))
                                ? "fill-current"
                                : ""
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400 ml-2">{book.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
