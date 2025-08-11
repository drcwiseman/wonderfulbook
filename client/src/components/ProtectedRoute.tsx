import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireSubscription?: boolean;
  allowedRoles?: string[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({
  children,
  requireAuth = false,
  requireSubscription = false,
  allowedRoles = [],
  redirectTo = "/auth/login",
  fallback
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (isLoading) return;

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "You need to be logged in to access this page.",
        variant: "destructive",
      });
      setLocation(redirectTo);
      return;
    }

    // Check subscription requirement
    if (requireSubscription && user) {
      const userSubscription = (user as any).subscriptionTier;
      const subscriptionStatus = (user as any).subscriptionStatus;
      const freeTrialEndedAt = (user as any).freeTrialEndedAt;
      
      // Allow access if user has an active subscription OR is in valid free trial
      const hasActiveSubscription = subscriptionStatus === "active" && (userSubscription === "basic" || userSubscription === "premium");
      const isInFreeTrial = userSubscription === "free" && 
                           subscriptionStatus === "active" && 
                           freeTrialEndedAt && 
                           new Date(freeTrialEndedAt) > new Date();
      
      if (!hasActiveSubscription && !isInFreeTrial) {
        toast({
          title: "Subscription Required",
          description: "You need an active subscription to access this content.",
          variant: "destructive",
        });
        setLocation("/subscribe");
        return;
      }
    }

    // Check role-based access
    if (allowedRoles.length > 0 && user) {
      const userRole = (user as any).role || "user";
      if (!allowedRoles.includes(userRole)) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        });
        setLocation("/dashboard");
        return;
      }
    }
  }, [
    isLoading,
    isAuthenticated,
    user,
    requireAuth,
    requireSubscription,
    allowedRoles,
    redirectTo,
    setLocation,
    toast
  ]);

  // Show loading state
  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-sm text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Check if user should be redirected (don't render content)
  if (requireAuth && !isAuthenticated) return null;
  
  if (requireSubscription && user) {
    const userSubscription = (user as any).subscriptionTier;
    const subscriptionStatus = (user as any).subscriptionStatus;
    if (userSubscription === "free" || subscriptionStatus !== "active") return null;
  }

  if (allowedRoles.length > 0 && user) {
    const userRole = (user as any).role || "user";
    if (!allowedRoles.includes(userRole)) return null;
  }

  return <>{children}</>;
}