import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function PricingSection() {
  const { user, isAuthenticated } = useAuth();
  const [isHovered, setIsHovered] = useState<string | null>(null);

  const handleUpgrade = (tier: string) => {
    if (!isAuthenticated) {
      window.location.href = "/auth/login";
    } else {
      window.location.href = `/subscribe?tier=${tier}`;
    }
  };

  const plans = [
    {
      id: "free",
      name: "Free Trial",
      price: "£0",
      period: "forever",
      icon: <Zap className="w-6 h-6 text-orange-500" />,
      description: "Perfect for getting started",
      features: [
        "Access to 3 featured books",
        "Basic reading features",
        "Progress tracking",
        "Mobile & desktop access",
        "No credit card required"
      ],
      buttonText: "Start Free Trial",
      buttonClass: "bg-orange-500 hover:bg-orange-600 text-white",
      cardClass: "border-gray-200 hover:border-orange-500",
      popular: false
    },
    {
      id: "basic",
      name: "Basic Plan",
      price: "£9.99",
      period: "per month",
      icon: <Star className="w-6 h-6 text-orange-600" />,
      description: "Great for regular readers",
      features: [
        "Access to 10 books per month",
        "All reading features",
        "Progress tracking & bookmarks",
        "Mobile & desktop access",
        "Customer support",
        "Offline reading"
      ],
      buttonText: "Choose Basic",
      buttonClass: "bg-orange-600 hover:bg-orange-700 text-white",
      cardClass: "border-gray-200 hover:border-orange-600",
      popular: false
    },
    {
      id: "premium",
      name: "Premium Plan",
      price: "£19.99",
      period: "per month",
      icon: <Crown className="w-6 h-6 text-orange-700" />,
      description: "Best value for book lovers",
      features: [
        "Unlimited access to all books",
        "All premium features",
        "Advanced analytics",
        "Priority customer support",
        "Exclusive early access",
        "Download for offline reading",
        "Multi-device sync",
        "Ad-free experience"
      ],
      buttonText: "Go Premium",
      buttonClass: "bg-orange-700 hover:bg-orange-800 text-white",
      cardClass: "border-orange-700 hover:border-orange-800 ring-2 ring-orange-700/20",
      popular: true
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Choose Your Reading Journey
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Unlock a world of transformational books with our flexible subscription plans. 
            Start your personal growth journey today.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative bg-gray-800/50 backdrop-blur-sm ${plan.cardClass} transition-all duration-300 ${
                isHovered === plan.id ? 'transform scale-105' : ''
              }`}
              onMouseEnter={() => setIsHovered(plan.id)}
              onMouseLeave={() => setIsHovered(null)}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-orange-600 text-white px-4 py-1 text-sm font-bold">
                    MOST POPULAR
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-4">
                  {plan.icon}
                </div>
                <CardTitle className="text-white text-2xl font-bold">
                  {plan.name}
                </CardTitle>
                <div className="text-center">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-400 ml-2">{plan.period}</span>
                </div>
                <p className="text-gray-300 text-sm mt-2">{plan.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-200">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="pt-4">
                  {isAuthenticated && (user as any)?.subscriptionTier === plan.id ? (
                    <Button 
                      disabled
                      className="w-full bg-green-600 text-white cursor-not-allowed"
                    >
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(plan.id)}
                      className={`w-full ${plan.buttonClass} transition-all duration-200 font-semibold`}
                    >
                      {plan.buttonText}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-400 text-sm mb-4">
            All plans include 30-day money-back guarantee • Cancel anytime
          </p>
          <div className="flex justify-center space-x-8 text-sm text-gray-300">
            <span>✓ Secure payments</span>
            <span>✓ Instant access</span>
            <span>✓ No hidden fees</span>
          </div>
        </div>
      </div>
    </section>
  );
}