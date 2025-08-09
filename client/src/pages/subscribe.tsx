import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowLeft } from "lucide-react";

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
        className="w-full bg-netflix-red hover:bg-red-700"
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
      setClientSecret(data.clientSecret);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create subscription",
        variant: "destructive",
      });
    } finally {
      setIsCreatingSubscription(false);
      setLoadingTier(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-netflix-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-netflix-red border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-netflix-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl mb-4">Please Login to Continue</h2>
          <p className="text-gray-400 mb-6">You need to be logged in to access subscription plans</p>
          <Button 
            onClick={() => window.location.href = "/auth/login"}
            className="bg-netflix-red hover:bg-red-700"
          >
            Login Now
          </Button>
        </div>
      </div>
    );
  }

  if (clientSecret && selectedTier) {
    return (
      <div className="min-h-screen bg-netflix-black text-white">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => {
              setClientSecret("");
              setSelectedTier("");
            }}
            className="mb-6 text-white hover:text-netflix-red"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Plans
          </Button>

          <div className="max-w-md mx-auto">
            <Card className="bg-netflix-gray border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-center">
                  Complete Your {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Subscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <SubscribeForm tier={selectedTier} />
                </Elements>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-netflix-black text-white">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="mb-6 text-white hover:text-netflix-red"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Choose Your Reading Journey</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Select the perfect plan for your transformational reading experience
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Trial */}
          <Card className="bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 hover:border-trial-gray transition-all duration-300">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-2">Free Trial</h3>
              <div className="text-trial-gray text-lg mb-4">Perfect for exploring</div>
              <div className="text-4xl font-bold mb-2">£0</div>
              <div className="text-gray-400 mb-6">14 days free</div>
              
              <ul className="space-y-3 mb-8 text-left">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-trial-gray mr-3" />
                  Access to 3 featured books
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-trial-gray mr-3" />
                  Basic reading features
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-trial-gray mr-3" />
                  Mobile & desktop access
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-trial-gray mr-3" />
                  Progress tracking
                </li>
              </ul>
              
              <Button 
                onClick={() => handleTierSelection('free')}
                disabled={isCreatingSubscription}
                className="w-full bg-trial-gray hover:bg-gray-600 text-white disabled:opacity-50"
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
          <Card className="bg-gradient-to-b from-purple-900 to-purple-800 border-2 border-basic-purple hover:border-purple-400 transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-8 text-center">
              <Badge className="bg-basic-purple text-white mb-4">Most Popular</Badge>
              <h3 className="text-2xl font-bold mb-2">Basic</h3>
              <div className="text-basic-purple text-lg mb-4">Great for regular readers</div>
              <div className="text-4xl font-bold mb-2">£9.99</div>
              <div className="text-gray-300 mb-6">per month</div>
              
              <ul className="space-y-3 mb-8 text-left">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-basic-purple mr-3" />
                  Access to 10 books monthly
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-basic-purple mr-3" />
                  All reading features
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-basic-purple mr-3" />
                  Bookmarks & annotations
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-basic-purple mr-3" />
                  Offline reading
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-basic-purple mr-3" />
                  Personal recommendations
                </li>
              </ul>
              
              <Button 
                onClick={() => handleTierSelection('basic')}
                disabled={isCreatingSubscription}
                className="w-full bg-basic-purple hover:bg-purple-600 text-white disabled:opacity-50"
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
          <Card className="bg-gradient-to-b from-yellow-900 to-yellow-800 border-2 border-premium-gold hover:border-yellow-400 transition-all duration-300">
            <CardContent className="p-8 text-center">
              <Badge className="bg-premium-gold text-netflix-black mb-4">BEST VALUE</Badge>
              <h3 className="text-2xl font-bold mb-2">Premium</h3>
              <div className="text-premium-gold text-lg mb-4">Unlimited access</div>
              <div className="text-4xl font-bold mb-2">£19.99</div>
              <div className="text-gray-300 mb-6">per month</div>
              
              <ul className="space-y-3 mb-8 text-left">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-premium-gold mr-3" />
                  Unlimited book access
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-premium-gold mr-3" />
                  Premium reading features
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-premium-gold mr-3" />
                  Advanced annotations
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-premium-gold mr-3" />
                  Priority support
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-premium-gold mr-3" />
                  Exclusive early access
                </li>
              </ul>
              
              <Button 
                onClick={() => handleTierSelection('premium')}
                disabled={isCreatingSubscription}
                className="w-full bg-premium-gold hover:bg-yellow-400 text-netflix-black disabled:opacity-50"
              >
                {loadingTier === 'premium' ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-netflix-black border-t-transparent rounded-full mr-2" />
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
  );
}
