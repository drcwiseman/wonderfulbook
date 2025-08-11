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

// Registration schema
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  phone: z.string().min(7, "Phone must be at least 7 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const [, setLocation] = useLocation();
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const queryClient = useQueryClient();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      if (!captchaToken) {
        throw new Error("Please complete the captcha verification");
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          captchaToken
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Registration failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log("Registration successful:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setLocation("/library"); // Redirect to library after registration
    },
    onError: (error: any) => {
      console.error("Registration failed:", error);
      // Reset captcha on error
      setCaptchaToken("");
      setCaptchaError("Registration failed. Please try again.");
      // Trigger captcha reset if needed
      if (window.turnstile) {
        window.turnstile.reset();
      }
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    setCaptchaError("");
    registerMutation.mutate(data);
  };

  // Cloudflare Turnstile callback
  const onCaptchaSuccess = (token: string) => {
    setCaptchaToken(token);
    setCaptchaError("");
  };

  const onCaptchaError = () => {
    setCaptchaToken("");
    setCaptchaError("Captcha verification failed");
  };

  // Load Turnstile script
  React.useEffect(() => {
    if (!window.turnstile && import.meta.env.VITE_TURNSTILE_SITE_KEY) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Join Wonderful Books to access our digital library
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {registerMutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                {registerMutation.error?.message || "Registration failed. Please try again."}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                {...form.register("name")}
                disabled={registerMutation.isPending}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                {...form.register("email")}
                disabled={registerMutation.isPending}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                {...form.register("phone")}
                disabled={registerMutation.isPending}
              />
              {form.formState.errors.phone && (
                <p className="text-sm text-red-600">{form.formState.errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password (min. 6 characters)"
                {...form.register("password")}
                disabled={registerMutation.isPending}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
              )}
            </div>

            {/* Captcha Widget */}
            <div className="space-y-2">
              <Label>Security Verification</Label>
              {import.meta.env.VITE_TURNSTILE_SITE_KEY ? (
                <div
                  className="cf-turnstile"
                  data-sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                  data-callback="onCaptchaSuccess"
                  data-error-callback="onCaptchaError"
                  data-theme="auto"
                ></div>
              ) : (
                <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center text-sm text-gray-500">
                  Captcha verification (configure TURNSTILE_SITE_KEY)
                </div>
              )}
              {captchaError && (
                <p className="text-sm text-red-600">{captchaError}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={registerMutation.isPending || (!captchaToken && import.meta.env.VITE_TURNSTILE_SITE_KEY)}
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              We'll ask you to verify your email later.
            </p>
            <p className="text-sm">
              Already have an account?{" "}
              <button
                onClick={() => setLocation("/login")}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Global callback functions for Turnstile
declare global {
  interface Window {
    onCaptchaSuccess: (token: string) => void;
    onCaptchaError: () => void;
    turnstile: any;
  }
}

// Set global callbacks
if (typeof window !== "undefined") {
  window.onCaptchaSuccess = (token: string) => {
    // This will be handled by the component instance
    console.log("Captcha success:", token);
  };

  window.onCaptchaError = () => {
    console.log("Captcha error");
  };
}