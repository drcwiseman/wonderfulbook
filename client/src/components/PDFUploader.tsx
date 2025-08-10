import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Upload, X, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PDFUploaderProps {
  value: string;
  onChange: (fileUrl: string) => void;
  label?: string;
  className?: string;
}

export function PDFUploader({ value, onChange, label = "PDF File", className = "" }: PDFUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    console.log('PDF file selected:', file.name, file.type, file.size);

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a PDF smaller than 50MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch('/api/admin/upload-pdf', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || errorData.message || 'Upload failed');
      }

      const result = await response.json();
      const fileUrl = result.fileUrl;

      onChange(fileUrl);

      toast({
        title: "Upload successful",
        description: "PDF uploaded successfully",
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload PDF. Please try again.",
        variant: "destructive",
      });
      setFileName('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setFileName('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    console.log('PDF dropped:', file?.name, file?.type);
    if (file && file.type === 'application/pdf') {
      // Create a fake input event
      const fakeEvent = {
        target: { files: [file] }
      } as any;
      handleFileSelect(fakeEvent);
    } else if (file) {
      toast({
        title: "Invalid file type",
        description: "Please drop a PDF file",
        variant: "destructive",
      });
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={(e) => {
          e.preventDefault();
          console.log('PDF drop zone clicked');
          fileInputRef.current?.click();
        }}
      >
        {value || fileName ? (
          <div className="flex items-center justify-center space-x-2">
            <FileText className="h-8 w-8 text-red-500" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">
                {fileName || 'PDF Uploaded'}
              </p>
              <p className="text-xs text-gray-500">PDF document</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <FileText className="h-6 w-6 text-gray-400" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Drag and drop a PDF here, or click to select
              </p>
              <p className="text-xs text-gray-400">
                Supports PDF files (max 50MB)
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Button
          type="button"
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('PDF upload button clicked');
            fileInputRef.current?.click();
          }}
          disabled={isUploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? 'Uploading...' : 'Choose PDF'}
        </Button>

        {(value || fileName) && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleRemove}
          >
            <X className="h-4 w-4 mr-2" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}