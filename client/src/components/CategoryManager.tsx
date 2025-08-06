import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Category, InsertCategory } from "@shared/schema";

interface EditableCategory extends Partial<Category> {
  isEditing?: boolean;
  isNew?: boolean;
}

export function CategoryManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [categories, setCategories] = useState<EditableCategory[]>([]);

  // Fetch categories
  const { data: fetchedCategories, isLoading } = useQuery({
    queryKey: ['/api/admin/categories'],
  });

  // Update local state when data changes
  React.useEffect(() => {
    if (fetchedCategories) {
      setCategories(fetchedCategories.map((cat: Category) => ({ ...cat, isEditing: false })));
    }
  }, [fetchedCategories]);

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: async (categoryData: InsertCategory) => {
      return await apiRequest('POST', '/api/admin/categories', categoryData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    },
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InsertCategory> }) => {
      return await apiRequest('PUT', `/api/admin/categories/${id}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/admin/categories/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    },
  });

  const handleAddNew = () => {
    const newCategory: EditableCategory = {
      name: "",
      description: "",
      isActive: true,
      isEditing: true,
      isNew: true,
    };
    setCategories([newCategory, ...categories]);
  };

  const handleEdit = (index: number) => {
    const updated = [...categories];
    updated[index] = { ...updated[index], isEditing: true };
    setCategories(updated);
  };

  const handleSave = async (index: number) => {
    const category = categories[index];
    
    if (!category.name?.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    if (category.isNew) {
      await createMutation.mutateAsync({
        name: category.name,
        description: category.description || null,
        isActive: category.isActive ?? true,
      });
    } else if (category.id) {
      await updateMutation.mutateAsync({
        id: category.id,
        updates: {
          name: category.name,
          description: category.description || null,
          isActive: category.isActive,
        },
      });
    }
  };

  const handleCancel = (index: number) => {
    if (categories[index].isNew) {
      // Remove new category
      const updated = categories.filter((_, i) => i !== index);
      setCategories(updated);
    } else {
      // Revert changes
      if (Array.isArray(fetchedCategories)) {
        const original = fetchedCategories.find((cat: Category) => cat.id === categories[index].id);
        if (original) {
          const updated = [...categories];
          updated[index] = { ...original, isEditing: false };
          setCategories(updated);
        }
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const updateCategory = (index: number, field: keyof Category, value: any) => {
    const updated = [...categories];
    updated[index] = { ...updated[index], [field]: value };
    setCategories(updated);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Category Management</CardTitle>
        <Button onClick={handleAddNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categories.map((category, index) => (
            <div
              key={category.id || `new-${index}`}
              className="border rounded-lg p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-4">
                  {category.isEditing ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`name-${index}`}>Category Name</Label>
                          <Input
                            id={`name-${index}`}
                            value={category.name || ""}
                            onChange={(e) => updateCategory(index, "name", e.target.value)}
                            placeholder="Enter category name..."
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`active-${index}`}>Active Status</Label>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`active-${index}`}
                              checked={category.isActive ?? true}
                              onCheckedChange={(checked) => updateCategory(index, "isActive", checked)}
                            />
                            <Label htmlFor={`active-${index}`} className="text-sm">
                              {category.isActive ? "Active" : "Inactive"}
                            </Label>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`description-${index}`}>Description</Label>
                        <Textarea
                          id={`description-${index}`}
                          value={category.description || ""}
                          onChange={(e) => updateCategory(index, "description", e.target.value)}
                          placeholder="Enter category description..."
                          rows={3}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        <h3 className="text-lg font-semibold">{category.name}</h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            category.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {category.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      {category.description && (
                        <p className="text-gray-600 dark:text-gray-400">{category.description}</p>
                      )}
                      {category.createdAt && (
                        <p className="text-sm text-gray-500">
                          Created: {new Date(category.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {category.isEditing ? (
                    <>
                      <Button
                        onClick={() => handleSave(index)}
                        disabled={createMutation.isPending || updateMutation.isPending}
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </Button>
                      <Button
                        onClick={() => handleCancel(index)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => handleEdit(index)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => category.id && handleDelete(category.id)}
                        variant="destructive"
                        size="sm"
                        disabled={deleteMutation.isPending}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {categories.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No categories found. Click "Add Category" to create your first category.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}