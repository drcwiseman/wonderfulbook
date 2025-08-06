import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Crown, 
  Star, 
  Calendar, 
  Target,
  CreditCard,
  Settings,
  Bookmark,
  TrendingUp
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Redirect if not authenticated
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

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['/api/user/dashboard'],
    enabled: !!isAuthenticated,
  });

  // Fetch reading progress
  const { data: readingHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['/api/reading-history'],
    enabled: !!isAuthenticated,
  });

  // Fetch bookmarks
  const { data: bookmarks = [], isLoading: bookmarksLoading } = useQuery({
    queryKey: ['/api/bookmarks'],
    enabled: !!isAuthenticated,
  });

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async (tier: string) => {
      const response = await apiRequest("POST", "/api/create-subscription", { tier });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.clientSecret) {
        // Redirect to subscription page with the client secret
        setLocation(`/subscribe?client_secret=${data.clientSecret}`);
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to create subscription",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen bg-netflix-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  const currentTier = (user as any)?.subscriptionTier || 'free';
  const subscriptionStatus = (user as any)?.subscriptionStatus || 'inactive';
  
  // Tier configurations
  const tierConfig = {
    free: { name: 'Free Trial', limit: 3, color: 'bg-gray-500', icon: BookOpen },
    basic: { name: 'Basic Plan', limit: 10, color: 'bg-blue-500', icon: Star },
    premium: { name: 'Premium Plan', limit: 'Unlimited', color: 'bg-yellow-500', icon: Crown }
  };

  const currentConfig = tierConfig[currentTier as keyof typeof tierConfig] || tierConfig.free;
  const booksRead = (user as any)?.booksReadThisMonth || 0;
  const progressPercentage = currentTier === 'premium' ? 100 : 
    currentConfig.limit === 'Unlimited' ? 100 : (booksRead / (currentConfig.limit as number)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-semibold">
              {(user as any)?.firstName?.charAt(0) || 'U'}{(user as any)?.lastName?.charAt(0) || ''}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {(user as any)?.firstName || 'Reader'}!
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Continue your learning journey
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation('/')}
            className="flex items-center space-x-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>Browse Books</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Plan Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <currentConfig.icon className="w-5 h-5" />
                  <span>Current Plan</span>
                </CardTitle>
                <CardDescription>
                  Manage your subscription and see your usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-white text-sm ${currentConfig.color}`}>
                      {currentConfig.name}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm ${subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {subscriptionStatus}
                    </span>
                  </div>
                  {currentTier === 'free' && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => setLocation('/subscribe?tier=basic')}
                        disabled={createSubscriptionMutation.isPending}
                      >
                        Upgrade to Basic
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setLocation('/subscribe?tier=premium')}
                        disabled={createSubscriptionMutation.isPending}
                      >
                        Go Premium
                      </Button>
                    </div>
                  )}
                </div>

                {/* Usage Progress */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      Books this month: {booksRead} / {currentConfig.limit}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    ></div>
                  </div>
                  {currentTier === 'free' && booksRead >= 3 && (
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                      You've reached your free trial limit. Upgrade to continue reading!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Books in Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Books in Progress</span>
                </CardTitle>
                <CardDescription>
                  Continue reading where you left off
                </CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : Array.isArray(readingHistory) && readingHistory.length > 0 ? (
                  <div className="space-y-4">
                    {(readingHistory as any[]).slice(0, 5).map((progress: any) => (
                      <div key={progress.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                           onClick={() => setLocation(`/reader/${progress.bookId}`)}>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {progress.book?.title || 'Unknown Book'}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Page {progress.currentPage} of {progress.totalPages}
                          </p>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${Math.min(parseFloat(progress.progressPercentage), 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="ml-3 px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">
                          {progress.progressPercentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-300">
                      No books in progress yet. Start reading to see your progress here!
                    </p>
                    <Button 
                      className="mt-3"
                      onClick={() => setLocation('/')}
                    >
                      Browse Books
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Quick Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Books Read</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">{booksRead}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Bookmarks</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">{Array.isArray(bookmarks) ? bookmarks.length : 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Active Since</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {(user as any)?.createdAt ? new Date((user as any).createdAt).toLocaleDateString() : 'Recently'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Bookmarks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bookmark className="w-5 h-5" />
                  <span>Recent Bookmarks</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bookmarksLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : Array.isArray(bookmarks) && bookmarks.length > 0 ? (
                  <div className="space-y-3">
                    {(bookmarks as any[]).slice(0, 5).map((bookmark: any) => (
                      <div key={bookmark.id} className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">
                          Page {bookmark.page}
                        </div>
                        <div className="text-gray-600 dark:text-gray-300 truncate">
                          {bookmark.note || 'No note'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    No bookmarks yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Account</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Manage Billing
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Account Settings
                </Button>
                <div className="border-t border-gray-200"></div>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-600 hover:text-red-700"
                  onClick={() => window.location.href = "/api/logout"}
                >
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}