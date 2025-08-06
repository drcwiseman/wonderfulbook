import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, Book, Users, TrendingUp, DollarSign, Eye, EyeOff, Edit3, Trash2, Save, X, AlertTriangle, Star, BarChart3, Settings, Library, UserCheck, Plus } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { RichTextEditor } from "@/components/RichTextEditor";
import { ImageUploader } from "@/components/ImageUploader";
import { PDFUploader } from "@/components/PDFUploader";
import { CategoryManager } from "@/components/CategoryManager";
import { UserManagement } from "@/components/UserManagement";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";

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

type UploadForm = z.infer<typeof uploadSchema>;

export default function AdminPanel() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [pdfFile, setPdfFile] = useState("");
  const [activeTab, setActiveTab] = useState("analytics");

  // Admin authorization check
  const isAdmin = (user as any)?.id === "45814604" || (user as any)?.email === "drcwiseman@gmail.com";

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

  // Fetch categories for forms
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/admin/categories"],
    enabled: isAdmin,
  });

  // Create book mutation
  const createBookMutation = useMutation({
    mutationFn: async (data: UploadForm) => {
      const bookData = {
        ...data,
        description,
      };
      await apiRequest("POST", "/api/admin/books", bookData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Book uploaded successfully!",
      });
      form.reset();
      setDescription("");
      setPdfFile("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload book",
        variant: "destructive",
      });
    },
  });

  // Handle book selection
  const handleSelectBook = (bookId: string, checked: boolean) => {
    if (checked) {
      setSelectedBooks([...selectedBooks, bookId]);
    } else {
      setSelectedBooks(selectedBooks.filter(id => id !== bookId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBooks((books as any[])?.map((book: any) => book.id) || []);
    } else {
      setSelectedBooks([]);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-96">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600 dark:text-gray-300">
              Please log in to access the admin panel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-96">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600 dark:text-gray-300">
              Access denied. Admin privileges required.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onSubmit = (data: UploadForm) => {
    const formDataWithFile = {
      ...data,
      fileUrl: pdfFile
    };
    
    createBookMutation.mutate(formDataWithFile);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Panel
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage books, subscriptions, and platform analytics
          </p>
        </div>

        {/* Main Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card 
            className={`cursor-pointer hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border-blue-200 dark:border-blue-700 ${
              activeTab === "analytics" ? "ring-2 ring-blue-500 shadow-lg" : ""
            }`}
            onClick={() => setActiveTab("analytics")}
          >
            <CardContent className="p-6 text-center">
              <BarChart3 className="w-8 h-8 mx-auto mb-3 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Analytics</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">Platform metrics & insights</p>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border-green-200 dark:border-green-700 ${
              activeTab === "content" ? "ring-2 ring-green-500 shadow-lg" : ""
            }`}
            onClick={() => setActiveTab("content")}
          >
            <CardContent className="p-6 text-center">
              <Library className="w-8 h-8 mx-auto mb-3 text-green-600 dark:text-green-400" />
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">Content Library</h3>
              <p className="text-sm text-green-700 dark:text-green-300">Manage books & uploads</p>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 border-purple-200 dark:border-purple-700 ${
              activeTab === "users" ? "ring-2 ring-purple-500 shadow-lg" : ""
            }`}
            onClick={() => setActiveTab("users")}
          >
            <CardContent className="p-6 text-center">
              <UserCheck className="w-8 h-8 mx-auto mb-3 text-purple-600 dark:text-purple-400" />
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">User Management</h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">Users, roles & subscriptions</p>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 border-orange-200 dark:border-orange-700 ${
              activeTab === "settings" ? "ring-2 ring-orange-500 shadow-lg" : ""
            }`}
            onClick={() => setActiveTab("settings")}
          >
            <CardContent className="p-6 text-center">
              <Settings className="w-8 h-8 mx-auto mb-3 text-orange-600 dark:text-orange-400" />
              <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">Platform Settings</h3>
              <p className="text-sm text-orange-700 dark:text-orange-300">Categories & configuration</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-gray-800 border rounded-lg p-1">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Library className="w-4 h-4" />
              Content Library
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Platform Settings
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Key Metrics */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Users</p>
                          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{analytics?.totalUsers || 0}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-700 dark:text-green-300">Active Subscriptions</p>
                          <p className="text-2xl font-bold text-green-900 dark:text-green-100">{analytics?.activeSubscriptions || 0}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 border-purple-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Monthly Revenue</p>
                          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">£{analytics?.monthlyRevenue || 0}</p>
                        </div>
                        <DollarSign className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Platform Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="font-medium">Trial Conversion Rate</span>
                        <Badge variant="secondary">{analytics?.conversionRate || 0}%</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="font-medium">Total Books</span>
                        <Badge variant="outline">{books?.length || 0}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="font-medium">Featured Books</span>
                        <Badge variant="default">{books?.filter((book: any) => book.isFeatured)?.length || 0}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab("content")}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload New Book
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab("users")}>
                    <Users className="w-4 h-4 mr-2" />
                    Add New User
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab("settings")}>
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Categories
                  </Button>
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
                            {categories.map((category: any) => (
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
                            <Label>Subscription Tier</Label>
                            <Select value={form.watch("tier")} onValueChange={(value) => form.setValue("tier", value as any)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">Free Tier</SelectItem>
                                <SelectItem value="basic">Basic Tier (£9.99/month)</SelectItem>
                                <SelectItem value="premium">Premium Tier (£19.99/month)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Rating</Label>
                            <Select value={String(form.watch("rating"))} onValueChange={(value) => form.setValue("rating", Number(value))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 Star</SelectItem>
                                <SelectItem value="2">2 Stars</SelectItem>
                                <SelectItem value="3">3 Stars</SelectItem>
                                <SelectItem value="4">4 Stars</SelectItem>
                                <SelectItem value="5">5 Stars</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="featured"
                            checked={form.watch("isFeatured") || false}
                            onCheckedChange={(checked) => form.setValue("isFeatured", !!checked)}
                          />
                          <Label htmlFor="featured">Featured book (appears on homepage)</Label>
                        </div>

                        <Button type="submit" disabled={createBookMutation.isPending || !pdfFile || description.length < 10}>
                          <Upload className="w-4 h-4 mr-2" />
                          {createBookMutation.isPending ? "Uploading..." : "Upload Book"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="manage">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Book className="w-5 h-5" />
                        <span>Manage Books</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {booksLoading ? (
                        <div className="text-center py-8">Loading books...</div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                checked={selectedBooks.length === (books as any[])?.length && (books as any[])?.length > 0}
                                onCheckedChange={handleSelectAll}
                              />
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                Select All ({(books as any[])?.length || 0} books)
                              </span>
                            </div>
                            {selectedBooks.length > 0 && (
                              <span className="text-sm text-blue-600 dark:text-blue-400">
                                {selectedBooks.length} book(s) selected
                              </span>
                            )}
                          </div>
                          {(books as any[] || []).map((book: any) => (
                            <div
                              key={book.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <div className="flex items-center space-x-4">
                                <Checkbox
                                  checked={selectedBooks.includes(book.id)}
                                  onCheckedChange={(checked) => handleSelectBook(book.id, checked as boolean)}
                                />
                                <div>
                                  <h3 className="font-medium text-gray-900 dark:text-white">
                                    {book.title}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    by {book.author} • {book.category}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <Badge variant={
                                  book.tier === "premium" ? "default" :
                                  book.tier === "basic" ? "secondary" : "outline"
                                }>
                                  {book.tier}
                                </Badge>
                                {book.isFeatured && (
                                  <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                                    <Star className="w-3 h-3 mr-1" />
                                    Featured
                                  </Badge>
                                )}
                                <Button size="sm" variant="ghost">
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost">
                                  {book.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </Button>
                                <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          {/* Platform Settings Tab */}
          <TabsContent value="settings">
            <CategoryManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}