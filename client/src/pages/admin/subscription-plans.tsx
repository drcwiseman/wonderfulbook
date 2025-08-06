import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Crown, 
  Star, 
  Zap, 
  Edit2, 
  Plus, 
  Save, 
  Trash2, 
  ArrowUp, 
  ArrowDown,
  DollarSign,
  BookOpen,
  Users
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { SEOHead } from "@/components/SEOHead";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  priceAmount: number;
  currency: string;
  period: string;
  description: string | null;
  bookLimit: number;
  features: string[];
  isActive: boolean;
  stripePriceId: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

const planIcons = {
  free: <Zap className="w-6 h-6 text-gray-500" />,
  basic: <Star className="w-6 h-6 text-purple-500" />,
  premium: <Crown className="w-6 h-6 text-yellow-500" />,
  default: <BookOpen className="w-6 h-6 text-orange-500" />
};

export default function AdminSubscriptionPlans() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    priceAmount: 0,
    currency: "GBP",
    period: "per month",
    description: "",
    bookLimit: 3,
    features: [""],
    isActive: true,
    displayOrder: 1
  });

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user as any)?.role !== "admin")) {
      toast({
        title: "Access Denied",
        description: "You need admin privileges to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  // Fetch subscription plans
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["/api/admin/subscription-plans"],
    enabled: isAuthenticated && (user as any)?.role === "admin"
  });

  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      return await apiRequest("PUT", `/api/admin/subscription-plans/${data.id}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      toast({
        title: "Success",
        description: "Subscription plan updated successfully",
      });
      setShowEditDialog(false);
      setEditingPlan(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription plan",
        variant: "destructive",
      });
    }
  });

  // Create plan mutation
  const createPlanMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/admin/subscription-plans", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      toast({
        title: "Success",
        description: "New subscription plan created successfully",
      });
      setShowEditDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription plan",
        variant: "destructive",
      });
    }
  });

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/subscription-plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      toast({
        title: "Success",
        description: "Subscription plan deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete subscription plan",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      priceAmount: 0,
      currency: "GBP",
      period: "per month",
      description: "",
      bookLimit: 3,
      features: [""],
      isActive: true,
      displayOrder: 1
    });
  };

  const openEditDialog = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        price: plan.price,
        priceAmount: plan.priceAmount,
        currency: plan.currency,
        period: plan.period,
        description: plan.description || "",
        bookLimit: plan.bookLimit,
        features: plan.features.length > 0 ? plan.features : [""],
        isActive: plan.isActive,
        displayOrder: plan.displayOrder
      });
    } else {
      setEditingPlan(null);
      resetForm();
    }
    setShowEditDialog(true);
  };

  const handleSave = () => {
    const planData = {
      ...formData,
      features: formData.features.filter(f => f.trim() !== "")
    };

    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, updates: planData });
    } else {
      createPlanMutation.mutate({ id: formData.name.toLowerCase().replace(/\s+/g, '-'), ...planData });
    }
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, ""]
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  if (isLoading || plansLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      <SEOHead 
        title="Manage Subscription Plans - Admin Dashboard | Wonderful Books"
        description="Admin interface for managing subscription plans, pricing, and book access limits"
      />
      <Header />
      
      <main className="pt-32 pb-16">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Subscription Plans Management
              </h1>
              <p className="text-gray-600">
                Configure pricing, book limits, and features for subscription tiers
              </p>
            </div>
            
            <Button
              onClick={() => openEditDialog()}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Plan
            </Button>
          </div>

          {/* Plans Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {(plans as SubscriptionPlan[])
              .sort((a: SubscriptionPlan, b: SubscriptionPlan) => a.displayOrder - b.displayOrder)
              .map((plan: SubscriptionPlan) => (
              <Card key={plan.id} className={`border-2 ${!plan.isActive ? 'opacity-50 bg-gray-50' : 'bg-white'}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {planIcons[plan.id as keyof typeof planIcons] || planIcons.default}
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                    </div>
                    <Badge variant={plan.isActive ? "default" : "secondary"}>
                      {plan.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-semibold">{plan.price}</span>
                      <span className="text-sm text-gray-500">{plan.period}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">
                      {plan.bookLimit === -1 ? "Unlimited books" : `${plan.bookLimit} books`}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-gray-700">Features:</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {plan.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-orange-500 mt-1">•</span>
                          {feature}
                        </li>
                      ))}
                      {plan.features.length > 3 && (
                        <li className="text-gray-400">+{plan.features.length - 3} more...</li>
                      )}
                    </ul>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(plan)}
                      className="flex-1"
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${plan.name}"?`)) {
                          deletePlanMutation.mutate(plan.id);
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Edit/Create Plan Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? `Edit ${editingPlan.name}` : "Create New Subscription Plan"}
            </DialogTitle>
            <DialogDescription>
              Configure plan details, pricing, and book access limits
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Plan Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Premium Plan"
                />
              </div>
              <div>
                <Label htmlFor="price">Display Price</Label>
                <Input
                  id="price"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="e.g., £19.99"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="priceAmount">Price (pence)</Label>
                <Input
                  id="priceAmount"
                  type="number"
                  value={formData.priceAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, priceAmount: parseInt(e.target.value) || 0 }))}
                  placeholder="1999"
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  placeholder="GBP"
                />
              </div>
              <div>
                <Label htmlFor="period">Period</Label>
                <Input
                  id="period"
                  value={formData.period}
                  onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value }))}
                  placeholder="per month"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the plan"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bookLimit">Book Access Limit</Label>
                <Input
                  id="bookLimit"
                  type="number"
                  value={formData.bookLimit}
                  onChange={(e) => setFormData(prev => ({ ...prev, bookLimit: parseInt(e.target.value) || 0 }))}
                  placeholder="-1 for unlimited"
                />
                <p className="text-xs text-gray-500 mt-1">Use -1 for unlimited access</p>
              </div>
              <div>
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 1 }))}
                  placeholder="1"
                />
              </div>
            </div>

            <div>
              <Label>Features</Label>
              <div className="space-y-2 mt-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      placeholder="Feature description"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeFeature(index)}
                      disabled={formData.features.length === 1}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFeature}
                  className="w-full"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Feature
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">Plan is active and visible to users</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updatePlanMutation.isPending || createPlanMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Save className="w-4 h-4 mr-2" />
              {editingPlan ? "Update Plan" : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}