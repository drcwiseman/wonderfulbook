import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Crown, Calendar, Download, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import PageHeader from "@/components/PageHeader";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Billing() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  if (!isAuthenticated) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-white pt-20 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">Please log in to view your billing information.</p>
            <Button onClick={() => setLocation("/auth/login")}>
              Sign In
            </Button>
          </div>
        </div>
      </>
    );
  }

  const handleDownloadInvoice = () => {
    toast({
      title: "Invoice Download",
      description: "Your invoice will be available soon.",
    });
  };

  const handleUpdatePayment = () => {
    toast({
      title: "Payment Update",
      description: "Redirecting to payment portal...",
    });
  };

  const handleCancelSubscription = () => {
    toast({
      title: "Cancel Subscription",
      description: "Contact support to cancel your subscription.",
      variant: "destructive",
    });
  };

  return (
    <>
      <Header />
      <PageHeader
        title="Billing & Subscription"
        subtitle="Manage your subscription and billing information"
        icon={<CreditCard className="h-8 w-8" />}
        showBackButton
        onBackClick={() => setLocation("/dashboard")}
      />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Current Plan */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  <span>Current Plan</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-lg">
                      {(user as any)?.subscriptionPlan || 'Premium Plan'}
                    </span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    £9.99<span className="text-sm font-normal text-gray-500">/month</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Unlimited books • No ads • Premium support
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>Next billing: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-8 w-8 text-gray-400" />
                    <div>
                      <div className="font-medium">•••• •••• •••• 4242</div>
                      <div className="text-sm text-gray-500">Expires 12/24</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleUpdatePayment}>
                    Update Payment Method
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Billing History */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                Your recent invoices and payment history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { date: "2024-01-10", amount: "£9.99", status: "Paid", invoice: "INV-001" },
                  { date: "2023-12-10", amount: "£9.99", status: "Paid", invoice: "INV-002" },
                  { date: "2023-11-10", amount: "£9.99", status: "Paid", invoice: "INV-003" },
                ].map((bill, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="font-medium">{bill.invoice}</div>
                          <div className="text-sm text-gray-500">{bill.date}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant={bill.status === "Paid" ? "default" : "destructive"}>
                          {bill.status}
                        </Badge>
                        <span className="font-medium">{bill.amount}</span>
                        <Button variant="outline" size="sm" onClick={handleDownloadInvoice}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                    {index < 2 && <Separator />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Subscription Management */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription Management</CardTitle>
              <CardDescription>
                Manage your subscription settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Auto-renewal</h4>
                    <p className="text-sm text-gray-500">
                      Your subscription will automatically renew each month
                    </p>
                  </div>
                  <Badge variant="default">Enabled</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Billing notifications</h4>
                    <p className="text-sm text-gray-500">
                      Get notified before each billing cycle
                    </p>
                  </div>
                  <Badge variant="default">Enabled</Badge>
                </div>

                <Separator />

                <div className="pt-4">
                  <h4 className="font-medium mb-4 text-red-600">Danger Zone</h4>
                  <Button 
                    variant="destructive" 
                    onClick={handleCancelSubscription}
                  >
                    Cancel Subscription
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    You'll continue to have access until the end of your current billing period.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}