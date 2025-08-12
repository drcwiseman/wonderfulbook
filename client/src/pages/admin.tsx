import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Upload, Book, Users, TrendingUp, DollarSign, Eye, EyeOff, Edit3, Trash2, Save, X, AlertTriangle, Star, BarChart3, Settings, Library, UserCheck, Plus, Home, Shield } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { RichTextEditor } from '@/components/RichTextEditor';
import { ImageUploader } from '@/components/ImageUploader';
import { PDFUploader } from '@/components/PDFUploader';
import { CategoryManager } from '@/components/CategoryManager';
import { UserManagement } from '@/components/UserManagement';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EditItemDialog } from '@/components/shared/EditItemDialog';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import PageHeader from '@/components/PageHeader';

const uploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  categories: z.array(z.string()).min(1, "At least one category is required"),
  tier: z.enum(["free", "basic", "premium"]),
  rating: z.number().min(1).max(5),
  coverImage: z.string().optional(),
  fileUrl: z.string().min(1, "PDF file is required"),
  isFeatured: z.boolean().optional(),
});

const editBookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  categories: z.array(z.string()).min(1, "At least one category is required"),
  tier: z.enum(["free", "basic", "premium"]),
  rating: z.number().min(1).max(5),
  coverImage: z.string().optional(),
  isVisible: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

type UploadForm = z.infer<typeof uploadSchema>;
type EditBookForm = z.infer<typeof editBookSchema>;

