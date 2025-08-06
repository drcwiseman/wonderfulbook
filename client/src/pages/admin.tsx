import { useState } from "react";
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
import { Upload, Book, Users, TrendingUp, DollarSign, Eye, EyeOff, Edit3, Trash2, Save, X } from "lucide-react";
import { RichTextEditor } from "@/components/RichTextEditor";
import { ImageUploader } from "@/components/ImageUploader";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";

const uploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  tier: z.enum(["free", "basic", "premium"]),
  rating: z.number().min(1).max(5),
  coverImage: z.string().optional(),
  file: z.any().refine((file) => file?.length > 0, "PDF file is required"),
});

const editBookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  tier: z.enum(["free", "basic", "premium"]),
  rating: z.number().min(1).max(5),
  coverImage: z.string().optional(),
  isVisible: z.boolean().optional(),
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

  // Admin authorization check
  const isAdmin = (user as any)?.id === "45814604" || (user as any)?.email === "drcwiseman@gmail.com";

  const form = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      tier: "free",
      rating: 4,
      coverImage: "",
    },
  });

  const editForm = useForm<EditBookForm>({
    resolver: zodResolver(editBookSchema),
  });

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

  // Create book mutation
  const createBookMutation = useMutation({
    mutationFn: async (data: UploadForm) => {
      return apiRequest("POST", "/api/admin/books", {
        title: data.title,
        author: data.author,
        description: description,
        category: data.category,
        tier: data.tier,
        rating: data.rating,
        coverImage: data.coverImage,
        fileUrl: "placeholder.pdf", // For now, placeholder until file upload is implemented
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Book created successfully!",
      });
      form.reset();
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/books"] });
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
      return apiRequest("PATCH", `/api/admin/books/${data.id}`, {
        title: data.title,
        author: data.author,
        description: data.description,
        category: data.category,
        tier: data.tier,
        rating: data.rating,
        coverImage: data.coverImage,
        isVisible: data.isVisible,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Book updated successfully!",
      });
      setEditingBook(null);
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
    editForm.reset({
      title: book.title,
      author: book.author,
      description: book.description,
      category: book.category,
      tier: book.tier,
      rating: book.rating,
      coverImage: book.coverImage || "",
      isVisible: book.isVisible,
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
    createBookMutation.mutate(data);
  };

  const onEditSubmit = (data: EditBookForm) => {
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload">Upload Books</TabsTrigger>
            <TabsTrigger value="manage">Book Management</TabsTrigger>
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
                    value={form.watch("coverImage")}
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
                    {description.length < 10 && (
                      <p className="text-sm text-red-500">Description must be at least 10 characters</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select onValueChange={(value) => form.setValue("category", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="self-improvement">Self Improvement</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="productivity">Productivity</SelectItem>
                          <SelectItem value="psychology">Psychology</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="leadership">Leadership</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

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

                    <div className="space-y-2">
                      <Label htmlFor="file">PDF File</Label>
                      <Input
                        id="file"
                        type="file"
                        accept=".pdf"
                        {...form.register("file")}
                      />
                      {form.formState.errors.file && (
                        <p className="text-sm text-red-500">{form.formState.errors.file.message as string}</p>
                      )}
                    </div>
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
                    {(books as any[]).map((book: any) => (
                      <div
                        key={book.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="flex items-center space-x-4">
                          <input
                            type="checkbox"
                            checked={selectedBooks.includes(book.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBooks([...selectedBooks, book.id]);
                              } else {
                                setSelectedBooks(selectedBooks.filter(id => id !== book.id));
                              }
                            }}
                            className="rounded"
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
                  Subscription management features coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Book Dialog */}
        <Dialog open={!!editingBook} onOpenChange={() => setEditingBook(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Book</DialogTitle>
              <DialogDescription>
                Update book information and settings
              </DialogDescription>
            </DialogHeader>
            {editingBook && (
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
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
                  <Textarea
                    {...editForm.register("description")}
                    placeholder="Enter book description..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Category</Label>
                    <Select onValueChange={(value) => editForm.setValue("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self-improvement">Self Improvement</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="productivity">Productivity</SelectItem>
                        <SelectItem value="psychology">Psychology</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="leadership">Leadership</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-tier">Subscription Tier</Label>
                    <Select onValueChange={(value) => editForm.setValue("tier", value as any)}>
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

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-visible"
                    checked={editForm.watch("isVisible")}
                    onCheckedChange={(checked) => editForm.setValue("isVisible", !!checked)}
                  />
                  <Label htmlFor="edit-visible">Book is visible to users</Label>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditingBook(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={editBookMutation.isPending}>
                    {editBookMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}