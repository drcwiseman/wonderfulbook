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
import { Upload, Book, Users, TrendingUp, DollarSign, Eye, EyeOff, Edit3, Trash2, Save, X, AlertTriangle, Star } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { RichTextEditor } from "@/components/RichTextEditor";
import { ImageUploader } from "@/components/ImageUploader";
import { PDFUploader } from "@/components/PDFUploader";
import { CategoryManager } from "@/components/CategoryManager";
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

  // Fetch categories for forms
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/admin/categories"],
    enabled: isAdmin,
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

  // Edit book mutation
  const editBookMutation = useMutation({
    mutationFn: async (data: EditBookForm & { id: string }) => {
      const requestData = {
        title: data.title,
        author: data.author,
        description: editDescription || data.description,
        categories: data.categories,
        requiredTier: data.tier, // Map to correct database field
        rating: String(data.rating), // Convert to string for database
        coverImageUrl: data.coverImage, // Map to correct database field
        isVisible: data.isVisible,
        isFeatured: data.isFeatured,
      };
      console.log("Sending PATCH request to:", `/api/admin/books/${data.id}`);
      console.log("Request data:", requestData);
      
      return apiRequest("PATCH", `/api/admin/books/${data.id}`, requestData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Book updated successfully!",
      });
      setEditingBook(null);
      setEditDescription("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/books"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle edit book
  const handleEditBook = (book: any) => {
    setEditingBook(book);
    setEditDescription(book.description || "");
    
    // Convert category objects to IDs if needed
    const categoryIds = book.categories?.map((cat: any) => 
      typeof cat === 'string' ? cat : cat.id
    ) || [];
    
    editForm.reset({
      title: book.title,
      author: book.author,
      description: book.description,
      categories: categoryIds,
      tier: book.requiredTier || "free", // Use requiredTier from database
      rating: Number(book.rating) || 4,
      coverImage: book.coverImageUrl || "",
      isVisible: book.isVisible !== false, // Default to true if undefined
      isFeatured: book.isFeatured || false,
    });
  };

  // Toggle book visibility
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ bookId, visible }: { bookId: string; visible: boolean }) => {
      return apiRequest("PATCH", `/api/admin/books/${bookId}`, { visible });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/books"] });
    },
  });

  // Toggle featured status
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ bookId, isFeatured }: { bookId: string; isFeatured: boolean }) => {
      return apiRequest("PATCH", `/api/admin/books/${bookId}/featured`, { isFeatured });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Featured status updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/books"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update featured status",
        variant: "destructive",
      });
    },
  });

  // Bulk operations
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ bookIds, updates }: { bookIds: string[]; updates: any }) => {
      return apiRequest("PATCH", "/api/admin/books/bulk", { bookIds, updates });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Books updated successfully!" });
      setSelectedBooks([]);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/books"] });
    },
  });

  const handleDeleteBook = (book: any) => {
    setBookToDelete(book);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (bookToDelete) {
      deleteBookMutation.mutate(bookToDelete.id);
    }
  };

  const handleBulkDelete = () => {
    if (selectedBooks.length > 0) {
      deleteMultipleMutation.mutate(selectedBooks);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && books) {
      setSelectedBooks((books as any[]).map((book: any) => book.id));
    } else {
      setSelectedBooks([]);
    }
  };

  const handleSelectBook = (bookId: string, checked: boolean) => {
    setSelectedBooks(prev => 
      checked 
        ? [...prev, bookId]
        : prev.filter(id => id !== bookId)
    );
  };



  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-96">
          <CardContent className="pt-6 space-y-4">
            <p className="text-center text-gray-600 dark:text-gray-300">
              Please log in to access the admin panel.
            </p>
            <Button 
              className="w-full" 
              onClick={() => window.location.href = '/api/login'}
            >
              Log In
            </Button>
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
    // Set the fileUrl from the pdfFile state
    const formDataWithFile = {
      ...data,
      fileUrl: pdfFile
    };
    
    createBookMutation.mutate(formDataWithFile);
  };

  const onEditSubmit = (data: EditBookForm) => {
    console.log("Edit form submitted with data:", data);
    console.log("Edit form errors:", editForm.formState.errors);
    console.log("Editing book:", editingBook);
    
    if (editingBook) {
      editBookMutation.mutate({ ...data, id: editingBook.id });
    }
  };

  const handleBulkTierUpdate = (tier: string) => {
    if (selectedBooks.length === 0) return;
    bulkUpdateMutation.mutate({
      bookIds: selectedBooks,
      updates: { tier },
    });
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

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="upload">Upload Books</TabsTrigger>
            <TabsTrigger value="manage">Book Management</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
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
                      <Label htmlFor="tier">Subscription Tier</Label>
                      <Select onValueChange={(value) => form.setValue("tier", value as any)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free Trial</SelectItem>
                          <SelectItem value="basic">Basic (£9.99)</SelectItem>
                          <SelectItem value="premium">Premium (£19.99)</SelectItem>
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
                    className="w-full md:w-auto"
                  >
                    {createBookMutation.isPending ? "Creating..." : "Create Book"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Book Management Tab */}
          <TabsContent value="manage">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Book className="w-5 h-5" />
                    <span>Book Management</span>
                  </div>
                  {selectedBooks.length > 0 && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkTierUpdate("free")}
                      >
                        Set Free
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkTierUpdate("basic")}
                      >
                        Set Basic
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkTierUpdate("premium")}
                      >
                        Set Premium
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={deleteMultipleMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete Selected ({selectedBooks.length})
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center">
                              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                              Delete Selected Books
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {selectedBooks.length} book(s)? 
                              This action cannot be undone and will permanently remove the books 
                              and their associated files from the system.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleBulkDelete}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete Books
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {booksLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
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
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleFeaturedMutation.mutate({
                              bookId: book.id,
                              isFeatured: !book.isFeatured
                            })}
                            disabled={toggleFeaturedMutation.isPending}
                            className={book.isFeatured ? "text-yellow-600 hover:text-yellow-700" : "text-gray-400 hover:text-yellow-600"}
                          >
                            <Star className={`w-4 h-4 ${book.isFeatured ? "fill-current" : ""}`} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditBook(book)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleVisibilityMutation.mutate({
                              bookId: book.id,
                              visible: !book.visible
                            })}
                          >
                            {book.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteBook(book)}
                            disabled={deleteBookMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
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

          {/* Categories Tab */}
          <TabsContent value="categories">
            <CategoryManager />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Total Users</p>
                      <p className="text-2xl font-bold">{(analytics as any)?.totalUsers || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Active Subscriptions</p>
                      <p className="text-2xl font-bold">{(analytics as any)?.activeSubscriptions || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Monthly Revenue</p>
                      <p className="text-2xl font-bold">£{(analytics as any)?.monthlyRevenue || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Book className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Conversion Rate</p>
                      <p className="text-2xl font-bold">{(analytics as any)?.conversionRate || 0}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Subscription management features coming soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Book Dialog */}
        <Dialog open={!!editingBook} onOpenChange={() => setEditingBook(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Book</DialogTitle>
              <DialogDescription>
                Update book information and metadata.
              </DialogDescription>
            </DialogHeader>
            {editingBook && (
              <form 
                onSubmit={(e) => {
                  console.log("Form onSubmit triggered");
                  editForm.handleSubmit(onEditSubmit)(e);
                }} 
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      {...editForm.register("title")}
                      placeholder="Enter book title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-author">Author</Label>
                    <Input
                      id="edit-author"
                      {...editForm.register("author")}
                      placeholder="Enter author name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <RichTextEditor
                    content={editDescription}
                    onChange={setEditDescription}
                    placeholder="Enter book description..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Categories (Select multiple)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 border rounded-md">
                    {categories.map((category: any) => (
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  <div className="space-y-2">
                    <Label htmlFor="edit-tier">Subscription Tier</Label>
                    <Select 
                      value={editForm.watch("tier") || "free"} 
                      onValueChange={(value) => editForm.setValue("tier", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free Trial</SelectItem>
                        <SelectItem value="basic">Basic (£9.99)</SelectItem>
                        <SelectItem value="premium">Premium (£19.99)</SelectItem>
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

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-visible"
                      checked={editForm.watch("isVisible")}
                      onCheckedChange={(checked) => editForm.setValue("isVisible", !!checked)}
                    />
                    <Label htmlFor="edit-visible">Book is visible to users</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-featured"
                      checked={editForm.watch("isFeatured") || false}
                      onCheckedChange={(checked) => editForm.setValue("isFeatured", !!checked)}
                    />
                    <Label htmlFor="edit-featured" className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>Mark as Featured (will appear on home page)</span>
                    </Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditingBook(null)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={editBookMutation.isPending}
                    onClick={(e) => {
                      console.log("Save Changes button clicked");
                      console.log("Form valid:", editForm.formState.isValid);
                      console.log("Form errors:", editForm.formState.errors);
                      console.log("Form values:", editForm.getValues());
                    }}
                  >
                    {editBookMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                Delete Book
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{bookToDelete?.title}"? 
                This action cannot be undone and will permanently remove the book 
                and all associated files from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-500 hover:bg-red-600"
                disabled={deleteBookMutation.isPending}
              >
                {deleteBookMutation.isPending ? "Deleting..." : "Delete Book"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}