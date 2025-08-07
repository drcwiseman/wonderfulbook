import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Trophy, 
  Users, 
  Calendar, 
  Target, 
  MessageSquare,
  Heart,
  Medal,
  Star,
  TrendingUp,
  Crown,
  ArrowLeft,
  Send,
  Edit
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation, useRoute } from "wouter";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AccessibleContent, { SpeakableText } from "@/components/AccessibleContent";

const updateProgressSchema = z.object({
  progress: z.number().min(0),
  notes: z.string().optional(),
});

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment too long"),
});

type UpdateProgressForm = z.infer<typeof updateProgressSchema>;
type CommentForm = z.infer<typeof commentSchema>;

export default function ChallengeDetailPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/challenges/:id");
  const challengeId = params?.id;
  
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [showAllParticipants, setShowAllParticipants] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Please sign in",
        description: "You need to sign in to view challenge details",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch challenge details
  const { data: challenge, isLoading: challengeLoading } = useQuery({
    queryKey: ['/api/challenges', challengeId],
    enabled: !!challengeId && !!isAuthenticated,
  });

  // Fetch user's participation
  const { data: participation } = useQuery({
    queryKey: ['/api/challenges', challengeId, 'participation'],
    enabled: !!challengeId && !!isAuthenticated,
  });

  // Join challenge mutation
  const joinMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/challenges/${challengeId}/join`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/challenges', challengeId] });
      queryClient.invalidateQueries({ queryKey: ['/api/challenges', challengeId, 'participation'] });
      toast({
        title: "Joined Challenge",
        description: "You've successfully joined the challenge!",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to join challenge",
        variant: "destructive",
      });
    },
  });

  // Update progress mutation
  const progressMutation = useMutation({
    mutationFn: async (data: UpdateProgressForm) => {
      return await apiRequest(`/api/challenges/${challengeId}/progress`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/challenges', challengeId] });
      queryClient.invalidateQueries({ queryKey: ['/api/challenges', challengeId, 'participation'] });
      setIsProgressOpen(false);
      progressForm.reset();
      toast({
        title: "Progress Updated",
        description: "Your challenge progress has been updated!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async (data: CommentForm) => {
      return await apiRequest(`/api/challenges/${challengeId}/comments`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/challenges', challengeId] });
      commentForm.reset();
      toast({
        title: "Comment Posted",
        description: "Your comment has been added to the challenge!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const progressForm = useForm<UpdateProgressForm>({
    resolver: zodResolver(updateProgressSchema),
    defaultValues: {
      progress: participation?.progress || 0,
      notes: participation?.notes || "",
    },
  });

  const commentForm = useForm<CommentForm>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
    },
  });

  const formatChallengeType = (type: string) => {
    switch (type) {
      case 'books_count': return 'Books';
      case 'pages_count': return 'Pages';
      case 'time_duration': return 'Days';
      default: return type;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const isActive = (challenge: any) => {
    const now = new Date();
    const start = new Date(challenge.startDate);
    const end = new Date(challenge.endDate);
    return now >= start && now <= end;
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  if (isLoading || challengeLoading || !challenge) {
    return (
      <AccessibleContent>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white dark:from-gray-900 dark:to-gray-800">
          <Header />
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          </div>
          <Footer />
        </div>
      </AccessibleContent>
    );
  }

  const progressPercentage = participation 
    ? calculateProgress(participation.progress, challenge.targetValue)
    : 0;

  const displayedParticipants = showAllParticipants 
    ? challenge.participants 
    : challenge.participants.slice(0, 6);

  return (
    <AccessibleContent>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white dark:from-gray-900 dark:to-gray-800">
        <Header />
        
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/challenges')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Challenges
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Challenge Details - Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Challenge Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                        <SpeakableText>{challenge.title}</SpeakableText>
                      </CardTitle>
                      <CardDescription className="mt-2 text-base">
                        <SpeakableText>{challenge.description}</SpeakableText>
                      </CardDescription>
                    </div>
                    <Badge className={getDifficultyColor(challenge.difficulty || 'medium')}>
                      {challenge.difficulty || 'medium'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="text-center">
                      <Target className="h-6 w-6 text-orange-500 mx-auto mb-1" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        <SpeakableText>{challenge.targetValue}</SpeakableText>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <SpeakableText>{formatChallengeType(challenge.type)}</SpeakableText>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <Users className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        <SpeakableText>{challenge.participantCount || 0}</SpeakableText>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <SpeakableText>Participants</SpeakableText>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <Calendar className="h-6 w-6 text-green-500 mx-auto mb-1" />
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        <SpeakableText>
                          {Math.ceil((new Date(challenge.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                        </SpeakableText>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <SpeakableText>Remaining</SpeakableText>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        <SpeakableText>{isActive(challenge) ? 'Active' : 'Upcoming'}</SpeakableText>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <SpeakableText>Status</SpeakableText>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* User Progress */}
              {participation && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-orange-500" />
                      <SpeakableText>Your Progress</SpeakableText>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">
                        <SpeakableText>
                          {participation.progress} / {challenge.targetValue} {formatChallengeType(challenge.type)}
                        </SpeakableText>
                      </span>
                      <span className="text-2xl font-bold text-orange-500">
                        <SpeakableText>{Math.round(progressPercentage)}%</SpeakableText>
                      </span>
                    </div>
                    
                    <Progress value={progressPercentage} className="h-3" />
                    
                    {participation.notes && (
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <SpeakableText>"{participation.notes}"</SpeakableText>
                        </p>
                      </div>
                    )}
                    
                    {participation.isCompleted && (
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <Medal className="h-5 w-5" />
                        <SpeakableText>
                          <span className="font-semibold">Challenge Completed!</span>
                        </SpeakableText>
                      </div>
                    )}
                    
                    <Dialog open={isProgressOpen} onOpenChange={setIsProgressOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-orange-500 hover:bg-orange-600">
                          <Edit className="h-4 w-4 mr-2" />
                          Update Progress
                        </Button>
                      </DialogTrigger>
                      
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Your Progress</DialogTitle>
                        </DialogHeader>
                        
                        <Form {...progressForm}>
                          <form onSubmit={progressForm.handleSubmit((data) => progressMutation.mutate(data))} className="space-y-4">
                            <FormField
                              control={progressForm.control}
                              name="progress"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    Current Progress ({formatChallengeType(challenge.type)})
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min="0"
                                      max={challenge.targetValue}
                                      {...field}
                                      onChange={e => field.onChange(parseInt(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={progressForm.control}
                              name="notes"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Notes (optional)</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Share your thoughts, achievements, or motivation..."
                                      className="h-20"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="flex justify-end gap-3 pt-4">
                              <Button type="button" variant="outline" onClick={() => setIsProgressOpen(false)}>
                                Cancel
                              </Button>
                              <Button 
                                type="submit" 
                                disabled={progressMutation.isPending}
                                className="bg-orange-500 hover:bg-orange-600"
                              >
                                {progressMutation.isPending ? "Updating..." : "Update Progress"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              )}

              {/* Join Challenge */}
              {!participation && (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <h3 className="text-lg font-semibold mb-2">
                      <SpeakableText>Join this challenge and start your reading journey!</SpeakableText>
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      <SpeakableText>Track your progress, compete with others, and achieve your reading goals.</SpeakableText>
                    </p>
                    <Button 
                      onClick={() => joinMutation.mutate()}
                      disabled={joinMutation.isPending}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2"
                    >
                      {joinMutation.isPending ? "Joining..." : "Join Challenge"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Comments Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    <SpeakableText>Discussion ({challenge.comments?.length || 0})</SpeakableText>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Post Comment Form */}
                  {participation && (
                    <Form {...commentForm}>
                      <form 
                        onSubmit={commentForm.handleSubmit((data) => commentMutation.mutate(data))}
                        className="space-y-4"
                      >
                        <FormField
                          control={commentForm.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea 
                                  placeholder="Share your thoughts, progress, or encouragement..."
                                  className="h-20"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-end">
                          <Button 
                            type="submit" 
                            disabled={commentMutation.isPending}
                            className="bg-blue-500 hover:bg-blue-600"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            {commentMutation.isPending ? "Posting..." : "Post Comment"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  )}
                  
                  {/* Comments List */}
                  <div className="space-y-4">
                    {challenge.comments && challenge.comments.length > 0 ? (
                      challenge.comments.map((comment: any) => (
                        <div key={comment.id} className="border-l-4 border-gray-200 dark:border-gray-700 pl-4 py-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  User #{comment.userId.slice(-6)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300">
                                <SpeakableText>{comment.content}</SpeakableText>
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Heart className="h-4 w-4" />
                              <SpeakableText>{comment.likes || 0}</SpeakableText>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        <SpeakableText>
                          {participation 
                            ? "No comments yet. Be the first to share your thoughts!" 
                            : "Join the challenge to participate in the discussion"
                          }
                        </SpeakableText>
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Right Column */}
            <div className="space-y-6">
              {/* Challenge Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-500" />
                    <SpeakableText>Challenge Info</SpeakableText>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">Start Date:</span>
                    <p className="text-gray-600 dark:text-gray-400">
                      <SpeakableText>{new Date(challenge.startDate).toLocaleDateString()}</SpeakableText>
                    </p>
                  </div>
                  
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">End Date:</span>
                    <p className="text-gray-600 dark:text-gray-400">
                      <SpeakableText>{new Date(challenge.endDate).toLocaleDateString()}</SpeakableText>
                    </p>
                  </div>
                  
                  {challenge.prize && (
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">Prize:</span>
                      <p className="text-gray-600 dark:text-gray-400">
                        <SpeakableText>{challenge.prize}</SpeakableText>
                      </p>
                    </div>
                  )}
                  
                  {challenge.tags && challenge.tags.length > 0 && (
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">Tags:</span>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {challenge.tags.map((tag: string) => (
                          <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Leaderboard */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <SpeakableText>Leaderboard</SpeakableText>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {displayedParticipants.map((participant: any, index: number) => (
                      <div key={participant.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-orange-600 text-white' :
                            'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}>
                            {index < 3 ? (
                              index === 0 ? <Crown className="h-3 w-3" /> :
                              index === 1 ? <Medal className="h-3 w-3" /> :
                              <Star className="h-3 w-3" />
                            ) : (
                              index + 1
                            )}
                          </div>
                          <span className="text-sm">
                            <SpeakableText>
                              {participant.userId === user?.id ? 'You' : `User #${participant.userId.slice(-6)}`}
                            </SpeakableText>
                          </span>
                        </div>
                        <div className="text-sm font-semibold">
                          <SpeakableText>
                            {participant.progress}/{challenge.targetValue}
                          </SpeakableText>
                        </div>
                      </div>
                    ))}
                    
                    {challenge.participants.length > 6 && !showAllParticipants && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowAllParticipants(true)}
                        className="w-full"
                      >
                        Show {challenge.participants.length - 6} more
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    <SpeakableText>Recent Activity</SpeakableText>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {challenge.activities && challenge.activities.length > 0 ? (
                      challenge.activities.slice(0, 5).map((activity: any) => (
                        <div key={activity.id} className="text-sm">
                          <p className="text-gray-700 dark:text-gray-300">
                            <SpeakableText>{activity.message}</SpeakableText>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            <SpeakableText>{new Date(activity.createdAt).toLocaleDateString()}</SpeakableText>
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">
                        <SpeakableText>No recent activity</SpeakableText>
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    </AccessibleContent>
  );
}