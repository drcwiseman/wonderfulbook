import React from "react";
// Force deployment refresh - August 11, 2025
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProductionErrorBoundary } from "@/components/ProductionErrorBoundary";
import { useAuth } from "@/hooks/useAuth";
import { AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import BookStore from "@/pages/bookstore";
import Library from "@/pages/library";
import Dashboard from "@/pages/dashboard";
import BookDetail from "@/pages/book-detail-enhanced";
import Subscribe from "@/pages/subscribe";
import PaymentSuccess from "@/pages/PaymentSuccess";
import ReaderPage from "@/pages/reader";
import AdminPanel from "@/pages/admin";
import SuperAdminDashboard from "@/pages/super-admin-dashboard";
import SystemSettings from "@/pages/system-settings";
import AdminEmailManagement from "@/pages/AdminEmailManagement";
import ChallengesPage from "@/pages/challenges";
import ChallengeDetailPage from "@/pages/challenge-detail";

import RouteProtectionDemo from "@/components/RouteProtectionDemo";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import ForgotPassword from "@/pages/auth/forgot-password";
import ResetPassword from "@/pages/auth/reset-password";
import EmailVerified from "@/pages/email-verified";
import Unsubscribe from "@/pages/unsubscribe";
import Profile from "@/pages/profile";
import Billing from "@/pages/billing";
import DevicesPage from "@/pages/devices";
import LoansPage from "@/pages/loans";
import NotFound from "@/pages/not-found";
import ScrollToTop from "@/components/ScrollToTop";
import ProtectedRoute from "@/components/ProtectedRoute";
import FeedbackButton from "@/components/FeedbackButton";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  const PageWrapper = ({ children }: { children: React.ReactNode }) => (
    <PageTransition>{children}</PageTransition>
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
          <PageWrapper><BookStore /></PageWrapper>
        </Route>
        <Route path="/library">
          <PageWrapper>
            <ProtectedRoute requireAuth={true}>
              <Library />
            </ProtectedRoute>
          </PageWrapper>
        </Route>
        <Route path="/dashboard">
          <PageWrapper>
            <ProtectedRoute requireAuth={true}>
              <Dashboard />
            </ProtectedRoute>
          </PageWrapper>
        </Route>
        <Route path="/profile">
          <PageWrapper>
            <ProtectedRoute requireAuth={true}>
              <Profile />
            </ProtectedRoute>
          </PageWrapper>
        </Route>
        <Route path="/billing">
          <PageWrapper>
            <ProtectedRoute requireAuth={true}>
              <Billing />
            </ProtectedRoute>
          </PageWrapper>
        </Route>
        <Route path="/devices">
          <PageWrapper>
            <ProtectedRoute requireAuth={true}>
              <DevicesPage />
            </ProtectedRoute>
          </PageWrapper>
        </Route>
        <Route path="/loans">
          <PageWrapper>
            <ProtectedRoute requireAuth={true}>
              <LoansPage />
            </ProtectedRoute>
          </PageWrapper>
        </Route>
        <Route path="/book/:id">
          <PageWrapper><BookDetail /></PageWrapper>
        </Route>
        <Route path="/book-detail/:id">
          <PageWrapper><BookDetail /></PageWrapper>
        </Route>
        <Route path="/subscribe">
          <PageWrapper><Subscribe /></PageWrapper>
        </Route>
        <Route path="/payment-success">
          <PageWrapper><PaymentSuccess /></PageWrapper>
        </Route>
        <Route path="/reader/:bookId">
          <PageWrapper>
            <ProtectedRoute requireAuth={true} requireSubscription={true}>
              <ReaderPage />
            </ProtectedRoute>
          </PageWrapper>
        </Route>
        <Route path="/read/:bookId">
          <PageWrapper>
            <ProtectedRoute requireAuth={true} requireSubscription={true}>
              <ReaderPage />
            </ProtectedRoute>
          </PageWrapper>
        </Route>
        <Route path="/admin">
          <PageWrapper>
            <ProtectedRoute requireAuth={true} allowedRoles={["admin", "super_admin"]}>
              <AdminPanel />
            </ProtectedRoute>
          </PageWrapper>
        </Route>
        <Route path="/super-admin">
          <PageWrapper>
            <ProtectedRoute requireAuth={true} allowedRoles={["super_admin"]}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          </PageWrapper>
        </Route>
        <Route path="/system-settings">
          <PageWrapper>
            <ProtectedRoute requireAuth={true} allowedRoles={["super_admin"]}>
              <SystemSettings />
            </ProtectedRoute>
          </PageWrapper>
        </Route>
        <Route path="/admin/email-management">
          <PageWrapper>
            <ProtectedRoute requireAuth={true} allowedRoles={["admin", "super_admin"]}>
              <AdminEmailManagement />
            </ProtectedRoute>
          </PageWrapper>
        </Route>


        <Route path="/route-protection-demo">
          <PageWrapper><RouteProtectionDemo /></PageWrapper>
        </Route>
        <Route path="/challenges">
          <PageWrapper><ChallengesPage /></PageWrapper>
        </Route>
        <Route path="/challenges/:id">
          <PageWrapper><ChallengeDetailPage /></PageWrapper>
        </Route>
        {/* Authentication routes - available whether logged in or not */}
        <Route path="/auth/login">
          <PageWrapper><Login /></PageWrapper>
        </Route>
        <Route path="/auth/register">
          <PageWrapper><Register /></PageWrapper>
        </Route>
        <Route path="/auth/forgot-password">
          <PageWrapper><ForgotPassword /></PageWrapper>
        </Route>
        <Route path="/auth/reset-password">
          <PageWrapper><ResetPassword /></PageWrapper>
        </Route>
        {/* Email-related routes */}
        <Route path="/email-verified">
          <PageWrapper><EmailVerified /></PageWrapper>
        </Route>
        <Route path="/unsubscribe">
          <PageWrapper><Unsubscribe /></PageWrapper>
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
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
          <ScrollToTop />
          <FeedbackButton />
        </TooltipProvider>
      </QueryClientProvider>
    </ProductionErrorBoundary>
  );
}

export default App;
