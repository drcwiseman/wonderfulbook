import React, { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Save, X, Edit3 } from "lucide-react";

interface EditItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  isSaving?: boolean;
  showSaveButton?: boolean;
  saveButtonText?: string;
  cancelButtonText?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showHeader?: boolean;
}

export function EditItemDialog({
  isOpen,
  onClose,
  onSave,
  title,
  description,
  children,
  isSaving = false,
  showSaveButton = true,
  saveButtonText = "Save Changes",
  cancelButtonText = "Cancel",
  maxWidth = 'md',
  showHeader = true
}: EditItemDialogProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };


  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${maxWidthClasses[maxWidth]} max-h-[90vh] overflow-y-auto`}>
        {showHeader && (
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-orange-600 dark:text-orange-500" />
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-gray-600 dark:text-gray-300">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        )}

        <div className="py-4">
          {children}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4 mr-2" />
            {cancelButtonText}
          </Button>
          
          {showSaveButton && onSave && (
            <Button
              type="submit"
              onClick={onSave}
              disabled={isSaving}
              className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {saveButtonText}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}