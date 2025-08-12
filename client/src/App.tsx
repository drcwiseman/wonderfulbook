import React, { Suspense, lazy } from "react";
// Force deployment refresh - August 12, 2025 - Code Splitting + Performance Optimization
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import { ProductionErrorBoundary } from "@/components/ProductionErrorBoundary";
import { useAuth } from "@/hooks/useAuth";
import { AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import ScrollToTop from "@/components/ScrollToTop";
import AccessibilityButton from "@/components/AccessibilityButton";
import ProtectedRoute from "@/components/ProtectedRoute";
import FeedbackButton from "@/components/FeedbackButton";

// Critical pages loaded immediately
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import NotFound from "@/pages/not-found";

// Heavy pages loaded on-demand (code splitting)
const BookStore = lazy(() => import("@/pages/bookstore"));
const Library = lazy(() => import("@/pages/library"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const BookDetail = lazy(() => import("@/pages/book-detail-enhanced"));
const Subscribe = lazy(() => import("@/pages/subscribe"));
const PaymentSuccess = lazy(() => import("@/pages/PaymentSuccess"));
const ReaderPage = lazy(() => import("@/pages/reader"));

// Admin pages (heaviest - only load when needed)
const AdminPanel = lazy(() => import("@/pages/admin"));
const SuperAdminDashboard = lazy(() => import("@/pages/super-admin-dashboard"));
const SystemSettings = lazy(() => import("@/pages/system-settings"));
const AdminEmailManagement = lazy(() => import("@/pages/AdminEmailManagement"));
const HealthDashboard = lazy(() => import("@/pages/health-dashboard"));

// Secondary pages
const ChallengesPage = lazy(() => import("@/pages/challenges"));
const ChallengeDetailPage = lazy(() => import("@/pages/challenge-detail"));
const TestingQA = lazy(() => import("@/pages/testing-qa"));
const AccessibilityTestDemo = lazy(() => import("@/components/AccessibilityTestDemo"));
const RouteProtectionDemo = lazy(() => import("@/components/RouteProtectionDemo"));
const ForgotPassword = lazy(() => import("@/pages/auth/forgot-password"));
const ResetPassword = lazy(() => import("@/pages/auth/reset-password"));
const EmailVerified = lazy(() => import("@/pages/email-verified"));
const Unsubscribe = lazy(() => import("@/pages/unsubscribe"));
const Profile = lazy(() => import("@/pages/profile"));
const Billing = lazy(() => import("@/pages/billing"));
const DevicesPage = lazy(() => import("@/pages/devices"));
const LoansPage = lazy(() => import("@/pages/loans"));

// Loading component for Suspense fallback
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-4" />
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  const PageWrapper = ({ children }: { children: React.ReactNode }) => (
    <PageTransition>{children}</PageTransition>
  );

  const LazyPageWrapper = ({ children }: { children: React.ReactNode }) => (
    <Suspense fallback={<LoadingFallback />}>
      <PageTransition>{children}</PageTransition>
    </Suspense>
  );

  return (
    <AnimatePresence mode="wait">
      <Switch>
        <Route path="/">
          <PageWrapper>
            {isLoading ? <Landing /> : (isAuthenticated ? <Home /> : <Landing />)}
          </PageWrapper>
        </Route>
        <Route path="/bookstore">
          <LazyPageWrapper><BookStore /></LazyPageWrapper>
        </Route>
        <Route path="/library">
          <LazyPageWrapper>
            <ProtectedRoute requireAuth={true}>
              <Library />
            </ProtectedRoute>
          </LazyPageWrapper>
        </Route>
        <Route path="/dashboard">
          <LazyPageWrapper>
            <ProtectedRoute requireAuth={true}>
              <Dashboard />
            </ProtectedRoute>
          </LazyPageWrapper>
        </Route>
        <Route path="/profile">
          <LazyPageWrapper>
            <ProtectedRoute requireAuth={true}>
              <Profile />
            </ProtectedRoute>
          </LazyPageWrapper>
        </Route>
        <Route path="/billing">
          <LazyPageWrapper>
            <ProtectedRoute requireAuth={true}>
              <Billing />
            </ProtectedRoute>
          </LazyPageWrapper>
        </Route>
        <Route path="/devices">
          <LazyPageWrapper>
            <ProtectedRoute requireAuth={true}>
              <DevicesPage />
            </ProtectedRoute>
          </LazyPageWrapper>
        </Route>
        <Route path="/loans">
          <LazyPageWrapper>
            <ProtectedRoute requireAuth={true}>
              <LoansPage />
            </ProtectedRoute>
          </LazyPageWrapper>
        </Route>
        <Route path="/book/:id">
          <LazyPageWrapper><BookDetail /></LazyPageWrapper>
        </Route>
        <Route path="/book-detail/:id">
          <LazyPageWrapper><BookDetail /></LazyPageWrapper>
        </Route>
        <Route path="/subscribe">
          <LazyPageWrapper><Subscribe /></LazyPageWrapper>
        </Route>
        <Route path="/payment-success">
          <LazyPageWrapper><PaymentSuccess /></LazyPageWrapper>
        </Route>
        <Route path="/reader/:bookId">
          <LazyPageWrapper>
            <ProtectedRoute requireAuth={true} requireSubscription={true}>
              <ReaderPage />
            </ProtectedRoute>
          </LazyPageWrapper>
        </Route>
        <Route path="/read/:bookId">
          <LazyPageWrapper>
            <ProtectedRoute requireAuth={true} requireSubscription={true}>
              <ReaderPage />
            </ProtectedRoute>
          </LazyPageWrapper>
        </Route>
        <Route path="/admin">
          <LazyPageWrapper>
            <ProtectedRoute requireAuth={true} allowedRoles={["admin", "super_admin"]}>
              <AdminPanel />
            </ProtectedRoute>
          </LazyPageWrapper>
        </Route>
        <Route path="/super-admin">
          <LazyPageWrapper>
            <ProtectedRoute requireAuth={true} allowedRoles={["super_admin"]}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          </LazyPageWrapper>
        </Route>
        <Route path="/system-settings">
          <LazyPageWrapper>
            <ProtectedRoute requireAuth={true} allowedRoles={["super_admin"]}>
              <SystemSettings />
            </ProtectedRoute>
          </LazyPageWrapper>
        </Route>
        <Route path="/admin/email-management">
          <LazyPageWrapper>
            <ProtectedRoute requireAuth={true} allowedRoles={["admin", "super_admin"]}>
              <AdminEmailManagement />
            </ProtectedRoute>
          </LazyPageWrapper>
        </Route>
        <Route path="/health-dashboard">
          <LazyPageWrapper>
            <HealthDashboard />
          </LazyPageWrapper>
        </Route>
        <Route path="/testing-qa">
          <LazyPageWrapper><TestingQA /></LazyPageWrapper>
        </Route>
        <Route path="/accessibility-test">
          <LazyPageWrapper><AccessibilityTestDemo /></LazyPageWrapper>
        </Route>
        <Route path="/route-protection-demo">
          <LazyPageWrapper><RouteProtectionDemo /></LazyPageWrapper>
        </Route>
        <Route path="/challenges">
          <LazyPageWrapper><ChallengesPage /></LazyPageWrapper>
        </Route>
        <Route path="/challenges/:id">
          <LazyPageWrapper><ChallengeDetailPage /></LazyPageWrapper>
        </Route>
        {/* Authentication routes - available whether logged in or not */}
        <Route path="/auth/login">
          <PageWrapper><Login /></PageWrapper>
        </Route>
        <Route path="/auth/register">
          <PageWrapper><Register /></PageWrapper>
        </Route>
        <Route path="/auth/forgot-password">
          <LazyPageWrapper><ForgotPassword /></LazyPageWrapper>
        </Route>
        <Route path="/auth/reset-password">
          <LazyPageWrapper><ResetPassword /></LazyPageWrapper>
        </Route>
        {/* Email-related routes */}
        <Route path="/email-verified">
          <LazyPageWrapper><EmailVerified /></LazyPageWrapper>
        </Route>
        <Route path="/unsubscribe">
          <LazyPageWrapper><Unsubscribe /></LazyPageWrapper>
        </Route>
        <Route>
          <PageWrapper><NotFound /></PageWrapper>
        </Route>
      </Switch>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ProductionErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            {/* Skip link for keyboard navigation */}
            <a href="#main-content" className="skip-link">
              Skip to main content
            </a>
            <Router />
            <ScrollToTop />
            <AccessibilityButton />
            <FeedbackButton />
          </TooltipProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ProductionErrorBoundary>
  );
}

export default App;
