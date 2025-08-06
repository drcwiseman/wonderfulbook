import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Menu, X } from "lucide-react";

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results or update URL with search params
      console.log("Search query:", searchQuery);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-netflix-black via-netflix-black/90 to-transparent">
        <nav className="flex items-center justify-between px-4 md:px-8 py-4">
          <div className="flex items-center space-x-8">
            <div className="text-netflix-red text-2xl font-bold">Wonderful Books</div>
            <div className="hidden md:flex space-x-6">
              <a href="/" className="text-white hover:text-gray-300 transition-colors">Home</a>
              <a href="#categories" className="text-white hover:text-gray-300 transition-colors">Categories</a>
              {isAuthenticated && (
                <>
                  <a href="/dashboard" className="text-white hover:text-gray-300 transition-colors">Dashboard</a>
                  <a href="#my-books" className="text-white hover:text-gray-300 transition-colors">My Books</a>
                  <a href="#bookmarks" className="text-white hover:text-gray-300 transition-colors">Bookmarks</a>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <form onSubmit={handleSearch} className="hidden md:block relative">
              <Input
                type="text"
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-netflix-gray text-white px-4 py-2 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-netflix-red border-none"
              />
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
            </form>
            
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-white"
              onClick={toggleMobileMenu}
            >
              <Search className="h-4 w-4" />
            </Button>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {/* Subscription Plan Badge */}
                <div className="hidden md:block">
                  {(user as any)?.subscriptionTier === 'premium' && (
                    <span className="px-2 py-1 bg-premium-gold text-netflix-black text-xs font-bold rounded">
                      PREMIUM
                    </span>
                  )}
                  {(user as any)?.subscriptionTier === 'basic' && (
                    <span className="px-2 py-1 bg-basic-purple text-white text-xs font-bold rounded">
                      BASIC
                    </span>
                  )}
                  {((user as any)?.subscriptionTier === 'free' || !(user as any)?.subscriptionTier) && (
                    <span className="px-2 py-1 bg-trial-gray text-white text-xs font-bold rounded">
                      FREE TRIAL
                    </span>
                  )}
                </div>
                
                <img
                  src={(user as any)?.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"}
                  alt="User profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = "/api/logout"}
                  className="text-white hover:text-netflix-red"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => window.location.href = "/api/login"}
                className="bg-netflix-red hover:bg-red-700"
              >
                Sign In
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-white"
              onClick={toggleMobileMenu}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-netflix-black md:hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="text-netflix-red text-2xl font-bold">Wonderful Books</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-4">
            <form onSubmit={handleSearch} className="mb-6">
              <Input
                type="text"
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-netflix-gray text-white border-gray-600"
              />
            </form>
            
            <nav className="space-y-4">
              <a href="/" className="block py-2 text-white text-lg border-b border-gray-700">Home</a>
              <a href="#categories" className="block py-2 text-white text-lg border-b border-gray-700">Categories</a>
              {isAuthenticated && (
                <>
                  <a href="#my-books" className="block py-2 text-white text-lg border-b border-gray-700">My Books</a>
                  <a href="#bookmarks" className="block py-2 text-white text-lg">Bookmarks</a>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
