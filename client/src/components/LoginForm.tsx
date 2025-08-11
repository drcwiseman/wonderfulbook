import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Login schema
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [, setLocation] = useLocation();
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const queryClient = useQueryClient();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      if (!captchaToken && import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
        throw new Error("Please complete the captcha verification");
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          captchaToken: captchaToken || "dev-skip"
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Login failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log("Login successful:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setLocation("/library"); // Redirect to library after login
    },
    onError: (error: any) => {
      console.error("Login failed:", error);
      // Reset captcha on error
      setCaptchaToken("");
      setCaptchaError("Login failed. Please check your credentials.");
      // Trigger captcha reset if needed
      if (window.grecaptcha) {
        window.grecaptcha.reset();
      }
    },
  });

  const requestResetMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/support/request-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Support request failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log("Reset request sent:", data);
    },
  });

  const onSubmit = (data: LoginFormData) => {
    setCaptchaError("");
    loginMutation.mutate(data);
  };

  const handleRequestReset = () => {
    requestResetMutation.mutate();
  };

  // Google reCAPTCHA callback
  const onCaptchaSuccess = (token: string) => {
    setCaptchaToken(token);
    setCaptchaError("");
  };

  const onCaptchaError = () => {
    setCaptchaToken("");
    setCaptchaError("Captcha verification failed");
  };

  // Load Google reCAPTCHA script
  React.useEffect(() => {
    if (!window.grecaptcha && import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
      const script = document.createElement("script");
      script.src = `https://www.google.com/recaptcha/api.js?render=${import.meta.env.VITE_RECAPTCHA_SITE_KEY}`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your Wonderful Books account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loginMutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                {loginMutation.error?.message || "Login failed. Please check your credentials."}
              </AlertDescription>
            </Alert>
          )}

          {requestResetMutation.isSuccess && (
            <Alert>
              <AlertDescription>
                A team member will contact you to assist with your password reset.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                {...form.register("email")}
                disabled={loginMutation.isPending}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...form.register("password")}
                disabled={loginMutation.isPending}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
              )}
            </div>

            {/* Captcha Widget */}
            <div className="space-y-2">
              <Label>Security Verification</Label>
              {import.meta.env.VITE_RECAPTCHA_SITE_KEY ? (
                <div
                  id="recaptcha-login-container"
                  className="g-recaptcha"
                  data-sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                  data-callback="onCaptchaSuccess"
                  data-error-callback="onCaptchaError"
                  data-theme="light"
                ></div>
              ) : (
                <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center text-sm text-gray-500">
                  Captcha verification (configure RECAPTCHA_SITE_KEY)
                </div>
              )}
              {captchaError && (
                <p className="text-sm text-red-600">{captchaError}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending || (!captchaToken && import.meta.env.VITE_RECAPTCHA_SITE_KEY)}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <button
              onClick={handleRequestReset}
              disabled={requestResetMutation.isPending}
              className="text-sm text-blue-600 hover:text-blue-500 disabled:text-gray-400"
            >
              {requestResetMutation.isPending ? "Contacting support..." : "Contact Support to reset password"}
            </button>
            
            <p className="text-sm">
              Don't have an account?{" "}
              <button
                onClick={() => setLocation("/register")}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Create one
              </button>
            </p>
            
            <p className="text-xs text-gray-500 dark:text-gray-400">
              We'll ask you to verify your email later.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Global callback functions for Google reCAPTCHA
declare global {
  interface Window {
    onCaptchaSuccess: (token: string) => void;
    onCaptchaError: () => void;
    grecaptcha?: any;
  }
}

// Set global callbacks
if (typeof window !== "undefined") {
  window.onCaptchaSuccess = (token: string) => {
    console.log("Captcha success:", token);
  };

  window.onCaptchaError = () => {
    console.log("Captcha error");
  };
}