import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Shield, Lock, Crown, AlertTriangle, CheckCircle } from "lucide-react";

export default function RouteProtectionDemo() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const protectionLevels = [
    {
      level: "Public",
      icon: <Shield className="h-4 w-4 text-green-500" />,
      description: "Accessible to everyone",
      routes: ["/", "/bookstore", "/subscribe"],
      color: "bg-green-50 text-green-800",
      accessible: true
    },
    {
      level: "Authentication Required",
      icon: <Lock className="h-4 w-4 text-blue-500" />,
      description: "Must be logged in",
      routes: ["/dashboard", "/profile", "/library", "/devices", "/loans"],
      color: "bg-blue-50 text-blue-800",
      accessible: isAuthenticated
    },
    {
      level: "Active Subscription",
      icon: <Crown className="h-4 w-4 text-orange-500" />,
      description: "Must have active subscription",
      routes: ["/reader/*", "/read/*"],
      color: "bg-orange-50 text-orange-800",
      accessible: isAuthenticated && user && (user as any).subscriptionStatus === "active"
    },
    {
      level: "Admin Only",
      icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
      description: "Admin or Super Admin role required",
      routes: ["/admin", "/admin/email-management"],
      color: "bg-red-50 text-red-800",
      accessible: isAuthenticated && user && ["admin", "super_admin"].includes((user as any).role || "user")
    },
    {
      level: "Super Admin Only",
      icon: <AlertTriangle className="h-4 w-4 text-purple-500" />,
      description: "Super Admin role required",
      routes: ["/super-admin"],
      color: "bg-purple-50 text-purple-800",
      accessible: isAuthenticated && user && (user as any).role === "super_admin"
    }
  ];

  const userInfo = user ? {
    role: (user as any).role || "user",
    subscriptionTier: (user as any).subscriptionTier || "free",
    subscriptionStatus: (user as any).subscriptionStatus || "inactive"
  } : null;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Route Protection System</h1>
        <p className="text-gray-600">
          Our comprehensive routing system protects different areas of the application based on authentication, subscription status, and user roles.
        </p>
      </div>

      {/* Current User Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Your Current Access Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isAuthenticated && userInfo ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Authentication</p>
                <Badge className="bg-green-50 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Authenticated
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <Badge variant="outline">{userInfo.role}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Subscription</p>
                <Badge 
                  className={userInfo.subscriptionStatus === "active" 
                    ? "bg-green-50 text-green-800" 
                    : "bg-gray-50 text-gray-800"
                  }
                >
                  {userInfo.subscriptionTier} ({userInfo.subscriptionStatus})
                </Badge>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">You are not logged in</p>
              <Button onClick={() => setLocation("/auth/login")}>
                Login to See Full Access
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Protection Levels */}
      <div className="grid gap-4">
        {protectionLevels.map((level, index) => (
          <Card key={index} className={level.accessible ? "border-green-200" : "border-gray-200"}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {level.icon}
                  {level.level}
                </div>
                <Badge className={level.accessible ? "bg-green-50 text-green-800" : "bg-gray-50 text-gray-800"}>
                  {level.accessible ? "Accessible" : "Restricted"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-3">{level.description}</p>
              <div className="space-y-2">
                <p className="text-sm font-medium">Protected Routes:</p>
                <div className="flex flex-wrap gap-1">
                  {level.routes.map((route, routeIndex) => (
                    <Badge 
                      key={routeIndex} 
                      variant="outline" 
                      className="text-xs"
                    >
                      {route}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Security Features */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Additional Security Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Frontend Protection</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Authentication guards on protected routes</li>
                <li>• Real-time subscription status checking</li>
                <li>• Role-based component rendering</li>
                <li>• Automatic redirects for unauthorized access</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Backend Security</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• API rate limiting (200 req/15min general, 50 req/15min auth)</li>
                <li>• Security headers (CSP, XSS protection, etc.)</li>
                <li>• Device fingerprinting for suspicious activity</li>
                <li>• Session-based authentication with PostgreSQL storage</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}