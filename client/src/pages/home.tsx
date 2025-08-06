import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Star, Play, CheckCircle, Crown, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// Featured Books Section
function FeaturedBooks() {
  const { data: booksData = [] } = useQuery({
    queryKey: ["/api/books"],
  });

  const books = Array.isArray(booksData) ? booksData : [];
  const featuredBooks = books.slice(0, 3);

  return (
    <div className="py-16">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">
          Books That Change Lives
        </h2>
        <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          Discover transformational books chosen by experts to unlock your potential
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {featuredBooks.map((book: any) => (
            <Card key={book.id} className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors">
              <CardContent className="p-0">
                <div className="aspect-[3/4] bg-gray-800 rounded-t-lg overflow-hidden">
                  {book.coverImageUrl ? (
                    <img
                      src={book.coverImageUrl}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-white/80" />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    {book.tier && book.tier !== 'free' && (
                      <Badge className="bg-orange-600 text-white text-xs">
                        {book.tier === 'premium' ? 'Premium' : 'Popular'}
                      </Badge>
                    )}
                    {book.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-white text-sm">{book.rating}</span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-white font-semibold mb-2 line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">by {book.author}</p>
                  <Button 
                    onClick={() => window.location.href = `/reader/${book.id}`}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Reading
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// Pricing Section
function PricingSection() {
  return (
    <div className="py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Choose Your Plan</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Start with our free trial, then choose the plan that fits your transformation journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Trial */}
          <Card className="bg-gray-900 border-gray-700 relative">
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-2xl text-white">Free Trial</CardTitle>
              <div className="text-4xl font-bold text-white mt-4">
                £0
                <span className="text-lg font-normal text-gray-400 block">7 days free</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  Access to 3 books
                </li>
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  Full reading experience
                </li>
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  No commitment
                </li>
              </ul>
              <Button 
                onClick={() => window.location.href = "/api/login"}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white"
              >
                Start Free Trial
              </Button>
            </CardContent>
          </Card>

          {/* Basic Plan */}
          <Card className="bg-gray-900 border-orange-500 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-orange-600 text-white px-4 py-1">Most Popular</Badge>
            </div>
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-2xl text-white">Basic</CardTitle>
              <div className="text-4xl font-bold text-white mt-4">
                £9.99
                <span className="text-lg font-normal text-gray-400 block">per month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  Access to 50 books monthly
                </li>
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  Bookmark & annotations
                </li>
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  Progress tracking
                </li>
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  Cancel anytime
                </li>
              </ul>
              <Button 
                onClick={() => window.location.href = "/subscribe"}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                Get Started
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="bg-gray-900 border-gray-700 relative">
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-2xl text-white flex items-center justify-center gap-2">
                <Crown className="w-6 h-6 text-yellow-400" />
                Premium
              </CardTitle>
              <div className="text-4xl font-bold text-white mt-4">
                £19.99
                <span className="text-lg font-normal text-gray-400 block">per month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  Unlimited access to all books
                </li>
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  Priority customer support
                </li>
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  Advanced analytics
                </li>
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  Early access to new books
                </li>
              </ul>
              <Button 
                onClick={() => window.location.href = "/subscribe"}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-semibold"
              >
                Go Premium
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-gray-400 mt-8">
          All plans include secure PDF streaming, mobile access, and the ability to cancel anytime.
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Transform Your Life
          </h1>
          <h2 className="text-4xl md:text-5xl font-bold text-orange-400 mb-8">
            Through Reading
          </h2>
          <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto">
            Unlimited access to thousands of books. Read anywhere, anytime. No downloads required.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              onClick={() => window.location.href = "/api/login"}
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 text-lg font-semibold"
            >
              <Zap className="w-5 h-5 mr-2" />
              Start Free Trial
            </Button>
            <Button 
              variant="outline"
              className="border-gray-500 text-white hover:bg-gray-800 px-8 py-4 text-lg"
            >
              Browse Library
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-400 mb-2">171+</div>
              <div className="text-gray-400">Life-Changing Books</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-400 mb-2">27+</div>
              <div className="text-gray-400">Curated Categories</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-400 mb-2">∞</div>
              <div className="text-gray-400">Growth Possibilities</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Books */}
      <FeaturedBooks />

      {/* Pricing Section */}
      <PricingSection />
      
      <Footer />
    </div>
  );
}