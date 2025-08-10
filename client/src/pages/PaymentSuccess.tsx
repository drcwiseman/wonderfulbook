import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function PaymentSuccess() {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Redirect to home after 5 seconds
    const timer = setTimeout(() => {
      window.location.href = "/";
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border-gray-200">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-300">
            Welcome to Wonderful Books! Your subscription is now active.
          </p>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-600 mb-2">What's Next?</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Browse our extensive book collection</li>
              <li>• Start reading with our premium PDF reader</li>
              <li>• Track your reading progress</li>
              <li>• Enjoy unlimited access to your plan</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => window.location.href = "/"}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Start Reading
            </Button>
            
            <p className="text-xs text-gray-400">
              Redirecting automatically in 5 seconds...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}