import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Zap, BookOpen, Users, TrendingUp, CheckCircle, ArrowRight, PlayCircle, Award, Shield, Clock } from "lucide-react";
import FeaturedBooks from "@/components/FeaturedBooks";
import { useQuery } from "@tanstack/react-query";

// Book Showcase Component
function BookShowcaseSection() {
  const { data: books = [] } = useQuery({
    queryKey: ["/api/books"],
  });

  const showcaseBooks = (books as any[]).slice(0, 6); // Show first 6 books

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto">
      {showcaseBooks.map((book: any) => (
        <div key={book.id} className="group cursor-pointer">
          <div className="relative overflow-hidden rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="aspect-[3/4] bg-gradient-to-br from-orange-800/20 to-amber-800/20 flex items-center justify-center">
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
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">{book.title}</h3>
                <p className="text-orange-200 text-xs">{book.author}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 text-gray-900">
      <Header />
      
      {/* Modern Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-400/5 to-orange-300/10"></div>
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
          }}
        ></div>

        <div className="relative z-10 container mx-auto px-6 text-center">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight bg-gradient-to-r from-gray-900 via-orange-600 to-orange-500 bg-clip-text text-transparent">
              Transform Your Mind with
              <span className="block text-orange-500">Life-Changing Books</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-12 text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Access thousands of carefully curated self-improvement and educational books. 
              Read anywhere, grow everywhere. Join thousands of readers transforming their lives daily.
            </p>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
              <Card className="bg-white border-orange-300 backdrop-blur-sm shadow-lg">
                <CardContent className="p-6 text-center">
                  <BookOpen className="w-8 h-8 text-orange-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-gray-900 mb-1">1000+</div>
                  <div className="text-gray-700">Premium Books</div>
                </CardContent>
              </Card>
              <Card className="bg-white border-orange-300 backdrop-blur-sm shadow-lg">
                <CardContent className="p-6 text-center">
                  <Users className="w-8 h-8 text-orange-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-gray-900 mb-1">50K+</div>
                  <div className="text-gray-700">Active Readers</div>
                </CardContent>
              </Card>
              <Card className="bg-white border-orange-300 backdrop-blur-sm shadow-lg">
                <CardContent className="p-6 text-center">
                  <Award className="w-8 h-8 text-orange-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-gray-900 mb-1">4.9★</div>
                  <div className="text-gray-700">User Rating</div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <>
                  <Button 
                    onClick={() => window.location.href = "/dashboard"}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <BookOpen className="w-5 h-5 mr-2" />
                    Continue Reading
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = "#featured"}
                    className="bg-white/10 hover:bg-orange-50 text-orange-600 hover:text-orange-700 px-8 py-4 rounded-full font-semibold transition-all duration-300 text-lg backdrop-blur-sm border-orange-400"
                  >
                    <PlayCircle className="w-5 h-5 mr-2" />
                    Explore Library
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={() => window.location.href = "/api/login"}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Start Free Trial
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-white/10 hover:bg-orange-50 text-orange-600 hover:text-orange-700 px-8 py-4 rounded-full font-semibold transition-all duration-300 text-lg backdrop-blur-sm border-orange-400"
                  >
                    View Pricing
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* User Status Card */}
      {isAuthenticated && (
        <section className="py-8">
          <div className="container mx-auto px-6">
            <Card className="bg-white border-orange-300 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="flex items-center space-x-4 mb-4 md:mb-0">
                    {(user as any)?.subscriptionTier === 'premium' && (
                      <>
                        <Crown className="w-8 h-8 text-orange-500" />
                        <div>
                          <div className="text-xl font-bold text-gray-900">Premium Member</div>
                          <div className="text-gray-600">Unlimited access to all books</div>
                        </div>
                      </>
                    )}
                    {(user as any)?.subscriptionTier === 'basic' && (
                      <>
                        <Star className="w-8 h-8 text-purple-400" />
                        <div>
                          <div className="text-xl font-bold text-white">Basic Member</div>
                          <div className="text-gray-300">10 books per month</div>
                        </div>
                      </>
                    )}
                    {((user as any)?.subscriptionTier === 'free' || !(user as any)?.subscriptionTier) && (
                      <>
                        <Zap className="w-8 h-8 text-gray-400" />
                        <div>
                          <div className="text-xl font-bold text-white">Free Trial</div>
                          <div className="text-gray-300">3 books available</div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.href = "/dashboard"}
                      className="border-gray-400 text-white hover:bg-white/10"
                    >
                      Dashboard
                    </Button>
                    {((user as any)?.subscriptionTier === 'free' || !(user as any)?.subscriptionTier) && (
                      <Button 
                        onClick={() => window.location.href = "/subscribe"}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                      >
                        Upgrade Now
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Book Showcase Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              Discover Our Premium Book Collection
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Handpicked titles from world-renowned authors and thought leaders. Experience the quality that sets us apart.
            </p>
          </div>
          
          <BookShowcaseSection />
        </div>
      </section>

      {/* Featured Books Section */}
      <section id="featured" className="py-16">
        <FeaturedBooks />
      </section>

      {/* Value Proposition Section */}
      <section className="py-20 bg-gradient-to-r from-orange-100/50 to-orange-50/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              Why Choose Wonderful Books?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We've crafted the perfect reading experience for modern learners and book enthusiasts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="bg-white border-orange-300 backdrop-blur-sm hover:transform hover:scale-105 transition-all duration-300 shadow-lg">
              <CardHeader className="text-center pb-3">
                <Shield className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <CardTitle className="text-2xl text-gray-900">Curated Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  Every book is hand-selected by our expert team. Only the highest quality content that delivers real value and transformation.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-orange-300 backdrop-blur-sm hover:transform hover:scale-105 transition-all duration-300 shadow-lg">
              <CardHeader className="text-center pb-3">
                <Clock className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <CardTitle className="text-2xl text-gray-900">Read Anywhere</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  Seamless reading across all your devices. Pick up exactly where you left off, whether on phone, tablet, or computer.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-orange-300 backdrop-blur-sm hover:transform hover:scale-105 transition-all duration-300 shadow-lg">
              <CardHeader className="text-center pb-3">
                <TrendingUp className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <CardTitle className="text-2xl text-gray-900">Track Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  Advanced analytics show your reading habits, progress, and achievements. Turn reading into a rewarding journey.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Modern Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              Choose Your Reading Journey
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Flexible plans designed for every type of reader. Start free, upgrade anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <Card className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border-gray-600/30 backdrop-blur-sm hover:transform hover:scale-105 transition-all duration-300">
              <CardHeader className="text-center pb-6">
                <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <CardTitle className="text-2xl text-white mb-2">Free Trial</CardTitle>
                <div className="text-4xl font-bold text-white mb-2">£0</div>
                <div className="text-gray-400">Forever</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-gray-300">3 featured books</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-gray-300">Basic reading features</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-gray-300">Progress tracking</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-gray-300">All devices</span>
                  </div>
                </div>
                <Button 
                  onClick={() => window.location.href = "/api/login"}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white mt-6"
                >
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            {/* Basic Plan */}
            <Card className="bg-gradient-to-br from-purple-800/40 to-purple-900/40 border-purple-500/50 backdrop-blur-sm hover:transform hover:scale-105 transition-all duration-300 relative">
              <CardHeader className="text-center pb-6">
                <Star className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <CardTitle className="text-2xl text-white mb-2">Basic Plan</CardTitle>
                <div className="text-4xl font-bold text-white mb-2">£9.99</div>
                <div className="text-purple-300">per month</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-gray-300">10 books per month</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-gray-300">All reading features</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-gray-300">Progress & bookmarks</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-gray-300">Offline reading</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-gray-300">Customer support</span>
                  </div>
                </div>
                <Button 
                  onClick={() => window.location.href = "/subscribe?tier=basic"}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white mt-6"
                >
                  Choose Basic
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="bg-gradient-to-br from-yellow-800/40 to-yellow-900/40 border-yellow-500/50 backdrop-blur-sm hover:transform hover:scale-105 transition-all duration-300 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold px-4 py-1">
                  MOST POPULAR
                </Badge>
              </div>
              <CardHeader className="text-center pb-6 pt-8">
                <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <CardTitle className="text-2xl text-white mb-2">Premium Plan</CardTitle>
                <div className="text-4xl font-bold text-white mb-2">£19.99</div>
                <div className="text-yellow-300">per month</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-gray-300">Unlimited books</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-gray-300">All premium features</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-gray-300">Advanced analytics</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-gray-300">Priority support</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-gray-300">Exclusive early access</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-gray-300">Multi-device sync</span>
                  </div>
                </div>
                <Button 
                  onClick={() => window.location.href = "/subscribe?tier=premium"}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold mt-6"
                >
                  Choose Premium
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
