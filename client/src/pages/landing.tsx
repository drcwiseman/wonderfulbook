import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PricingSection from "@/components/PricingSection";
import FeaturedBooks from "@/components/FeaturedBooks";
import CategoriesSection from "@/components/CategoriesSection";
import RecommendationsSection from "@/components/RecommendationsSection";
import Footer from "@/components/Footer";

export default function Landing() {
  return (
    <div className="min-h-screen bg-netflix-black text-white">
      <Header />
      <HeroSection />
      <PricingSection />
      <FeaturedBooks />
      <CategoriesSection />
      <RecommendationsSection />
      <Footer />
    </div>
  );
}
