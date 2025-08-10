import { useState } from "react";
import { ObjectUploader } from "./ObjectUploader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Camera, User, Crown, Heart, Smile, Star, Zap, Coffee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { UploadResult } from "@uppy/core";

interface ProfilePhotoUploaderProps {
  currentPhotoUrl?: string;
  userId: string;
  onPhotoUpdate: (newPhotoUrl: string) => void;
}

const AVATAR_OPTIONS = [
  { id: "professional", icon: User, color: "bg-blue-500", label: "Professional" },
  { id: "royal", icon: Crown, color: "bg-yellow-500", label: "Royal" },
  { id: "friendly", icon: Heart, color: "bg-red-500", label: "Friendly" },
  { id: "happy", icon: Smile, color: "bg-green-500", label: "Happy" },
  { id: "star", icon: Star, color: "bg-purple-500", label: "Star" },
  { id: "energetic", icon: Zap, color: "bg-orange-500", label: "Energetic" },
  { id: "casual", icon: Coffee, color: "bg-brown-500", label: "Casual" },
];

export function ProfilePhotoUploader({ currentPhotoUrl, userId, onPhotoUpdate }: ProfilePhotoUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation for updating profile photo
  const updatePhotoMutation = useMutation({
    mutationFn: async (data: { profileImageUrl: string }) => {
      return await apiRequest("PUT", "/api/auth/profile-photo", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Profile photo updated",
        description: "Your profile photo has been updated successfully.",
      });
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile photo. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest("POST", "/api/objects/upload");
      return {
        method: "PUT" as const,
        url: response.uploadURL,
      };
    } catch (error) {
      toast({
        title: "Upload error",
        description: "Failed to get upload URL. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      // Extract the object path from the upload URL
      const uploadURL = uploadedFile.response?.uploadURL || uploadedFile.uploadURL;
      
      if (uploadURL) {
        // Convert the GCS URL to our object path format
        const objectPath = uploadURL.replace('https://storage.googleapis.com/', '/objects/');
        updatePhotoMutation.mutate({ profileImageUrl: objectPath });
        onPhotoUpdate(objectPath);
      }
    }
  };

  const handleAvatarSelect = (avatarId: string) => {
    const avatarUrl = `/api/avatars/${avatarId}`;
    updatePhotoMutation.mutate({ profileImageUrl: avatarUrl });
    onPhotoUpdate(avatarUrl);
  };

  const renderAvatar = (avatarId: string, size: string = "w-16 h-16") => {
    const avatar = AVATAR_OPTIONS.find(a => a.id === avatarId);
    if (!avatar) return null;
    
    const IconComponent = avatar.icon;
    return (
      <div className={`${size} ${avatar.color} rounded-full flex items-center justify-center text-white`}>
        <IconComponent className="w-1/2 h-1/2" />
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0 bg-white shadow-lg hover:bg-gray-50"
        >
          <Camera className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Profile Photo</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Photo */}
          <div className="text-center">
            <div className="inline-block relative">
              {currentPhotoUrl?.startsWith('/api/avatars/') ? (
                renderAvatar(currentPhotoUrl.split('/').pop() || '', "w-20 h-20")
              ) : (
                <img
                  src={currentPhotoUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"}
                  alt="Current profile"
                  className="w-20 h-20 rounded-full object-cover border-4 border-orange-500/50"
                />
              )}
            </div>
            <p className="text-sm text-gray-500 mt-2">Current photo</p>
          </div>

          {/* Upload Section */}
          <div className="space-y-3">
            <h4 className="font-medium">Upload New Photo</h4>
            <ObjectUploader
              maxNumberOfFiles={1}
              maxFileSize={5242880} // 5MB
              onGetUploadParameters={handleGetUploadParameters}
              onComplete={handleUploadComplete}
              buttonClassName="w-full"
            >
              <Camera className="w-4 h-4 mr-2" />
              Choose Photo
            </ObjectUploader>
            <p className="text-xs text-gray-500">
              Maximum file size: 5MB. Supported formats: JPG, PNG, GIF
            </p>
          </div>

          {/* Avatar Options */}
          <div className="space-y-3">
            <h4 className="font-medium">Or Choose an Avatar</h4>
            <div className="grid grid-cols-4 gap-3">
              {AVATAR_OPTIONS.map((avatar) => {
                const IconComponent = avatar.icon;
                return (
                  <button
                    key={avatar.id}
                    onClick={() => handleAvatarSelect(avatar.id)}
                    className="flex flex-col items-center space-y-1 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={updatePhotoMutation.isPending}
                  >
                    <div className={`w-12 h-12 ${avatar.color} rounded-full flex items-center justify-center text-white`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className="text-xs text-gray-600">{avatar.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading State */}
          {updatePhotoMutation.isPending && (
            <div className="text-center py-4">
              <div className="inline-flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600">Updating profile photo...</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}