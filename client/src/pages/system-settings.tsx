import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Settings, 
  Server, 
  Database, 
  Mail, 
  Shield, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Wrench,
  Globe,
  Key,
  Bell
} from "lucide-react";
import Header from "@/components/Header";
import PageHeader from "@/components/PageHeader";

interface SystemSettings {
  maintenanceMode: {
    enabled: boolean;
    message: string;
    estimatedEnd: string;
  };
  platform: {
    siteName: string;
    siteDescription: string;
    allowRegistration: boolean;
    requireEmailVerification: boolean;
    maxUsersPerPlan: {
      free: number;
      basic: number;
      premium: number;
    };
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    requireStrongPasswords: boolean;
    enableTwoFactor: boolean;
  };
  email: {
    fromName: string;
    fromEmail: string;
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    smtpUser: string;
    smtpPassword: string;
    replyToEmail: string;
    enableAuth: boolean;
    connectionTimeout: number;
    greetingTimeout: number;
    socketTimeout: number;
    maxConnections: number;
    maxMessages: number;
    rateDelta: number;
    rateLimit: number;
    welcomeEmailEnabled: boolean;
    reminderEmailsEnabled: boolean;
  };
  features: {
    enableAnalytics: boolean;
    enableCopyProtection: boolean;
    enableDeviceLimit: boolean;
    maxDevicesPerUser: number;
    enableOfflineMode: boolean;
  };
  performance: {
    cacheTimeout: number;
    maxConcurrentReads: number;
    enableRateLimiting: boolean;
    rateLimitRequests: number;
    rateLimitWindow: number;
  };
}

