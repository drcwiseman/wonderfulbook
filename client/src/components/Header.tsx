import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Menu, X, Home, BookOpen, Library, BarChart3, User, LogOut, Crown, Trophy, Settings, Shield } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();

  // Scroll detection for header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

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



  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isActive = (path: string) => location === path;

  // Core navigation items for desktop (reduced for space)
  const coreNavigationItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/bookstore", label: "Store", icon: BookOpen },
    ...(isAuthenticated ? [
      { href: "/library", label: "Library", icon: Library },
      { href: "/dashboard", label: "Dashboard", icon: BarChart3 }
    ] : [])
  ];

  // All navigation items for mobile menu
  const navigationItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/bookstore", label: "Book Store", icon: BookOpen },
    ...(isAuthenticated ? [
      { href: "/library", label: "My Library", icon: Library },
      { href: "/challenges", label: "Challenges", icon: Trophy },
      { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
      { href: "/subscribe", label: "Subscription", icon: Crown }
    ] : [])
  ];

  // Admin navigation items (shown in dropdown)
  const adminItems = [
    ...(isAuthenticated && (user as any)?.role === 'admin' ? [
      { href: "/admin", label: "Admin Panel", icon: Shield },
      { href: "/admin/email-management", label: "Email Management", icon: Settings },
      { href: "/testing-qa", label: "Testing & QA", icon: Settings }
    ] : []),
    ...(isAuthenticated && (user as any)?.role === 'super_admin' ? [
      { href: "/super-admin", label: "Super Admin", icon: Crown },
      { href: "/admin", label: "Admin Panel", icon: Shield },
      { href: "/admin/email-management", label: "Email Management", icon: Settings },
      { href: "/testing-qa", label: "Testing & QA", icon: Settings }
    ] : [])
  ];

  return (
    <>
      <motion.header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-gray-900/95 backdrop-blur-md shadow-lg shadow-black/20' 
            : 'bg-gradient-to-b from-gray-900 via-gray-900/95 to-transparent backdrop-blur-sm'
        } safe-area-top`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <nav className="flex items-center justify-between px-4 sm:px-6 md:px-8 py-3 md:py-4">
          {/* Logo */}
          <motion.div 
            className="flex items-center space-x-4 sm:space-x-8"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <a href="/" className="text-orange-500 text-xl sm:text-2xl font-bold hover:text-orange-400 transition-colors flex items-center gap-2">
              <BookOpen className="w-6 h-6 sm:w-7 sm:h-7" />
              <span className="hidden sm:block">Wonderful Books</span>
              <span className="sm:hidden">WB</span>
            </a>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-1">
              {coreNavigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    className={`nav-link flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                      isActive(item.href)
                        ? 'bg-orange-500/20 text-orange-400 shadow-lg active'
                        : 'text-white hover:text-orange-300 hover:bg-white/5'
                    }`}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </motion.a>
                );
              })}
            </div>
          </motion.div>
          
          {/* Right Side - User Section */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* Subscription Plan Badge */}
                <motion.div 
                  className="hidden md:block"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  {(user as any)?.subscriptionTier === 'premium' && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold rounded-full shadow-lg">
                      <Crown className="w-3 h-3" />
                      PREMIUM
                    </div>
                  )}
                  {(user as any)?.subscriptionTier === 'basic' && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-orange-400 text-white text-xs font-bold rounded-full shadow-lg">
                      <BarChart3 className="w-3 h-3" />
                      BASIC
                    </div>
                  )}
                  {((user as any)?.subscriptionTier === 'free' || !(user as any)?.subscriptionTier) && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white text-xs font-bold rounded-full shadow-lg">
                      <User className="w-3 h-3" />
                      FREE TRIAL
                    </div>
                  )}
                </motion.div>
                
                {/* Super Admin Link - Only for Super Admin users */}
                {((user as any)?.role === 'super_admin' || (user as any)?.email === 'prophetclimate@yahoo.com') ? (
                  <motion.a
                    href="/super-admin"
                    className={`nav-link flex items-center gap-1 px-2 py-2 rounded-lg transition-all duration-200 font-medium ${
                      isActive('/super-admin')
                        ? 'bg-red-500/20 text-red-400 shadow-lg active'
                        : 'text-white hover:text-red-300 hover:bg-white/5'
                    }`}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    title="Super Admin Dashboard"
                  >
                    <Shield className="w-4 h-4" />
                  </motion.a>
                ) : null}

                {/* Admin Access - For admin and super admin users */}
                {((user as any)?.role === 'admin' || (user as any)?.role === 'super_admin' || (user as any)?.email === 'prophetclimate@yahoo.com' || (user as any)?.email === 'admin@wonderfulbooks.com') ? (
                  <motion.a
                    href="/admin"
                    className={`nav-link flex items-center gap-1 px-2 py-2 rounded-lg transition-all duration-200 font-medium ${
                      isActive('/admin')
                        ? 'bg-orange-500/20 text-orange-400 shadow-lg active'
                        : 'text-white hover:text-orange-300 hover:bg-white/5'
                    }`}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    title="Admin Panel"
                  >
                    <Settings className="w-4 h-4" />
                  </motion.a>
                ) : null}
                
                {/* User Profile with Dropdown */}
                <motion.a
                  href="/profile"
                  className="flex items-center space-x-2 hover:bg-white/10 rounded-lg p-2 transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                  title="Profile Settings"
                >
                  <img
                    src={(user as any)?.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"}
                    alt="User profile"
                    className="w-9 h-9 rounded-full object-cover border-2 border-orange-500/50 shadow-lg"
                  />
                  <div className="hidden lg:block text-white">
                    <div className="text-sm font-medium">{(user as any)?.firstName}</div>
                    <div className="text-xs text-gray-400">View Profile</div>
                  </div>
                </motion.a>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="text-white hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 flex items-center gap-2 px-3 py-2 border border-transparent hover:border-red-400/20"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">{logoutMutation.isPending ? 'Logging out...' : 'Logout'}</span>
                  </Button>
                </motion.div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="ghost"
                    onClick={() => window.location.href = "/auth/register"}
                    className="text-white hover:text-orange-400 hover:bg-white/10 transition-all duration-200 hidden sm:flex"
                  >
                    Register
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    onClick={() => window.location.href = "/auth/login"}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-orange-500/25 transition-all duration-300"
                  >
                    Sign In
                  </Button>
                </motion.div>
              </div>
            )}
            
            {/* Mobile Menu Button */}
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden text-white hover:text-orange-400 hover:bg-white/10 transition-all duration-200"
                onClick={toggleMobileMenu}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isMobileMenuOpen ? 'close' : 'menu'}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </motion.div>
                </AnimatePresence>
              </Button>
            </motion.div>
          </div>
        </nav>
      </motion.header>

      {/* Enhanced Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={toggleMobileMenu}
            />
            
            {/* Mobile Menu Panel */}
            <motion.div
              className="fixed top-0 right-0 h-full w-80 max-w-[85vw] z-50 bg-gradient-to-b from-gray-900 to-gray-800 shadow-2xl md:hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
                <div className="text-orange-500 text-xl font-bold flex items-center gap-2">
                  <BookOpen className="w-6 h-6" />
                  Wonderful Books
                </div>
                <motion.button
                  onClick={toggleMobileMenu}
                  className="text-white hover:text-orange-400 p-2 hover:bg-white/10 rounded-lg transition-all duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>
              
              {/* User Info Section (Mobile) */}
              {isAuthenticated && (
                <motion.div 
                  className="p-6 border-b border-gray-700/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <img
                      src={(user as any)?.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"}
                      alt="User profile"
                      className="w-12 h-12 rounded-full object-cover border-2 border-orange-500/50"
                    />
                    <div className="text-white">
                      <div className="font-medium">{(user as any)?.firstName} {(user as any)?.lastName}</div>
                      <div className="text-sm text-gray-400">{(user as any)?.email}</div>
                    </div>
                  </div>
                  
                  {/* Mobile Subscription Badge */}
                  <div className="mb-4">
                    {(user as any)?.subscriptionTier === 'premium' && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-bold rounded-full">
                        <Crown className="w-4 h-4" />
                        PREMIUM MEMBER
                      </div>
                    )}
                    {(user as any)?.subscriptionTier === 'basic' && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-400 text-white text-sm font-bold rounded-full">
                        <BarChart3 className="w-4 h-4" />
                        BASIC MEMBER
                      </div>
                    )}
                    {((user as any)?.subscriptionTier === 'free' || !(user as any)?.subscriptionTier) && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-600 text-white text-sm font-bold rounded-full">
                        <User className="w-4 h-4" />
                        FREE TRIAL
                      </div>
                    )}
                  </div>
                  
                  {/* Edit Profile Button for Mobile */}
                  <motion.a
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-all duration-200 text-sm font-medium"
                    onClick={toggleMobileMenu}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <User className="w-4 h-4" />
                    Edit Profile
                  </motion.a>
                </motion.div>
              )}
              
              {/* Navigation Links */}
              <div className="p-6">
                <nav className="space-y-2">
                  {navigationItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <motion.a
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-200 font-medium ${
                          isActive(item.href)
                            ? 'bg-orange-500/20 text-orange-400 shadow-lg border border-orange-500/30'
                            : 'text-white hover:text-orange-300 hover:bg-white/10'
                        }`}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.1, duration: 0.3 }}
                        onClick={toggleMobileMenu}
                      >
                        <Icon className="w-5 h-5" />
                        {item.label}
                      </motion.a>
                    );
                  })}
                  
                  {/* Admin Links in Mobile */}
                  {adminItems.length > 0 && (
                    <>
                      <div className="border-t border-gray-700/50 my-4 pt-4">
                        <p className="text-gray-400 text-sm font-medium mb-2 px-4">Admin</p>
                        {adminItems.map((item, index) => {
                          const Icon = item.icon;
                          return (
                            <motion.a
                              key={item.href}
                              href={item.href}
                              className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-200 font-medium ${
                                isActive(item.href)
                                  ? 'bg-orange-500/20 text-orange-400 shadow-lg border border-orange-500/30'
                                  : 'text-white hover:text-orange-300 hover:bg-white/10'
                              }`}
                              initial={{ opacity: 0, x: 50 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                              onClick={toggleMobileMenu}
                            >
                              <Icon className="w-5 h-5" />
                              {item.label}
                            </motion.a>
                          );
                        })}
                      </div>
                    </>
                  )}
                  

                </nav>
                
                {/* Mobile Auth Actions */}
                {!isAuthenticated ? (
                  <div className="mt-6 space-y-3">
                    <Button 
                      onClick={() => {
                        toggleMobileMenu();
                        window.location.href = "/auth/login";
                      }}
                      variant="ghost"
                      className="w-full text-white hover:text-orange-300 hover:bg-white/10 justify-start"
                    >
                      <User className="w-5 h-5 mr-3" />
                      Sign In
                    </Button>
                    <Button 
                      onClick={() => {
                        toggleMobileMenu();
                        window.location.href = "/auth/register";
                      }}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white justify-start"
                    >
                      <Crown className="w-5 h-5 mr-3" />
                      Get Started
                    </Button>
                  </div>
                ) : (
                  <div className="mt-6">
                    <Button
                      onClick={() => {
                        toggleMobileMenu();
                        handleLogout();
                      }}
                      variant="ghost"
                      disabled={logoutMutation.isPending}
                      className="w-full text-white hover:text-red-300 hover:bg-red-500/10 justify-start"
                    >
                      <LogOut className="w-5 h-5 mr-3" />
                      {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
