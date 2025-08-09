import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowLeft, Home, Crown } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Header from "@/components/Header";

// Check which environment variable actually contains the publishable key
const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY?.startsWith('pk_') 
  ? import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  : import.meta.env.VITE_STRIPE_SECRET_KEY;

if (!publicKey?.startsWith('pk_')) {
  throw new Error('No valid Stripe publishable key found (must start with pk_)');
}

const stripePromise = loadStripe(publicKey);

const SubscribeForm = ({ tier }: { tier: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe}
        className="w-full btn-orange-accessible"
        size="lg"
      >
        {!stripe ? "Loading..." : `Subscribe to ${tier.charAt(0).toUpperCase() + tier.slice(1)}`}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("basic");
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Get tier from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const tier = urlParams.get('tier');
    if (tier && ['basic', 'premium'].includes(tier)) {
      handleTierSelection(tier);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Please Login",
        description: "You need to be logged in to subscribe",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 2000);
    }
  }, [isAuthenticated, isLoading, toast]);

  const handleTierSelection = async (tier: string) => {
    if (isCreatingSubscription) return; // Prevent multiple clicks
    
    setIsCreatingSubscription(true);
    setLoadingTier(tier);
    
    if (tier === 'free') {
      try {
        await apiRequest("POST", "/api/create-subscription", { tier: 'free' });
        toast({
          title: "Free Trial Activated",
          description: "You now have access to 3 featured books!",
        });
        window.location.href = "/";
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to activate free trial",
          variant: "destructive",
        });
      } finally {
        setIsCreatingSubscription(false);
        setLoadingTier(null);
      }
      return;
    }

    setSelectedTier(tier);
    
    try {
      const response = await apiRequest("POST", "/api/create-subscription", { tier });
      const data = await response.json();
      
      if (data.message === "Free trial activated") {
        toast({
          title: "Free Trial Activated!",
          description: "You now have access to 3 books for 7 days",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
        return;
      }

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        // Don't reset loading states until payment form is ready
      } else if (data.subscriptionId) {
        toast({
          title: "Already Subscribed",
          description: "You already have an active subscription",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
        return;
      } else {
        throw new Error("Invalid response from subscription service");
      }
    } catch (error: any) {
      console.error("Subscription creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
      setIsCreatingSubscription(false);
      setLoadingTier(null);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-white flex items-center justify-center pt-20">
          <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full" />
        </div>
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center pt-20">
          <div className="text-center">
            <h2 className="text-2xl mb-4 text-gray-900">Please Login to Continue</h2>
            <p className="text-gray-600 mb-6">You need to be logged in to access subscription plans</p>
            <Button 
              onClick={() => window.location.href = "/auth/login"}
              className="btn-orange-accessible"
            >
              Login Now
            </Button>
          </div>
        </div>
      </>
    );
  }

  if (clientSecret && selectedTier) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-white text-gray-900 pt-20">
          <PageHeader 
            title="Complete Payment"
            subtitle={`Finish your ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} subscription`}
            breadcrumbs={[
              { label: "Home", href: "/", icon: Home },
              { label: "Subscribe", href: "/subscribe", icon: Crown },
              { label: "Payment" }
            ]}
            backButtonLabel="Back to Plans"
            onBackClick={() => {
              setClientSecret("");
              setSelectedTier("");
            }}
          />
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-md mx-auto">
              <Card className="bg-white border-gray-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-gray-900 text-center">
                    Complete Your {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Subscription
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <SubscribeForm tier={selectedTier} />
                  </Elements>
                  {/* Reset loading states once payment form is rendered */}
                  {(() => {
                    if (isCreatingSubscription) {
                      setTimeout(() => {
                        setIsCreatingSubscription(false);
                        setLoadingTier(null);
                      }, 500);
                    }
                    return null;
                  })()}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white text-gray-900 pt-20">
        <PageHeader 
          title="Choose Your Plan"
          subtitle="Select the perfect subscription for your reading journey"
          breadcrumbs={[
            { label: "Home", href: "/", icon: Home },
            { label: "Subscription", icon: Crown }
          ]}
          backButtonLabel="Back to Home"
          backButtonHref="/"
        />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Choose Your Reading Journey</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Select the perfect plan for your transformational reading experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Trial */}
          <Card className="bg-white border-2 border-gray-200 hover:border-orange-300 transition-all duration-300 shadow-lg">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-2 text-gray-900">Free Trial</h3>
              <div className="text-orange-600 text-lg mb-4">Perfect for exploring</div>
              <div className="text-4xl font-bold mb-2 text-gray-900">£0</div>
              <div className="text-gray-600 mb-6">7 days free</div>
              
              <ul className="space-y-3 mb-8 text-left">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-orange-600 mr-3" />
                  Access to 3 featured books
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-orange-600 mr-3" />
                  Basic reading features
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-orange-600 mr-3" />
                  Mobile & desktop access
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-orange-600 mr-3" />
                  Progress tracking
                </li>
              </ul>
              
              <Button 
                onClick={() => handleTierSelection('free')}
                disabled={isCreatingSubscription}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300 disabled:opacity-50"
              >
                {loadingTier === 'free' ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Setting up...
                  </>
                ) : (
                  'Start Free Trial'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Basic Plan */}
          <Card className="bg-white border-2 border-orange-500 hover:border-orange-600 transition-all duration-300 transform hover:scale-105 shadow-lg">
            <CardContent className="p-8 text-center">
              <Badge className="bg-orange-600 text-white mb-4">Most Popular</Badge>
              <h3 className="text-2xl font-bold mb-2 text-gray-900">Basic</h3>
              <div className="text-orange-600 text-lg mb-4">Great for regular readers</div>
              <div className="text-4xl font-bold mb-2 text-gray-900">£5.99</div>
              <div className="text-gray-600 mb-6">per month</div>
              
              <ul className="space-y-3 mb-8 text-left">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-orange-600 mr-3" />
                  Access to 10 books monthly
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-orange-600 mr-3" />
                  All reading features
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-orange-600 mr-3" />
                  Bookmarks & annotations
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-orange-600 mr-3" />
                  Offline reading
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-orange-600 mr-3" />
                  Personal recommendations
                </li>
              </ul>
              
              <Button 
                onClick={() => handleTierSelection('basic')}
                disabled={isCreatingSubscription}
                className="w-full btn-orange-accessible disabled:opacity-50"
              >
                {loadingTier === 'basic' ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Setting up...
                  </>
                ) : (
                  'Choose Basic'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="bg-white border-2 border-orange-400 hover:border-orange-500 transition-all duration-300 shadow-lg">
            <CardContent className="p-8 text-center">
              <Badge className="bg-orange-700 text-white mb-4">BEST VALUE</Badge>
              <h3 className="text-2xl font-bold mb-2 text-gray-900">Premium</h3>
              <div className="text-orange-600 text-lg mb-4">Unlimited access</div>
              <div className="text-4xl font-bold mb-2 text-gray-900">£9.99</div>
              <div className="text-gray-600 mb-6">per month</div>
              
              <ul className="space-y-3 mb-8 text-left">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-orange-600 mr-3" />
                  Unlimited book access
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-orange-600 mr-3" />
                  Premium reading features
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-orange-600 mr-3" />
                  Advanced annotations
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-orange-600 mr-3" />
                  Priority support
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-orange-600 mr-3" />
                  Exclusive early access
                </li>
              </ul>
              
              <Button 
                onClick={() => handleTierSelection('premium')}
                disabled={isCreatingSubscription}
                className="w-full btn-orange-accessible disabled:opacity-50"
              >
                {loadingTier === 'premium' ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Setting up...
                  </>
                ) : (
                  'Choose Premium'
                )}
              </Button>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </>
  );
}
