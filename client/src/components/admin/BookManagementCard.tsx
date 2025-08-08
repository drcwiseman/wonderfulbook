import { useState, useEffect } from 'react';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Upload, Book, Edit3, Trash2, Save, X, Eye, EyeOff, Star } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { RichTextEditor } from '@/components/RichTextEditor';
import { ImageUploader } from '@/components/ImageUploader';
import { PDFUploader } from '@/components/PDFUploader';

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

interface BookManagementCardProps {
  isAdmin: boolean;
}

export function BookManagementCard({ isAdmin }: BookManagementCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [description, setDescription] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [pdfFile, setPdfFile] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<any>(null);

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
  const { data: books = [], isLoading: booksLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/books"],
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

  const handleSubmit = (data: UploadForm) => {
    createBookMutation.mutate(data);
  };

  const handleBookSelect = (bookId: string) => {
    setSelectedBooks(prev => 
      prev.includes(bookId) 
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBooks.length === books.length) {
      setSelectedBooks([]);
    } else {
      setSelectedBooks(books.map((book: any) => book.id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedBooks.length > 0) {
      deleteMultipleMutation.mutate(selectedBooks);
    }
  };

  const handleDeleteSingle = (book: any) => {
    setBookToDelete(book);
    setDeleteConfirmOpen(true);
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Book Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload New Book
          </CardTitle>
          <CardDescription>
            Add a new book to the Wonderful Books library
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter book title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="author"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Author</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter author name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Tier</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select tier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating (1-5)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="5" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <RichTextEditor
                  content={description}
                  onChange={setDescription}
                  placeholder="Enter a detailed description of the book..."
                />
                {description.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {description.length}/5000 characters
                  </p>
                )}
              </div>

              <div>
                <Label>Cover Image</Label>
                <ImageUploader 
                  value={form.watch("coverImage") || ""} 
                  onChange={(url: string) => form.setValue("coverImage", url)} 
                />
              </div>

              <div>
                <Label>PDF File</Label>
                <PDFUploader 
                  value={pdfFile} 
                  onChange={setPdfFile} 
                />
              </div>

              <FormField
                control={form.control}
                name="isFeatured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Featured Book</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        This book will be highlighted on the homepage
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                disabled={createBookMutation.isPending}
                className="w-full"
              >
                {createBookMutation.isPending ? "Uploading..." : "Upload Book"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Book Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Book Management
            </span>
            {selectedBooks.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
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
          ) : books.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No books found. Upload your first book above.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedBooks.length === books.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm">Select All ({books.length} books)</span>
              </div>

              <div className="grid gap-4">
                {books.map((book: any) => (
                  <div key={book.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Checkbox
                      checked={selectedBooks.includes(book.id)}
                      onCheckedChange={() => handleBookSelect(book.id)}
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
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={book.tier === 'premium' ? 'default' : 'secondary'}>
                          {book.tier}
                        </Badge>
                        {book.isFeatured && (
                          <Badge variant="outline">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                        {!book.isVisible && (
                          <Badge variant="destructive">Hidden</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingBook(book)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteSingle(book)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}