import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Menu, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of your account.",
      });
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Logout failed",
        description: error.message || "Something went wrong during logout.",
        variant: "destructive",
      });
    },
  });

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

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-gray-900 via-gray-900/95 to-transparent backdrop-blur-sm">
        <nav className="flex items-center justify-between px-4 md:px-8 py-4">
          <div className="flex items-center space-x-8">
            <div className="text-orange-500 text-2xl font-bold">Wonderful Books</div>
            <div className="hidden md:flex space-x-6">
              <a href="/" className="text-white hover:text-orange-300 transition-colors font-medium">Home</a>
              <a href="/bookstore" className="text-white hover:text-orange-300 transition-colors font-medium">Book Store</a>
              {isAuthenticated && (
                <>
                  <a href="/library" className="text-white hover:text-orange-300 transition-colors font-medium">My Library</a>
                  <a href="/dashboard" className="text-white hover:text-orange-300 transition-colors font-medium">Dashboard</a>
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
                className="bg-gray-800 text-white px-4 py-2 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600"
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
                    <span className="px-2 py-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold rounded">
                      PREMIUM
                    </span>
                  )}
                  {(user as any)?.subscriptionTier === 'basic' && (
                    <span className="px-2 py-1 bg-orange-400 text-white text-xs font-bold rounded">
                      BASIC
                    </span>
                  )}
                  {((user as any)?.subscriptionTier === 'free' || !(user as any)?.subscriptionTier) && (
                    <span className="px-2 py-1 bg-gray-600 text-white text-xs font-bold rounded">
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
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="text-white hover:text-orange-400"
                >
                  {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => window.location.href = "/api/login"}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
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
        <div className="fixed inset-0 z-50 bg-gray-900 md:hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="text-orange-500 text-2xl font-bold">Wonderful Books</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="text-white hover:text-orange-400"
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
                className="bg-gray-800 text-white border-gray-600 focus:ring-orange-500"
              />
            </form>
            
            <nav className="space-y-4">
              <a href="/" className="block py-2 text-white hover:text-orange-300 text-lg border-b border-gray-700 font-medium">Home</a>
              <a href="/bookstore" className="block py-2 text-white hover:text-orange-300 text-lg border-b border-gray-700 font-medium">Book Store</a>
              {isAuthenticated && (
                <>
                  <a href="/library" className="block py-2 text-white hover:text-orange-300 text-lg border-b border-gray-700 font-medium">My Library</a>
                  <a href="/dashboard" className="block py-2 text-white hover:text-orange-300 text-lg font-medium">Dashboard</a>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
