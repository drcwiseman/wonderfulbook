import React, { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { CheckCircle, X, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Unsubscribe() {
  const [location] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading');
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  // Get token from URL params
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const token = urlParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setMessage('Invalid unsubscribe link. No token provided.');
      return;
    }

    // Process unsubscribe request
    const processUnsubscribe = async () => {
      try {
        const response = await fetch(`/api/unsubscribe?token=${token}`, {
          method: 'POST',
        });

        if (response.ok) {
          setStatus('success');
          setMessage('You have been successfully unsubscribed from our emails.');
        } else {
          const data = await response.json();
          setStatus('error');
          setMessage(data.message || 'Failed to unsubscribe. Please try again.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred while processing your request.');
      }
    };

    processUnsubscribe();
  }, [token]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Processing your unsubscribe request...</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Successfully Unsubscribed
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-800">
                  You will no longer receive marketing emails from Wonderful Books.
                  Important account notifications may still be sent.
                </p>
              </div>
              
              <Link href="/">
                <Button className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return to Wonderful Books
                </Button>
              </Link>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Unsubscribe Failed
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-800">
                  If you continue to have issues, please contact our support team directly.
                </p>
              </div>
              
              <div className="flex gap-3 justify-center">
                <Link href="/support">
                  <Button variant="outline">
                    <Mail className="mr-2 h-4 w-4" />
                    Contact Support
                  </Button>
                </Link>
                
                <Link href="/">
                  <Button className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white">
                    Return Home
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        );

      case 'invalid':
      default:
        return (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <X className="h-8 w-8 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Invalid Unsubscribe Link
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            
            <Link href="/support">
              <Button className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white">
                Contact Support
              </Button>
            </Link>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-lg mx-auto shadow-xl border-0 bg-white">
        <CardHeader className="text-center pb-2">
          <CardTitle className="flex items-center justify-center text-orange-600">
            <Mail className="mr-2 h-6 w-6" />
            Email Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}