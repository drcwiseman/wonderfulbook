import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

export default function PricingSection() {
  const handlePlanSelection = (tier: string) => {
    if (tier === 'free') {
      window.location.href = "/api/login";
    } else {
      window.location.href = "/subscribe";
    }
  };

  return (
    <section className="py-20 px-4 md:px-8 bg-netflix-gray">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Choose Your Reading Journey</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Select the perfect plan for your transformational reading experience
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Trial */}
          <Card className="relative bg-gradient-to-br from-gray-900 to-black border border-gray-700 hover:border-gray-500 transition-all duration-500 hover:scale-105 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-600 to-gray-400"></div>
            <CardContent className="p-8 text-center relative">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2 text-white">Free Trial</h3>
                <div className="text-gray-400 text-sm mb-4">Perfect for exploring</div>
                <div className="flex items-baseline justify-center mb-2">
                  <span className="text-5xl font-bold text-white">£0</span>
                </div>
                <div className="text-gray-400 text-sm">14 days free</div>
              </div>
              
              <div className="space-y-4 mb-8 text-left">
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">Access to 3 featured books</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">Basic reading features</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">Mobile & desktop access</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">Progress tracking</span>
                </div>
              </div>
              
              <Button 
                onClick={() => handlePlanSelection('free')}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-all duration-300"
              >
                Start Free Trial
              </Button>
            </CardContent>
          </Card>

          {/* Basic Plan */}
          <Card className="relative bg-gradient-to-br from-netflix-red to-red-800 border-2 border-netflix-red hover:border-red-400 transition-all duration-500 hover:scale-110 transform overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-netflix-red"></div>
            <div className="absolute top-4 right-4">
              <Badge className="bg-white text-netflix-red font-bold px-3 py-1">POPULAR</Badge>
            </div>
            <CardContent className="p-8 text-center relative">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2 text-white">Basic</h3>
                <div className="text-red-200 text-sm mb-4">Great for regular readers</div>
                <div className="flex items-baseline justify-center mb-2">
                  <span className="text-5xl font-bold text-white">£9</span>
                  <span className="text-2xl text-red-200">.99</span>
                </div>
                <div className="text-red-200 text-sm">per month</div>
              </div>
              
              <div className="space-y-4 mb-8 text-left">
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-white mr-3 flex-shrink-0" />
                  <span className="text-red-100 text-sm">Access to 10 books monthly</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-white mr-3 flex-shrink-0" />
                  <span className="text-red-100 text-sm">All reading features</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-white mr-3 flex-shrink-0" />
                  <span className="text-red-100 text-sm">Bookmarks & annotations</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-white mr-3 flex-shrink-0" />
                  <span className="text-red-100 text-sm">Offline reading</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-white mr-3 flex-shrink-0" />
                  <span className="text-red-100 text-sm">Personal recommendations</span>
                </div>
              </div>
              
              <Button 
                onClick={() => handlePlanSelection('basic')}
                className="w-full bg-white text-netflix-red hover:bg-gray-100 font-bold py-3 rounded-lg transition-all duration-300"
              >
                Choose Basic
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="relative bg-gradient-to-br from-amber-600 to-yellow-600 border-2 border-yellow-500 hover:border-yellow-300 transition-all duration-500 hover:scale-105 overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-300 to-amber-400"></div>
            <div className="absolute top-4 right-4">
              <Badge className="bg-yellow-300 text-amber-900 font-bold px-3 py-1">BEST VALUE</Badge>
            </div>
            <CardContent className="p-8 text-center relative">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2 text-white">Premium</h3>
                <div className="text-yellow-100 text-sm mb-4">Unlimited access</div>
                <div className="flex items-baseline justify-center mb-2">
                  <span className="text-5xl font-bold text-white">£19</span>
                  <span className="text-2xl text-yellow-100">.99</span>
                </div>
                <div className="text-yellow-100 text-sm">per month</div>
              </div>
              
              <div className="space-y-4 mb-8 text-left">
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-white mr-3 flex-shrink-0" />
                  <span className="text-yellow-50 text-sm">Unlimited book access</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-white mr-3 flex-shrink-0" />
                  <span className="text-yellow-50 text-sm">Premium reading features</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-white mr-3 flex-shrink-0" />
                  <span className="text-yellow-50 text-sm">Advanced annotations</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-white mr-3 flex-shrink-0" />
                  <span className="text-yellow-50 text-sm">Priority support</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-white mr-3 flex-shrink-0" />
                  <span className="text-yellow-50 text-sm">Exclusive early access</span>
                </div>
              </div>
              
              <Button 
                onClick={() => handlePlanSelection('premium')}
                className="w-full bg-white text-amber-700 hover:bg-yellow-50 font-bold py-3 rounded-lg transition-all duration-300"
              >
                Choose Premium
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
