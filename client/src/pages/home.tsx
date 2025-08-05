import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturedBooks from "@/components/FeaturedBooks";
import CategoriesSection from "@/components/CategoriesSection";
import RecommendationsSection from "@/components/RecommendationsSection";
import Footer from "@/components/Footer";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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
      <FeaturedBooks />
      <CategoriesSection />
      <RecommendationsSection />
      <Footer />
    </div>
  );
}
