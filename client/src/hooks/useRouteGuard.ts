import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface RouteGuardOptions {
  requireAuth?: boolean;
  requireSubscription?: boolean;
  allowedRoles?: string[];
  redirectTo?: string;
  onUnauthorized?: () => void;
}

export function useRouteGuard(options: RouteGuardOptions = {}) {
  const {
    requireAuth = false,
    requireSubscription = false,
    allowedRoles = [],
    redirectTo = "/auth/login",
    onUnauthorized
  } = options;
  
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;

    let shouldRedirect = false;
    let redirectTarget = redirectTo;

    // Check authentication
    if (requireAuth && !isAuthenticated) {
      shouldRedirect = true;
      redirectTarget = "/auth/login";
    }

    // Check subscription
    if (requireSubscription && user && isAuthenticated) {
      const userSubscription = (user as any).subscriptionTier;
      const subscriptionStatus = (user as any).subscriptionStatus;
      
      if (userSubscription === "free" || subscriptionStatus !== "active") {
        shouldRedirect = true;
        redirectTarget = "/subscribe";
      }
    }

    // Check role access
    if (allowedRoles.length > 0 && user && isAuthenticated) {
      const userRole = (user as any).role || "user";
      if (!allowedRoles.includes(userRole)) {
        shouldRedirect = true;
        redirectTarget = "/dashboard";
      }
    }

    if (shouldRedirect) {
      if (onUnauthorized) {
        onUnauthorized();
      }
      setLocation(redirectTarget);
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
    onUnauthorized
  ]);

  return {
    isAuthorized: !isLoading && (
      (!requireAuth || isAuthenticated) &&
      (!requireSubscription || (user && (user as any).subscriptionStatus === "active")) &&
      (allowedRoles.length === 0 || (user && allowedRoles.includes((user as any).role || "user")))
    ),
    isLoading,
    user
  };
}