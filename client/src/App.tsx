import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import BookStore from "@/pages/bookstore";
import Library from "@/pages/library";
import Dashboard from "@/pages/dashboard";
import BookDetail from "@/pages/book-detail";
import Subscribe from "@/pages/subscribe";
import ReaderPage from "@/pages/reader";
import AdminPanel from "@/pages/admin";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import ForgotPassword from "@/pages/auth/forgot-password";
import ResetPassword from "@/pages/auth/reset-password";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/">{isLoading || !isAuthenticated ? <Landing /> : <Home />}</Route>
      <Route path="/bookstore" component={BookStore} />
      <Route path="/library" component={Library} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/book/:id" component={BookDetail} />
      <Route path="/subscribe" component={Subscribe} />
      <Route path="/reader/:bookId" component={ReaderPage} />
      <Route path="/admin" component={AdminPanel} />
      {/* Authentication routes - available whether logged in or not */}
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/register" component={Register} />
      <Route path="/auth/forgot-password" component={ForgotPassword} />
      <Route path="/auth/reset-password" component={ResetPassword} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
