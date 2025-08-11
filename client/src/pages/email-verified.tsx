import React from "react";
import { Link } from "wouter";
import { CheckCircle, ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function EmailVerified() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-lg mx-auto shadow-xl border-0 bg-white">
        <CardContent className="p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Email Verified Successfully! 🎉
            </h1>
            <p className="text-gray-600 text-base">
              Welcome to Wonderful Books! Your account is now fully activated.
            </p>
          </div>

          {/* Benefits */}
          <div className="mb-8 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center justify-center mb-3">
              <BookOpen className="h-5 w-5 text-orange-600 mr-2" />
              <span className="font-semibold text-orange-800">Your 7-Day Free Trial</span>
            </div>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>✓ Access to premium book collection</li>
              <li>✓ Advanced PDF reading experience</li>
              <li>✓ Progress tracking and bookmarks</li>
              <li>✓ No charges until trial ends</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link href="/dashboard">
              <Button className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold py-3">
                Start Reading Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            
            <Link href="/bookstore">
              <Button variant="outline" className="w-full border-orange-200 text-orange-600 hover:bg-orange-50">
                Browse Book Collection
              </Button>
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Need help? <Link href="/support" className="text-orange-600 hover:underline">Contact Support</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}