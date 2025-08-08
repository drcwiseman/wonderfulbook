import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Bug, 
  MessageSquare, 
  Heart, 
  Info, 
  User, 
  Calendar, 
  Monitor,
  Globe,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Filter,
  RefreshCw
} from 'lucide-react';
import type { Feedback } from '@shared/schema';

export default function AdminFeedbackManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [adminResponse, setAdminResponse] = useState('');

  // Fetch feedback list
  const { data: feedbackData, isLoading, refetch } = useQuery({
    queryKey: ['/api/feedback', statusFilter, typeFilter, priorityFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      
      const response = await fetch(`/api/feedback?${params}`);
      return response.json();
    }
  });

  // Fetch feedback statistics
  const { data: stats, error: statsError } = useQuery({
    queryKey: ['/api/feedback/stats'],
    queryFn: async () => {
      const response = await fetch('/api/feedback/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      return response.json();
    },
    retry: false
  });

  // Fetch selected feedback details
  const { data: selectedFeedbackData } = useQuery({
    queryKey: ['/api/feedback', selectedFeedback],
    queryFn: async () => {
      const response = await fetch(`/api/feedback/${selectedFeedback}`);
      return response.json();
    },
    enabled: !!selectedFeedback
  });

  // Update feedback mutation
  const updateFeedbackMutation = useMutation({
    mutationFn: async ({ id, status, adminResponse }: { id: string; status?: string; adminResponse?: string }) => {
      return await apiRequest(`/api/feedback/${id}`, 'PATCH', { status, adminResponse });
    },
    onSuccess: () => {
      toast({ title: "Feedback updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/feedback'] });
      setAdminResponse('');
    },
    onError: () => {
      toast({ title: "Failed to update feedback", variant: "destructive" });
    }
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="h-4 w-4 text-red-500" />;
      case 'suggestion': return <Info className="h-4 w-4 text-blue-500" />;
      case 'compliment': return <Heart className="h-4 w-4 text-pink-500" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'in_progress': return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed': return <XCircle className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
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

  const handleStatusUpdate = (status: string) => {
    if (selectedFeedback) {
      updateFeedbackMutation.mutate({ id: selectedFeedback, status });
    }
  };

  const handleResponseSubmit = () => {
    if (selectedFeedback && adminResponse.trim()) {
      updateFeedbackMutation.mutate({ 
        id: selectedFeedback, 
        adminResponse: adminResponse.trim() 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Feedback Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage user feedback, bug reports, and suggestions</p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Feedback</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.stats?.total || 0}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open Issues</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats?.stats?.open || 0}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bug Reports</p>
                    <p className="text-2xl font-bold text-red-600">{stats?.stats?.bugs || 0}</p>
                  </div>
                  <Bug className="h-8 w-8 text-red-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical</p>
                    <p className="text-2xl font-bold text-red-800">{stats?.stats?.critical || 0}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feedback List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Feedback & Bug Reports</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
                
                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                  <Select onValueChange={setStatusFilter} defaultValue="all">
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select onValueChange={setTypeFilter} defaultValue="all">
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="bug">Bugs</SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
                      <SelectItem value="suggestion">Suggestions</SelectItem>
                      <SelectItem value="compliment">Compliments</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select onValueChange={setPriorityFilter} defaultValue="all">
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-6 text-center">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p>Loading feedback...</p>
                  </div>
                ) : feedbackData?.feedback?.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No feedback found matching current filters.
                  </div>
                ) : (
                  <div className="divide-y">
                    {feedbackData?.feedback?.map((item: any) => (
                      <div
                        key={item.feedback.id}
                        className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          selectedFeedback === item.feedback.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                        onClick={() => setSelectedFeedback(item.feedback.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(item.feedback.type)}
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {item.feedback.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getPriorityColor(item.feedback.priority)}>
                              {item.feedback.priority}
                            </Badge>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(item.feedback.status)}
                              <span className="text-sm capitalize">{item.feedback.status.replace('_', ' ')}</span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {item.feedback.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {item.user && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {item.user.firstName} {item.user.lastName}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.feedback.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {item.feedback.category}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Feedback Details */}
          <div className="lg:col-span-1">
            {selectedFeedbackData ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Feedback Details</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(selectedFeedbackData.feedback.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(selectedFeedbackData.feedback.type)}
                      <h3 className="font-semibold">{selectedFeedbackData.feedback.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedFeedbackData.feedback.description}
                    </p>
                  </div>

                  {selectedFeedbackData.user && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                      <h4 className="font-medium mb-1">Submitted by</h4>
                      <p className="text-sm">{selectedFeedbackData.user.firstName} {selectedFeedbackData.user.lastName}</p>
                      <p className="text-xs text-gray-500">{selectedFeedbackData.user.email}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="font-medium">Technical Details</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-3 w-3" />
                        <span>Screen: {selectedFeedbackData.feedback.deviceInfo.screenResolution}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="h-3 w-3" />
                        <span>Platform: {selectedFeedbackData.feedback.deviceInfo.platform}</span>
                      </div>
                    </div>
                  </div>

                  {selectedFeedbackData.feedback.screenshot && (
                    <div>
                      <h4 className="font-medium mb-2">Screenshot</h4>
                      <img 
                        src={selectedFeedbackData.feedback.screenshot} 
                        alt="User screenshot" 
                        className="w-full rounded border"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="font-medium">Update Status</h4>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStatusUpdate('in_progress')}
                      >
                        In Progress
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStatusUpdate('resolved')}
                      >
                        Resolve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStatusUpdate('closed')}
                      >
                        Close
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Admin Response</h4>
                    <Textarea
                      placeholder="Add your response to the user..."
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      rows={3}
                    />
                    <Button 
                      onClick={handleResponseSubmit}
                      disabled={!adminResponse.trim() || updateFeedbackMutation.isPending}
                      size="sm"
                    >
                      Send Response
                    </Button>
                  </div>

                  {selectedFeedbackData.feedback.adminResponse && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                      <h4 className="font-medium mb-1">Previous Response</h4>
                      <p className="text-sm">{selectedFeedbackData.feedback.adminResponse}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(selectedFeedbackData.feedback.adminResponseAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  Select a feedback item to view details
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}