export default function AdminPanel() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [description, setDescription] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [pdfFile, setPdfFile] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<any>(null);

  // Admin authorization check
  const isAdmin = (user as any)?.role === "admin" || (user as any)?.role === "super_admin";

  const form = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      tier: "free",
      rating: 4,
      coverImage: "",
      categories: [],
      fileUrl: "",
    },
  });

  const editForm = useForm<EditBookForm>({
    resolver: zodResolver(editBookSchema),
    defaultValues: {
      title: "",
      author: "",
      description: "",
      categories: [],
      tier: "free",
      rating: 4,
      coverImage: "",
      isVisible: true,
      isFeatured: false,
    },
  });

  // Sync pdfFile with form fileUrl
  useEffect(() => {
    if (pdfFile) {
      form.setValue("fileUrl", pdfFile);
    }
  }, [pdfFile, form]);

  // Fetch all books for management
  const { data: books = [], isLoading: booksLoading } = useQuery({
    queryKey: ["/api/admin/books"],
    enabled: isAdmin,
  });

  // Fetch analytics data
  const { data: analytics } = useQuery({
    queryKey: ["/api/admin/analytics"],
    enabled: isAdmin,
  });

  // Type-safe analytics access
  const analyticsData = (analytics as any) || {};

  // Fetch categories for forms
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/admin/categories"],
    enabled: isAdmin,
  });

  // Create book mutation
  const createBookMutation = useMutation({
    mutationFn: async (data: UploadForm) => {
      // Validate that both description and PDF are provided
      if (!description || description.length < 10) {
        throw new Error("Description must be at least 10 characters long");
      }
      if (description.length > 5000) {
        throw new Error("Description cannot exceed 5000 characters");
      }
      if (!pdfFile) {
        throw new Error("PDF file is required");
      }

      return apiRequest("POST", "/api/admin/books", {
        title: data.title,
        author: data.author,
        description: description,
        categories: data.categories,
        tier: data.tier,
        rating: data.rating,
        coverImage: data.coverImage || "",
        fileUrl: pdfFile,
        isFeatured: data.isFeatured || false,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Book created and published successfully!",
      });
      form.reset();
      setDescription("");
      setPdfFile("");
      form.setValue("categories", []);
      form.setValue("coverImage", "");
      form.setValue("fileUrl", "");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete single book mutation
  const deleteBookMutation = useMutation({
    mutationFn: async (bookId: string) => {
      await apiRequest("DELETE", `/api/admin/books/${bookId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Book deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
      setDeleteConfirmOpen(false);
      setBookToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete book",
        variant: "destructive",
      });
    },
  });

  // Delete multiple books mutation
  const deleteMultipleMutation = useMutation({
    mutationFn: async (bookIds: string[]) => {
      await apiRequest("DELETE", "/api/admin/books/bulk", { bookIds });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success",
        description: data.message || "Books deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
      setSelectedBooks([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete books",
        variant: "destructive",
      });
    },
  });

  // Update book mutation
  const updateBookMutation = useMutation({
    mutationFn: async (data: EditBookForm & { id: string }) => {
      const { id, ...bookData } = data;
      return apiRequest("PATCH", `/api/admin/books/${id}`, bookData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Book updated successfully!",
      });
      setEditingBook(null);
      editForm.reset();
      setEditDescription("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update book",
        variant: "destructive",
      });
    },
  });

  // Handle edit form submission
  const onEditSubmit = () => {
    if (!editingBook || !editDescription || editDescription.length < 10) {
      toast({
        title: "Validation Error",
        description: "Description must be at least 10 characters long",
        variant: "destructive",
      });
      return;
    }

    const formData = editForm.getValues();
    const updateData: any = {
      ...formData,
      description: editDescription,
    };
    
    // Map coverImage to coverImageUrl for database compatibility
    if (formData.coverImage) {
      updateData.coverImageUrl = formData.coverImage;
      delete updateData.coverImage;
    }
    
    updateBookMutation.mutate({
      id: editingBook.id,
      ...updateData,
    });
  };

  // Initialize edit form when editing book changes
  useEffect(() => {
    if (editingBook) {
      editForm.reset({
        title: editingBook.title || "",
        author: editingBook.author || "",
        description: editingBook.description || "",
        categories: editingBook.categories || [],
        tier: editingBook.tier || editingBook.requiredTier || "free",
        rating: editingBook.rating || 4,
        coverImage: editingBook.coverImage || editingBook.coverImageUrl || "",
        isVisible: editingBook.isVisible !== false,
        isFeatured: editingBook.isFeatured || false,
      });
      setEditDescription(editingBook.description || "");
    }
  }, [editingBook, editForm]);

  const onSubmit = (data: UploadForm) => {
    createBookMutation.mutate(data);
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-muted-foreground mt-2">Please log in to access the admin panel.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-muted-foreground mt-2">You don't have admin privileges.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-20">
        <PageHeader 
          title="Admin Panel"
          subtitle="Content management and platform administration"
          breadcrumbs={[
            { label: "Home", href: "/", icon: Home },
            { label: "Admin Panel", icon: Shield }
          ]}
          backButtonLabel="Back to Home"
          backButtonHref="/"
          actions={
            <div className="flex items-center gap-3">
              <Settings className="h-8 w-8 text-orange-600" />
              <Badge variant="secondary">
                {(user as any)?.role === "super_admin" ? "Super Admin" : "Admin"}
              </Badge>
            </div>
          }
        />
        <div className="container mx-auto px-4 py-8">
          {/* Quick Navigation for Super Admin */}
          {(user as any)?.role === "super_admin" && (
            <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <Shield className="h-5 w-5" />
                  Super Admin Access
                </CardTitle>
                <CardDescription>Advanced system management and monitoring tools</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button 
                    variant="outline" 
                    className="border-red-200 hover:bg-red-50"
                    onClick={() => window.open('/super-admin', '_blank')}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Super Admin Dashboard
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-red-200 hover:bg-red-50"
                    onClick={() => window.open('/health-dashboard', '_blank')}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Health Dashboard
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-red-200 hover:bg-red-50"
                    onClick={() => window.open('/system-settings', '_blank')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    System Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content Library</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Books</CardTitle>
                <Book className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData?.totalBooks || 0}</div>
                <p className="text-xs text-muted-foreground">
                  In library
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Registered users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData?.activeSubscriptions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Premium & Basic
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">£{analyticsData?.totalRevenue || 0}</div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Content Library Tab */}
        <TabsContent value="content">
          <div className="space-y-6">
            <Tabs defaultValue="upload" className="space-y-4">
              <TabsList className="bg-gray-100 dark:bg-gray-800">
                <TabsTrigger value="upload">Upload New Book</TabsTrigger>
                <TabsTrigger value="manage">Manage Existing Books</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Upload className="w-5 h-5" />
                      <span>Upload New Book</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="title">Title</Label>
                          <Input
                            id="title"
                            {...form.register("title")}
                            placeholder="Enter book title"
                          />
                          {form.formState.errors.title && (
                            <p className="text-sm text-red-500">{form.formState.errors.title.message as string}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="author">Author</Label>
                          <Input
                            id="author"
                            {...form.register("author")}
                            placeholder="Enter author name"
                          />
                          {form.formState.errors.author && (
                            <p className="text-sm text-red-500">{form.formState.errors.author.message as string}</p>
                          )}
                        </div>
                      </div>

                      {/* Image Upload */}
                      <ImageUploader
                        value={form.watch("coverImage") || ""}
                        onChange={(imageUrl) => form.setValue("coverImage", imageUrl)}
                        label="Cover Image"
                      />

                      {/* Rich Text Description */}
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <RichTextEditor
                          content={description}
                          onChange={setDescription}
                          placeholder="Enter book description with rich formatting..."
                        />
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Rich text formatting with colors available</span>
                          <span>{description.length}/5000 characters</span>
                        </div>
                        {description.length < 10 && description.length > 0 && (
                          <p className="text-sm text-red-500">Description must be at least 10 characters</p>
                        )}
                        {description.length > 5000 && (
                          <p className="text-sm text-red-500">Description cannot exceed 5000 characters</p>
                        )}
                      </div>

                      {/* PDF Upload */}
                      <PDFUploader
                        value={pdfFile}
                        onChange={setPdfFile}
                        label="Book PDF File"
                      />

                      <div className="space-y-2">
                        <Label>Categories (Select multiple)</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 border rounded-md">
                          {(categories as any[]).map((category: any) => (
                            <div key={category.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`category-${category.id}`}
                                checked={form.watch("categories")?.includes(category.id) || false}
                                onCheckedChange={(checked) => {
                                  const currentCategories = form.watch("categories") || [];
                                  if (checked) {
                                    form.setValue("categories", [...currentCategories, category.id]);
                                  } else {
                                    form.setValue("categories", currentCategories.filter((id: string) => id !== category.id));
                                  }
                                }}
                              />
                              <Label htmlFor={`category-${category.id}`} className="text-sm font-normal">
                                {category.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                        {form.formState.errors.categories && (
                          <p className="text-sm text-red-500">{form.formState.errors.categories.message as string}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="tier">Subscription Tier</Label>
                          <Select onValueChange={(value) => form.setValue("tier", value as any)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select tier" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free Trial</SelectItem>
                              <SelectItem value="basic">Basic (£5.99)</SelectItem>
                              <SelectItem value="premium">Premium (£9.99)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="rating">Rating (1-5)</Label>
                          <Input
                            id="rating"
                            type="number"
                            min="1"
                            max="5"
                            {...form.register("rating", { valueAsNumber: true })}
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="featured"
                          checked={form.watch("isFeatured") || false}
                          onCheckedChange={(checked) => form.setValue("isFeatured", checked as boolean)}
                        />
                        <Label htmlFor="featured" className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span>Mark as Featured (will appear on home page)</span>
                        </Label>
                      </div>

                      <Button 
                        type="submit" 
                        disabled={createBookMutation.isPending}
                        className="w-full"
                      >
                        {createBookMutation.isPending ? "Creating..." : "Create Book"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="manage">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <Library className="w-5 h-5" />
                        <span>Manage Books</span>
                      </span>
                      {selectedBooks.length > 0 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteMultipleMutation.mutate(selectedBooks)}
                          disabled={deleteMultipleMutation.isPending}
                        >
                          Delete Selected ({selectedBooks.length})
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {booksLoading ? (
                      <div className="text-center py-8">Loading books...</div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedBooks.length === (books as any[]).length && (books as any[]).length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedBooks((books as any[]).map((book: any) => book.id));
                              } else {
                                setSelectedBooks([]);
                              }
                            }}
                          />
                          <span className="text-sm">Select All ({(books as any[]).length} books)</span>
                        </div>

                        <div className="grid gap-4">
                          {(books as any[]).map((book: any) => (
                            <div key={book.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                              <Checkbox
                                checked={selectedBooks.includes(book.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedBooks([...selectedBooks, book.id]);
                                  } else {
                                    setSelectedBooks(selectedBooks.filter(id => id !== book.id));
                                  }
                                }}
                              />
                              
                              {book.coverImage && (
                                <img 
                                  src={book.coverImage} 
                                  alt={book.title}
                                  className="w-12 h-16 object-cover rounded"
                                />
                              )}
                              
                              <div className="flex-1">
                                <h4 className="font-medium">{book.title}</h4>
                                <p className="text-sm text-muted-foreground">by {book.author}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant={book.requiredTier === 'premium' ? 'default' : 'secondary'}>
                                    {book.requiredTier || book.tier}
                                  </Badge>
                                  {book.isFeatured && (
                                    <Badge variant="outline">
                                      <Star className="w-3 h-3 mr-1" />
                                      Featured
                                    </Badge>
                                  )}
                                  {!book.isVisible && (
                                    <Badge variant="destructive">Hidden</Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    console.log('Edit button clicked for book:', book);
                                    setEditingBook(book);
                                  }}
                                  data-testid={`button-edit-${book.id}`}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setBookToDelete(book);
                                    setDeleteConfirmOpen(true);
                                  }}
                                  data-testid={`button-delete-${book.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Monthly subscription revenue breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Basic Plans (£5.99/month)</span>
                    <span className="text-sm font-bold">£{analyticsData?.revenueByTier?.basic || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Premium Plans (£9.99/month)</span>
                    <span className="text-sm font-bold">£{analyticsData?.revenueByTier?.premium || 0}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex items-center justify-between font-medium">
                      <span>Total Monthly Revenue</span>
                      <span>£{analyticsData?.totalRevenue || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Popular Books</CardTitle>
                <CardDescription>Most viewed books this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData?.popularBooks?.slice(0, 5).map((book: any, index: number) => (
                    <div key={book.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                        <span className="text-sm font-medium">{book.title}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>{book.views}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span>{book.rating}</span>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <p className="text-sm text-muted-foreground">No analytics data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Management Tab */}
        <TabsContent value="management">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserCheck className="w-5 h-5" />
                  <span>User Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UserManagement />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>Category Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryManager />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{bookToDelete?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bookToDelete && deleteBookMutation.mutate(bookToDelete.id)}
              disabled={deleteBookMutation.isPending}
            >
              {deleteBookMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Book Dialog */}
      <EditItemDialog
        isOpen={!!editingBook}
        onClose={() => {
          setEditingBook(null);
          editForm.reset();
          setEditDescription("");
        }}
        onSave={onEditSubmit}
        title="Edit Book"
        description="Update book details and settings"
        isSaving={updateBookMutation.isPending}
        maxWidth="2xl"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                {...editForm.register("title")}
                placeholder="Enter book title"
              />
              {editForm.formState.errors.title && (
                <p className="text-sm text-red-500">{editForm.formState.errors.title.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-author">Author</Label>
              <Input
                id="edit-author"
                {...editForm.register("author")}
                placeholder="Enter author name"
              />
              {editForm.formState.errors.author && (
                <p className="text-sm text-red-500">{editForm.formState.errors.author.message as string}</p>
              )}
            </div>
          </div>

          {/* Image Upload */}
          <ImageUploader
            value={editForm.watch("coverImage") || ""}
            onChange={(imageUrl) => editForm.setValue("coverImage", imageUrl)}
            label="Cover Image"
          />

          {/* Rich Text Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <RichTextEditor
              content={editDescription}
              onChange={setEditDescription}
              placeholder="Enter book description with rich formatting..."
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>Rich text formatting available</span>
              <span>{editDescription.length}/5000 characters</span>
            </div>
            {editDescription.length < 10 && editDescription.length > 0 && (
              <p className="text-sm text-red-500">Description must be at least 10 characters</p>
            )}
            {editDescription.length > 5000 && (
              <p className="text-sm text-red-500">Description cannot exceed 5000 characters</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Categories (Select multiple)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 border rounded-md">
              {(categories as any[]).map((category: any) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-category-${category.id}`}
                    checked={editForm.watch("categories")?.includes(category.id) || false}
                    onCheckedChange={(checked) => {
                      const currentCategories = editForm.watch("categories") || [];
                      if (checked) {
                        editForm.setValue("categories", [...currentCategories, category.id]);
                      } else {
                        editForm.setValue("categories", currentCategories.filter((id: string) => id !== category.id));
                      }
                    }}
                  />
                  <Label htmlFor={`edit-category-${category.id}`} className="text-sm font-normal">
                    {category.name}
                  </Label>
                </div>
              ))}
            </div>
            {editForm.formState.errors.categories && (
              <p className="text-sm text-red-500">{editForm.formState.errors.categories.message as string}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="edit-tier">Subscription Tier</Label>
              <Select onValueChange={(value) => editForm.setValue("tier", value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free Trial</SelectItem>
                  <SelectItem value="basic">Basic (£5.99)</SelectItem>
                  <SelectItem value="premium">Premium (£9.99)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-rating">Rating (1-5)</Label>
              <Input
                id="edit-rating"
                type="number"
                min="1"
                max="5"
                {...editForm.register("rating", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-visible"
                checked={editForm.watch("isVisible")}
                onCheckedChange={(checked) => editForm.setValue("isVisible", checked as boolean)}
              />
              <Label htmlFor="edit-visible">Book is visible to users</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-featured"
                checked={editForm.watch("isFeatured")}
                onCheckedChange={(checked) => editForm.setValue("isFeatured", checked as boolean)}
              />
              <Label htmlFor="edit-featured">Feature this book</Label>
            </div>
          </div>
        </div>
      </EditItemDialog>
        </div>
      </div>
    </>
  );
}