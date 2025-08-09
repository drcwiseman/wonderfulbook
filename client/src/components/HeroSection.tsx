import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="relative h-screen flex items-center">
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent z-10"></div>
      <div 
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
        className="absolute inset-0"
      ></div>
      
      <div className="relative z-20 px-4 md:px-8 max-w-4xl">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
          Unlimited access to thousands of books
        </h1>
        <p className="text-xl md:text-2xl mb-6 text-gray-300 max-w-2xl">
          Read anywhere, anytime. No downloads required. Transform your mind with our curated collection of life-changing books.
        </p>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          {isAuthenticated ? (
            <Button 
              onClick={() => window.location.href = "#featured"}
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-md font-semibold transition-colors text-lg"
            >
              Browse Books
            </Button>
          ) : (
            <Button 
              onClick={() => window.location.href = "/auth/login"}
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-md font-semibold transition-colors text-lg"
            >
              Start Free Trial
            </Button>
          )}
          <Button 
            variant="outline"
            className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-md font-semibold transition-colors text-lg backdrop-blur-sm border-white/30"
          >
            Learn More
          </Button>
        </div>
      </div>
    </section>
  );
}
