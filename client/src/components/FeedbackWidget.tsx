import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import type { InsertFeedback } from '@shared/schema';
import { 
  MessageSquare, 
  Bug, 
  Camera, 
  X, 
  Send, 
  CheckCircle,
  AlertTriangle,
  Info,
  Heart,
  Star,
  Upload,
  Monitor,
  Smartphone,
  Globe
} from 'lucide-react';

type FeedbackData = Omit<InsertFeedback, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

interface FeedbackWidgetProps {
  onClose: () => void;
}

export default function FeedbackWidget({ onClose }: FeedbackWidgetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<FeedbackData>>({
    type: 'feedback',
    priority: 'medium',
    category: '',
    title: '',
    description: '',
    url: window.location.href,
    userAgent: navigator.userAgent,
    deviceInfo: {
      platform: navigator.platform,
      browser: navigator.userAgent.split(' ').pop() || 'Unknown',
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    }
  });

  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);

  const submitFeedbackMutation = useMutation({
    mutationFn: async (data: FeedbackData) => {
      return await apiRequest('/api/feedback', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Feedback submitted successfully!",
        description: "Thank you for helping us improve Wonderful Books.",
        duration: 5000,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/feedback'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to submit feedback",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  });

  const captureScreenshot = async () => {
    setIsCapturingScreenshot(true);
    try {
      // Use html2canvas for screenshot capture (would need to be installed)
      // For now, we'll simulate screenshot capture
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      if (ctx) {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#333';
        ctx.font = '16px Arial';
        ctx.fillText('Screenshot captured', 20, 40);
        ctx.fillText(`${new Date().toLocaleString()}`, 20, 70);
        ctx.fillText(`URL: ${window.location.href}`, 20, 100);
        
        const screenshotData = canvas.toDataURL('image/png');
        setScreenshot(screenshotData);
        setFormData(prev => ({ ...prev, screenshot: screenshotData }));
      }
      
      toast({
        title: "Screenshot captured",
        description: "Screenshot has been attached to your feedback.",
      });
    } catch (error) {
      toast({
        title: "Screenshot failed",
        description: "Unable to capture screenshot. You can still submit feedback.",
        variant: "destructive",
      });
    } finally {
      setIsCapturingScreenshot(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title?.trim() || !formData.description?.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a title and description.",
        variant: "destructive",
      });
      return;
    }

    const feedbackData: FeedbackData = {
      type: formData.type!,
      category: formData.category!,
      title: formData.title!,
      description: formData.description!,
      priority: formData.priority!,
      url: formData.url!,
      userAgent: formData.userAgent!,
      deviceInfo: formData.deviceInfo!,
      screenshot: formData.screenshot
    };

    submitFeedbackMutation.mutate(feedbackData);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="h-4 w-4 text-red-500" />;
      case 'suggestion': return <Info className="h-4 w-4 text-blue-500" />;
      case 'compliment': return <Heart className="h-4 w-4 text-pink-500" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-semibold">Share Your Feedback</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Feedback Type */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { value: 'bug' as const, label: 'Bug Report', icon: <Bug className="h-4 w-4" /> },
                { value: 'feedback' as const, label: 'Feedback', icon: <MessageSquare className="h-4 w-4" /> },
                { value: 'suggestion' as const, label: 'Suggestion', icon: <Info className="h-4 w-4" /> },
                { value: 'compliment' as const, label: 'Compliment', icon: <Heart className="h-4 w-4" /> }
              ].map((type) => (
                <Button
                  key={type.value}
                  type="button"
                  variant={formData.type === type.value ? "default" : "outline"}
                  className="flex items-center gap-2 h-auto p-3"
                  onClick={() => setFormData(prev => ({ ...prev, type: type.value as any }))}
                >
                  {type.icon}
                  <span className="text-xs">{type.label}</span>
                </Button>
              ))}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reading">PDF Reader</SelectItem>
                  <SelectItem value="authentication">Login/Account</SelectItem>
                  <SelectItem value="subscription">Billing/Subscription</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="accessibility">Accessibility</SelectItem>
                  <SelectItem value="mobile">Mobile Experience</SelectItem>
                  <SelectItem value="ui">User Interface</SelectItem>
                  <SelectItem value="content">Book Content</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <div className="flex gap-2">
                {[
                  { value: 'low' as const, label: 'Low' },
                  { value: 'medium' as const, label: 'Medium' },
                  { value: 'high' as const, label: 'High' },
                  { value: 'critical' as const, label: 'Critical' }
                ].map((priority) => (
                  <Button
                    key={priority.value}
                    type="button"
                    variant={formData.priority === priority.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, priority: priority.value as any }))}
                    className={formData.priority === priority.value ? getPriorityColor(priority.value) : ''}
                  >
                    {priority.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Brief summary of your feedback"
                value={formData.title || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Please provide detailed information about your feedback. For bugs, include steps to reproduce the issue."
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                required
              />
            </div>

            {/* Screenshot */}
            <div className="space-y-2">
              <Label>Screenshot (optional)</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={captureScreenshot}
                  disabled={isCapturingScreenshot}
                  className="flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  {isCapturingScreenshot ? 'Capturing...' : 'Capture Screenshot'}
                </Button>
                {screenshot && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Screenshot attached
                  </Badge>
                )}
              </div>
            </div>

            {/* Device Info */}
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <Label className="text-sm font-medium">Technical Information</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Globe className="h-3 w-3" />
                  <span>URL: {formData.url}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Monitor className="h-3 w-3" />
                  <span>Screen: {formData.deviceInfo?.screenResolution}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="h-3 w-3" />
                  <span>Viewport: {formData.deviceInfo?.viewport}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Platform: {formData.deviceInfo?.platform}</span>
                </div>
              </div>
            </div>

            {/* User Info */}
            {user && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <Label className="text-sm font-medium">Contact Information</Label>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <p>Logged in as: {(user as any).firstName} {(user as any).lastName} ({(user as any).email})</p>
                  <p className="text-xs">We may contact you for follow-up questions.</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitFeedbackMutation.isPending}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {submitFeedbackMutation.isPending ? 'Sending...' : 'Send Feedback'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}