export default function SystemSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");
  const [localSettings, setLocalSettings] = useState<SystemSettings | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Email testing state
  const [testEmail, setTestEmail] = useState('');

  // Fetch current system settings
  const { data: settings, isLoading } = useQuery<SystemSettings>({
    queryKey: ["/api/super-admin/system-settings"],
  });

  // Update local settings when server data changes
  React.useEffect(() => {
    if (settings && !localSettings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  // Use local settings for display, fall back to fetched settings
  const displaySettings = localSettings || settings;

  // Update system settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<SystemSettings>) => {
      const response = await apiRequest("PUT", "/api/super-admin/system-settings", updatedSettings);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "System settings have been successfully saved.",
      });
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/system-settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save system settings.",
        variant: "destructive",
      });
    },
  });

  // Test email configuration mutation
  const testEmailMutation = useMutation({
    mutationFn: async (email?: string) => {
      const requestBody = email ? { email } : {};
      const response = await apiRequest("POST", "/api/super-admin/test-email", requestBody);
      return response.json();
    },
    onSuccess: (_, email) => {
      const recipient = email ? ` to ${email}` : '';
      toast({
        title: "Email Test Successful",
        description: `Test email sent successfully${recipient}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Email Test Failed",
        description: error.message || "Failed to send test email.",
        variant: "destructive",
      });
    },
  });

  // Clear cache mutation
  const clearCacheMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/super-admin/clear-cache");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cache Cleared",
        description: "System cache has been cleared successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cache Clear Failed",
        description: error.message || "Failed to clear cache.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateSettings = (section: keyof SystemSettings, updates: any) => {
    if (!displaySettings) return;
    
    // Update local state only - no automatic saving
    const currentSection = displaySettings[section] as any;
    const updatedSettings = {
      ...displaySettings,
      [section]: { ...currentSection, ...updates }
    };
    setLocalSettings(updatedSettings as SystemSettings);
    setHasUnsavedChanges(true);
  };

  const handleInputChange = (section: keyof SystemSettings, field: string, value: any) => {
    if (!displaySettings) return;
    
    // Update local state only - no automatic saving
    const currentSection = displaySettings[section] as any;
    const updatedSettings = {
      ...displaySettings,
      [section]: { ...currentSection, [field]: value }
    };
    setLocalSettings(updatedSettings as SystemSettings);
    setHasUnsavedChanges(true);
  };

  const handleMaintenanceToggle = (enabled: boolean) => {
    if (!displaySettings) return;
    
    const updatedSettings = {
      ...displaySettings,
      maintenanceMode: {
        ...(displaySettings as SystemSettings).maintenanceMode,
        enabled,
        estimatedEnd: enabled ? new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() : ""
      }
    };
    
    // Update local state only
    setLocalSettings(updatedSettings as SystemSettings);
    setHasUnsavedChanges(true);
  };

  const handleSaveChanges = () => {
    if (!localSettings || !hasUnsavedChanges) return;
    updateSettingsMutation.mutate(localSettings);
  };

  const handleDiscardChanges = () => {
    if (settings) {
      setLocalSettings(settings);
      setHasUnsavedChanges(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!displaySettings) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                <XCircle className="h-5 w-5" />
                <span>Failed to load system settings</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="System Settings"
          breadcrumbs={[
            { label: "Super Admin", href: "/super-admin" },
            { label: "System Settings", href: "/system-settings" }
          ]}
        />

        {/* Save/Discard Changes Bar */}
        {hasUnsavedChanges && (
          <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-semibold">You have unsaved changes</span>
                  <p className="text-sm">Save your changes to apply them to the system.</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={handleDiscardChanges}
                    disabled={updateSettingsMutation.isPending}
                  >
                    Discard Changes
                  </Button>
                  <Button
                    onClick={handleSaveChanges}
                    disabled={updateSettingsMutation.isPending}
                  >
                    {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Maintenance Mode Alert */}
        {displaySettings.maintenanceMode.enabled && (
          <Card className="mb-6 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-orange-700 dark:text-orange-300">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">Maintenance Mode Active</span>
              </div>
              <p className="mt-2 text-sm text-orange-600 dark:text-orange-400">
                {displaySettings.maintenanceMode.message}
              </p>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general" className="flex items-center space-x-2">
              <Globe className="h-4 w-4" />
              <span>General</span>
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center space-x-2">
              <Wrench className="h-4 w-4" />
              <span>Maintenance</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>Email</span>
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center space-x-2">
              <Server className="h-4 w-4" />
              <span>Features</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Performance</span>
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Platform Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input
                      id="siteName"
                      value={displaySettings.platform.siteName}
                      onChange={(e) => handleInputChange("platform", "siteName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siteDescription">Site Description</Label>
                    <Input
                      id="siteDescription"
                      value={displaySettings.platform.siteDescription}
                      onChange={(e) => handleInputChange("platform", "siteDescription", e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Registration Settings</h4>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Allow New Registration</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Allow new users to register accounts
                      </p>
                    </div>
                    <Switch
                      checked={displaySettings.platform.allowRegistration}
                      onCheckedChange={(checked) => handleInputChange("platform", "allowRegistration", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Require Email Verification</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Users must verify their email before accessing the platform
                      </p>
                    </div>
                    <Switch
                      checked={displaySettings.platform.requireEmailVerification}
                      onCheckedChange={(checked) => handleUpdateSettings("platform", { requireEmailVerification: checked })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">User Limits per Plan</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Free Plan</Label>
                      <Input
                        type="number"
                        value={displaySettings.platform.maxUsersPerPlan.free}
                        onChange={(e) => handleUpdateSettings("platform", { 
                          maxUsersPerPlan: { 
                            ...displaySettings.platform.maxUsersPerPlan, 
                            free: parseInt(e.target.value) || 0 
                          }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Basic Plan</Label>
                      <Input
                        type="number"
                        value={displaySettings.platform.maxUsersPerPlan.basic}
                        onChange={(e) => handleUpdateSettings("platform", { 
                          maxUsersPerPlan: { 
                            ...displaySettings.platform.maxUsersPerPlan, 
                            basic: parseInt(e.target.value) || 0 
                          }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Premium Plan</Label>
                      <Input
                        type="number"
                        value={displaySettings.platform.maxUsersPerPlan.premium}
                        onChange={(e) => handleUpdateSettings("platform", { 
                          maxUsersPerPlan: { 
                            ...displaySettings.platform.maxUsersPerPlan, 
                            premium: parseInt(e.target.value) || 0 
                          }
                        })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Mode */}
          <TabsContent value="maintenance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wrench className="h-5 w-5" />
                  <span>Maintenance Mode</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Label className="text-lg">Maintenance Mode</Label>
                      <Badge variant={displaySettings.maintenanceMode.enabled ? "destructive" : "secondary"}>
                        {displaySettings.maintenanceMode.enabled ? "ACTIVE" : "INACTIVE"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      When enabled, only administrators can access the platform
                    </p>
                  </div>
                  <Switch
                    checked={displaySettings.maintenanceMode.enabled}
                    onCheckedChange={handleMaintenanceToggle}
                  />
                </div>

                {displaySettings.maintenanceMode.enabled && (
                  <div className="space-y-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                      <Textarea
                        id="maintenanceMessage"
                        value={displaySettings.maintenanceMode.message}
                        onChange={(e) => handleUpdateSettings("maintenanceMode", { message: e.target.value })}
                        placeholder="We're currently performing maintenance. Please check back later."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estimatedEnd">Estimated End Time</Label>
                      <Input
                        id="estimatedEnd"
                        type="datetime-local"
                        value={displaySettings.maintenanceMode.estimatedEnd ? new Date(displaySettings.maintenanceMode.estimatedEnd).toISOString().slice(0, -1) : ""}
                        onChange={(e) => handleUpdateSettings("maintenanceMode", { estimatedEnd: e.target.value ? new Date(e.target.value).toISOString() : "" })}
                      />
                    </div>
                  </div>
                )}

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">System Actions</h4>
                  <div className="flex space-x-4">
                    <Button
                      variant="outline"
                      onClick={() => clearCacheMutation.mutate()}
                      disabled={clearCacheMutation.isPending}
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Clear Cache
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Security Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={displaySettings.security.sessionTimeout}
                      onChange={(e) => handleUpdateSettings("security", { sessionTimeout: parseInt(e.target.value) || 30 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={displaySettings.security.maxLoginAttempts}
                      onChange={(e) => handleUpdateSettings("security", { maxLoginAttempts: parseInt(e.target.value) || 5 })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Password Policy</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                      <Input
                        id="passwordMinLength"
                        type="number"
                        value={displaySettings.security.passwordMinLength}
                        onChange={(e) => handleUpdateSettings("security", { passwordMinLength: parseInt(e.target.value) || 8 })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Require Strong Passwords</Label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Enforce uppercase, lowercase, numbers, and symbols
                        </p>
                      </div>
                      <Switch
                        checked={displaySettings.security.requireStrongPasswords}
                        onCheckedChange={(checked) => handleUpdateSettings("security", { requireStrongPasswords: checked })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Enable Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Allow users to enable 2FA for their accounts
                      </p>
                    </div>
                    <Switch
                      checked={displaySettings.security.enableTwoFactor}
                      onCheckedChange={(checked) => handleUpdateSettings("security", { enableTwoFactor: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-5 w-5" />
                  <span>Email Configuration</span>
                </CardTitle>
                <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <Shield className="h-4 w-4" />
                  <span>Default values are loaded from your environment configuration. You can override them here if needed.</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      value={displaySettings.email.fromName}
                      onChange={(e) => handleUpdateSettings("email", { fromName: e.target.value })}
                      placeholder="Wonderful Books"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      value={displaySettings.email.fromEmail}
                      onChange={(e) => handleUpdateSettings("email", { fromEmail: e.target.value })}
                      placeholder="books@thekingdomclub.org"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="replyToEmail">Reply-To Email</Label>
                    <Input
                      id="replyToEmail"
                      type="email"
                      value={displaySettings.email.replyToEmail}
                      onChange={(e) => handleUpdateSettings("email", { replyToEmail: e.target.value })}
                      placeholder="books@thekingdomclub.org"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-8">
                    <div className="space-y-1">
                      <Label>Enable Authentication</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Use SMTP authentication
                      </p>
                    </div>
                    <Switch
                      checked={displaySettings.email.enableAuth}
                      onCheckedChange={(checked) => handleUpdateSettings("email", { enableAuth: checked })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">SMTP Server Configuration</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpHost">SMTP Host</Label>
                      <Input
                        id="smtpHost"
                        value={displaySettings.email.smtpHost}
                        onChange={(e) => handleUpdateSettings("email", { smtpHost: e.target.value })}
                        placeholder="mail.thekingdomclub.org"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={displaySettings.email.smtpPort}
                        onChange={(e) => handleUpdateSettings("email", { smtpPort: parseInt(e.target.value) || 465 })}
                        placeholder="465"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-8">
                      <Label>Use SSL/TLS</Label>
                      <Switch
                        checked={displaySettings.email.smtpSecure}
                        onCheckedChange={(checked) => handleUpdateSettings("email", { smtpSecure: checked })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="smtpUser">SMTP Username</Label>
                      <Input
                        id="smtpUser"
                        value={displaySettings.email.smtpUser}
                        onChange={(e) => handleUpdateSettings("email", { smtpUser: e.target.value })}
                        placeholder="books@thekingdomclub.org"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPassword">SMTP Password</Label>
                      <Input
                        id="smtpPassword"
                        type="password"
                        value={displaySettings.email.smtpPassword}
                        onChange={(e) => handleUpdateSettings("email", { smtpPassword: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Connection Settings</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="connectionTimeout">Connection Timeout (ms)</Label>
                      <Input
                        id="connectionTimeout"
                        type="number"
                        value={displaySettings.email.connectionTimeout}
                        onChange={(e) => handleUpdateSettings("email", { connectionTimeout: parseInt(e.target.value) || 60000 })}
                        placeholder="60000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="greetingTimeout">Greeting Timeout (ms)</Label>
                      <Input
                        id="greetingTimeout"
                        type="number"
                        value={displaySettings.email.greetingTimeout}
                        onChange={(e) => handleUpdateSettings("email", { greetingTimeout: parseInt(e.target.value) || 30000 })}
                        placeholder="30000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="socketTimeout">Socket Timeout (ms)</Label>
                      <Input
                        id="socketTimeout"
                        type="number"
                        value={displaySettings.email.socketTimeout}
                        onChange={(e) => handleUpdateSettings("email", { socketTimeout: parseInt(e.target.value) || 60000 })}
                        placeholder="60000"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Performance & Rate Limiting</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="maxConnections">Max Connections</Label>
                      <Input
                        id="maxConnections"
                        type="number"
                        value={displaySettings.email.maxConnections}
                        onChange={(e) => handleUpdateSettings("email", { maxConnections: parseInt(e.target.value) || 5 })}
                        placeholder="5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxMessages">Max Messages</Label>
                      <Input
                        id="maxMessages"
                        type="number"
                        value={displaySettings.email.maxMessages}
                        onChange={(e) => handleUpdateSettings("email", { maxMessages: parseInt(e.target.value) || 100 })}
                        placeholder="100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rateDelta">Rate Delta (ms)</Label>
                      <Input
                        id="rateDelta"
                        type="number"
                        value={displaySettings.email.rateDelta}
                        onChange={(e) => handleUpdateSettings("email", { rateDelta: parseInt(e.target.value) || 1000 })}
                        placeholder="1000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rateLimit">Rate Limit</Label>
                      <Input
                        id="rateLimit"
                        type="number"
                        value={displaySettings.email.rateLimit}
                        onChange={(e) => handleUpdateSettings("email", { rateLimit: parseInt(e.target.value) || 5 })}
                        placeholder="5"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Email Features</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Welcome Emails</Label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Send welcome emails to new users
                        </p>
                      </div>
                      <Switch
                        checked={displaySettings.email.welcomeEmailEnabled}
                        onCheckedChange={(checked) => handleUpdateSettings("email", { welcomeEmailEnabled: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Reminder Emails</Label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Send trial and subscription reminder emails
                        </p>
                      </div>
                      <Switch
                        checked={displaySettings.email.reminderEmailsEnabled}
                        onCheckedChange={(checked) => handleUpdateSettings("email", { reminderEmailsEnabled: checked })}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50">
                    <div className="space-y-2">
                      <Label htmlFor="testEmail">Test Email Address</Label>
                      <Input
                        id="testEmail"
                        type="email"
                        placeholder="Enter email address to test (optional)"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        className="w-full"
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Leave empty to send test email to system admin email
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => testEmailMutation.mutate(testEmail || undefined)}
                        disabled={testEmailMutation.isPending}
                        className="flex-1"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        {testEmailMutation.isPending ? 'Sending...' : 'Send Test Email'}
                      </Button>
                      
                      {testEmail && (
                        <Button
                          variant="ghost"
                          onClick={() => setTestEmail('')}
                          disabled={testEmailMutation.isPending}
                          size="sm"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Settings */}
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Server className="h-5 w-5" />
                  <span>Feature Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Analytics Tracking</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Enable user analytics and usage tracking
                      </p>
                    </div>
                    <Switch
                      checked={displaySettings.features.enableAnalytics}
                      onCheckedChange={(checked) => handleUpdateSettings("features", { enableAnalytics: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Copy Protection</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Limit text copying from books
                      </p>
                    </div>
                    <Switch
                      checked={displaySettings.features.enableCopyProtection}
                      onCheckedChange={(checked) => handleUpdateSettings("features", { enableCopyProtection: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Device Limit</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Limit number of devices per user
                      </p>
                    </div>
                    <Switch
                      checked={displaySettings.features.enableDeviceLimit}
                      onCheckedChange={(checked) => handleUpdateSettings("features", { enableDeviceLimit: checked })}
                    />
                  </div>
                  {displaySettings.features.enableDeviceLimit && (
                    <div className="ml-6 space-y-2">
                      <Label htmlFor="maxDevicesPerUser">Max Devices per User</Label>
                      <Input
                        id="maxDevicesPerUser"
                        type="number"
                        value={displaySettings.features.maxDevicesPerUser}
                        onChange={(e) => handleUpdateSettings("features", { maxDevicesPerUser: parseInt(e.target.value) || 3 })}
                        className="w-32"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Offline Reading Mode</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Allow users to download books for offline reading
                      </p>
                    </div>
                    <Switch
                      checked={displaySettings.features.enableOfflineMode}
                      onCheckedChange={(checked) => handleUpdateSettings("features", { enableOfflineMode: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Settings */}
          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Performance Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="cacheTimeout">Cache Timeout (seconds)</Label>
                    <Input
                      id="cacheTimeout"
                      type="number"
                      value={displaySettings.performance.cacheTimeout}
                      onChange={(e) => handleUpdateSettings("performance", { cacheTimeout: parseInt(e.target.value) || 300 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxConcurrentReads">Max Concurrent Reads</Label>
                    <Input
                      id="maxConcurrentReads"
                      type="number"
                      value={displaySettings.performance.maxConcurrentReads}
                      onChange={(e) => handleUpdateSettings("performance", { maxConcurrentReads: parseInt(e.target.value) || 10 })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Rate Limiting</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Enable API rate limiting protection
                      </p>
                    </div>
                    <Switch
                      checked={displaySettings.performance.enableRateLimiting}
                      onCheckedChange={(checked) => handleUpdateSettings("performance", { enableRateLimiting: checked })}
                    />
                  </div>
                  {displaySettings.performance.enableRateLimiting && (
                    <div className="ml-6 grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="rateLimitRequests">Requests per Window</Label>
                        <Input
                          id="rateLimitRequests"
                          type="number"
                          value={displaySettings.performance.rateLimitRequests}
                          onChange={(e) => handleUpdateSettings("performance", { rateLimitRequests: parseInt(e.target.value) || 100 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rateLimitWindow">Window Size (minutes)</Label>
                        <Input
                          id="rateLimitWindow"
                          type="number"
                          value={displaySettings.performance.rateLimitWindow}
                          onChange={(e) => handleUpdateSettings("performance", { rateLimitWindow: parseInt(e.target.value) || 15 })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}