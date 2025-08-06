import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturedBooks from "@/components/FeaturedBooks";
import CategoriesSection from "@/components/CategoriesSection";
import RecommendationsSection from "@/components/RecommendationsSection";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Zap, Link } from "lucide-react";

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
      <div className="min-h-screen bg-netflix-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-netflix-red border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-netflix-black text-white">
      <Header />
      <HeroSection />
      
      {/* Quick Subscription Status */}
      {isAuthenticated && (
        <div className="container mx-auto px-4 py-6">
          <Card className="bg-netflix-gray border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {(user as any)?.subscriptionTier === 'premium' && (
                    <>
                      <Crown className="w-5 h-5 text-premium-gold" />
                      <span className="text-white font-medium">Premium Plan - Unlimited Access</span>
                    </>
                  )}
                  {(user as any)?.subscriptionTier === 'basic' && (
                    <>
                      <Star className="w-5 h-5 text-basic-purple" />
                      <span className="text-white font-medium">Basic Plan - 10 Books per Month</span>
                    </>
                  )}
                  {((user as any)?.subscriptionTier === 'free' || !(user as any)?.subscriptionTier) && (
                    <>
                      <Zap className="w-5 h-5 text-trial-gray" />
                      <span className="text-white font-medium">Free Trial - 3 Books Available</span>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.href = "/dashboard"}
                    className="border-gray-500 text-white hover:bg-gray-700"
                  >
                    View Dashboard
                  </Button>
                  {((user as any)?.subscriptionTier === 'free' || !(user as any)?.subscriptionTier) && (
                    <Button 
                      size="sm"
                      onClick={() => window.location.href = "/subscribe"}
                      className="bg-netflix-red hover:bg-red-700"
                    >
                      Upgrade Plan
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      <FeaturedBooks />
      <CategoriesSection />
      <RecommendationsSection />
      <Footer />
    </div>
  );
}
