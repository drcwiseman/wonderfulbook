import React, { useState, useEffect, useRef } from "react";
import { Search, BookOpen, User, Hash } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface SearchSuggestion {
  id: string;
  type: 'book' | 'author' | 'topic';
  title: string;
  subtitle?: string;
  relevantTerms: string[];
}

interface IntelligentSearchProps {
  onSelectBook?: (bookId: string) => void;
  className?: string;
}

export default function IntelligentSearch({ onSelectBook, className }: IntelligentSearchProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch all books for search suggestions
  const { data: books = [] } = useQuery({
    queryKey: ["/api/books"],
    enabled: true,
  });

  // Generate search suggestions based on query
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const searchTerm = query.toLowerCase();
    const newSuggestions: SearchSuggestion[] = [];

    // Search books by title
    books.forEach((book: any) => {
      if (book.title.toLowerCase().includes(searchTerm)) {
        newSuggestions.push({
          id: book.id,
          type: 'book',
          title: book.title,
          subtitle: `by ${book.author}`,
          relevantTerms: [book.title, book.author, ...(book.description?.split(' ').slice(0, 10) || [])]
        });
      }
    });

    // Search books by author
    const uniqueAuthors = [...new Set(books.map((book: any) => book.author))];
    uniqueAuthors.forEach((author: string) => {
      if (author.toLowerCase().includes(searchTerm)) {
        const authorBooks = books.filter((book: any) => book.author === author);
        newSuggestions.push({
          id: `author-${author}`,
          type: 'author',
          title: author,
          subtitle: `${authorBooks.length} book${authorBooks.length > 1 ? 's' : ''}`,
          relevantTerms: [author, ...authorBooks.map((book: any) => book.title)]
        });
      }
    });

    // Search by topic/description keywords
    const topicMatches = new Set<string>();
    books.forEach((book: any) => {
      if (book.description) {
        const words = book.description.toLowerCase().split(/\s+/);
        words.forEach((word: string) => {
          if (word.includes(searchTerm) && word.length > 3) {
            topicMatches.add(word);
          }
        });
      }
    });

    Array.from(topicMatches).slice(0, 3).forEach((topic: string) => {
      const relatedBooks = books.filter((book: any) => 
        book.description?.toLowerCase().includes(topic)
      );
      if (relatedBooks.length > 0) {
        newSuggestions.push({
          id: `topic-${topic}`,
          type: 'topic',
          title: topic.charAt(0).toUpperCase() + topic.slice(1),
          subtitle: `Found in ${relatedBooks.length} book${relatedBooks.length > 1 ? 's' : ''}`,
          relevantTerms: [topic, ...relatedBooks.map((book: any) => book.title)]
        });
      }
    });

    // Limit to top 8 suggestions
    setSuggestions(newSuggestions.slice(0, 8));
    setShowSuggestions(true);
    setSelectedIndex(-1);
  }, [query, books.length]); // Only depend on books.length to avoid infinite renders

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSuggestions) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    if (showSuggestions) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showSuggestions, selectedIndex, suggestions]);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'book') {
      onSelectBook?.(suggestion.id);
      window.location.href = `/book/${suggestion.id}`;
    } else if (suggestion.type === 'author') {
      const author = suggestion.title;
      window.location.href = `/bookstore?author=${encodeURIComponent(author)}`;
    } else if (suggestion.type === 'topic') {
      const topic = suggestion.title;
      window.location.href = `/bookstore?search=${encodeURIComponent(topic)}`;
    }
    
    setQuery("");
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'book': return <BookOpen className="w-4 h-4 text-orange-500" />;
      case 'author': return <User className="w-4 h-4 text-blue-500" />;
      case 'topic': return <Hash className="w-4 h-4 text-green-500" />;
      default: return <Search className="w-4 h-4 text-gray-500" />;
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <span key={index} className="bg-orange-100 text-orange-800 font-semibold">{part}</span> : 
        part
    );
  };

  return (
    <div ref={searchRef} className={`relative w-full max-w-2xl mx-auto ${className}`}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowSuggestions(true)}
          placeholder="Search books, authors, topics... Start typing to discover"
          className="w-full pl-12 pr-4 py-4 text-lg bg-white border-2 border-orange-200 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all shadow-lg hover:shadow-xl"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setShowSuggestions(false);
              inputRef.current?.focus();
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-orange-200 shadow-2xl rounded-2xl overflow-hidden z-50 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-orange-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                  selectedIndex === index ? 'bg-orange-50 border-orange-200' : ''
                }`}
              >
                <div className="flex-shrink-0">
                  {getIcon(suggestion.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">
                    {highlightMatch(suggestion.title, query)}
                  </div>
                  {suggestion.subtitle && (
                    <div className="text-sm text-gray-600 truncate">
                      {suggestion.subtitle}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600 capitalize">
                    {suggestion.type}
                  </span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No results message */}
      {showSuggestions && suggestions.length === 0 && query.length >= 2 && (
        <Card className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-orange-200 shadow-xl rounded-2xl overflow-hidden z-50">
          <CardContent className="p-6 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No books, authors, or topics found for "<strong>{query}</strong>"</p>
            <p className="text-sm text-gray-500 mt-1">Try a different search term or browse our collection</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}