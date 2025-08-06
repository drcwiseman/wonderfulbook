import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FeaturedBooks from "@/components/FeaturedBooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { BookOpen, Users, TrendingUp, CheckCircle, ArrowRight, PlayCircle, Award, Shield, Clock, Zap, Star, Crown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// Book Showcase Component for Landing
function BookShowcaseForLanding() {
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

export default function Landing() {
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
              <Link href="/auth/register">
                <Button 
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Start Free Trial
                </Button>
              </Link>
              <Button 
                variant="outline"
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white/10 hover:bg-white/20 text-gray-700 px-8 py-4 rounded-full font-semibold transition-all duration-300 text-lg backdrop-blur-sm border-gray-300 hover:bg-gray-50"
              >
                View Pricing
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
            <div className="mt-6 text-center">
              <Link href="/auth/login" className="text-orange-600 hover:text-orange-500 font-medium text-lg">
                Already have an account? Sign in here
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Book Showcase Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
              Discover Our Premium Book Collection
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Handpicked titles from world-renowned authors and thought leaders. Experience the quality that sets us apart.
            </p>
          </div>
          
          <BookShowcaseForLanding />
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
            <Card className="bg-gradient-to-br from-orange-900/30 to-orange-800/30 border-orange-500/30 backdrop-blur-sm hover:transform hover:scale-105 transition-all duration-300">
              <CardHeader className="text-center pb-3">
                <Shield className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                <CardTitle className="text-2xl text-white">Curated Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 leading-relaxed">
                  Every book is hand-selected by our expert team. Only the highest quality content that delivers real value and transformation.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-900/30 to-red-800/30 border-red-500/30 backdrop-blur-sm hover:transform hover:scale-105 transition-all duration-300">
              <CardHeader className="text-center pb-3">
                <Clock className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <CardTitle className="text-2xl text-white">Read Anywhere</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 leading-relaxed">
                  Seamless reading across all your devices. Pick up exactly where you left off, whether on phone, tablet, or computer.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-900/30 to-amber-800/30 border-amber-500/30 backdrop-blur-sm hover:transform hover:scale-105 transition-all duration-300">
              <CardHeader className="text-center pb-3">
                <TrendingUp className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                <CardTitle className="text-2xl text-white">Track Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 leading-relaxed">
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
            {/* Free Trial Plan */}
            <Card className="bg-white border-2 border-gray-200 hover:border-orange-200 backdrop-blur-sm hover:transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
              <CardHeader className="text-center pb-6">
                <Zap className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                <CardTitle className="text-2xl text-gray-900 mb-2">Free Trial</CardTitle>
                <div className="text-4xl font-bold text-gray-900 mb-2">£0</div>
                <div className="text-gray-500">7 days free</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-orange-500 mr-3" />
                    <span className="text-gray-700">Access to 3 books for 7 days</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-orange-500 mr-3" />
                    <span className="text-gray-700">Basic reading features</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-orange-500 mr-3" />
                    <span className="text-gray-700">Progress tracking</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-orange-500 mr-3" />
                    <span className="text-gray-700">Mobile & desktop access</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-orange-500 mr-3" />
                    <span className="text-gray-700">No credit card required</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-orange-500 mr-3" />
                    <span className="text-gray-700">Upgrade anytime to continue</span>
                  </div>
                </div>
                <Button 
                  onClick={() => window.location.href = "/auth/login"}
                  className="w-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white mt-6 font-semibold"
                >
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            {/* Basic Plan */}
            <Card className="bg-white border-2 border-orange-300 hover:border-orange-400 backdrop-blur-sm hover:transform hover:scale-105 transition-all duration-300 relative shadow-lg hover:shadow-xl">
              <CardHeader className="text-center pb-6">
                <Star className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <CardTitle className="text-2xl text-gray-900 mb-2">Basic Plan</CardTitle>
                <div className="text-4xl font-bold text-orange-600 mb-2">£5.99</div>
                <div className="text-orange-500">per month</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-orange-500 mr-3" />
                    <span className="text-gray-700">10 books per month</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-orange-500 mr-3" />
                    <span className="text-gray-700">All reading features</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-orange-500 mr-3" />
                    <span className="text-gray-700">Progress & bookmarks</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-orange-500 mr-3" />
                    <span className="text-gray-700">Offline reading</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-orange-500 mr-3" />
                    <span className="text-gray-700">Customer support</span>
                  </div>
                </div>
                <Button 
                  onClick={() => window.location.href = "/auth/login"}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white mt-6 font-semibold"
                >
                  Choose Basic
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-400 hover:border-orange-500 backdrop-blur-sm hover:transform hover:scale-105 transition-all duration-300 relative shadow-xl">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold px-4 py-1 shadow-lg">
                  MOST POPULAR
                </Badge>
              </div>
              <CardHeader className="text-center pb-6 pt-8">
                <Crown className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                <CardTitle className="text-2xl text-gray-900 mb-2">Premium Plan</CardTitle>
                <div className="text-4xl font-bold text-orange-600 mb-2">£9.99</div>
                <div className="text-orange-500">per month</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-orange-600 mr-3" />
                    <span className="text-gray-800">Unlimited books</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-orange-600 mr-3" />
                    <span className="text-gray-800">All premium features</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-orange-600 mr-3" />
                    <span className="text-gray-800">Advanced analytics</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-orange-600 mr-3" />
                    <span className="text-gray-800">Priority support</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-orange-600 mr-3" />
                    <span className="text-gray-800">Exclusive early access</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-orange-600 mr-3" />
                    <span className="text-gray-800">Multi-device sync</span>
                  </div>
                </div>
                <Button 
                  onClick={() => window.location.href = "/auth/login"}
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-bold mt-6 shadow-lg"
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
