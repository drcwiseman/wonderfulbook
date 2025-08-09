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
import AdminEmailManagement from "@/pages/AdminEmailManagement";
import ChallengesPage from "@/pages/challenges";
import ChallengeDetailPage from "@/pages/challenge-detail";
import TestingQA from "@/pages/testing-qa";
import AccessibilityTestDemo from "@/components/AccessibilityTestDemo";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import ForgotPassword from "@/pages/auth/forgot-password";
import ResetPassword from "@/pages/auth/reset-password";
import NotFound from "@/pages/not-found";
import ScrollToTop from "@/components/ScrollToTop";
import AccessibilityButton from "@/components/AccessibilityButton";
import AccessibilityMenu from "@/components/AccessibilityMenu";
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
            {isLoading || !isAuthenticated ? <Landing /> : <Home />}
          </PageWrapper>
        </Route>
        <Route path="/bookstore">
          <PageWrapper><BookStore /></PageWrapper>
        </Route>
        <Route path="/library">
          <PageWrapper><Library /></PageWrapper>
        </Route>
        <Route path="/dashboard">
          <PageWrapper><Dashboard /></PageWrapper>
        </Route>
        <Route path="/book/:id">
          <PageWrapper><BookDetail /></PageWrapper>
        </Route>
        <Route path="/subscribe">
          <PageWrapper><Subscribe /></PageWrapper>
        </Route>
        <Route path="/payment-success">
          <PageWrapper><PaymentSuccess /></PageWrapper>
        </Route>
        <Route path="/reader/:bookId">
          <PageWrapper><ReaderPage /></PageWrapper>
        </Route>
        <Route path="/admin">
          <PageWrapper><AdminPanel /></PageWrapper>
        </Route>
        <Route path="/super-admin">
          <PageWrapper><SuperAdminDashboard /></PageWrapper>
        </Route>
        <Route path="/admin/email-management">
          <PageWrapper><AdminEmailManagement /></PageWrapper>
        </Route>
        <Route path="/testing-qa">
          <PageWrapper><TestingQA /></PageWrapper>
        </Route>
        <Route path="/accessibility-test">
          <PageWrapper><AccessibilityTestDemo /></PageWrapper>
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
          {/* Skip link for keyboard navigation */}
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <Router />
          <ScrollToTop />
          <AccessibilityButton />
          <AccessibilityMenu />
          <FeedbackButton />
        </TooltipProvider>
      </QueryClientProvider>
    </ProductionErrorBoundary>
  );
}

export default App;
