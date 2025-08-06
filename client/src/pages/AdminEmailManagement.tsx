import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send, Clock, CheckCircle, XCircle, RefreshCw, Eye } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function AdminEmailManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDays, setSelectedDays] = useState(3);
  const [previewData, setPreviewData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'preview@example.com'
  });

  // Email scheduler status
  const { data: schedulerStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/admin/email-scheduler/status'],
  });

  // Email logs
  const { data: emailLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['/api/admin/email-logs'],
  });

  // Manual trigger mutation
  const triggerReminder = useMutation({
    mutationFn: async (daysFromNow: number) => {
      const response = await fetch('/api/admin/email-scheduler/trigger-trial-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ daysFromNow }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to trigger campaign');
      }
      
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Campaign Triggered',
        description: `Sent: ${data.results.sent}, Failed: ${data.results.failed}, Blocked: ${data.results.blocked}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-logs'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to trigger campaign',
        variant: 'destructive',
      });
    },
  });

  const handleTriggerCampaign = () => {
    triggerReminder.mutate(selectedDays);
  };

  const openEmailPreview = (templateType: string) => {
    const params = new URLSearchParams({
      firstName: previewData.firstName,
      lastName: previewData.lastName,
      email: previewData.email,
    });
    
    const previewUrl = `/api/admin/email-preview/${templateType}?${params}`;
    window.open(previewUrl, '_blank', 'width=800,height=600');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Sent</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'blocked':
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Blocked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <Mail className="w-8 h-8 text-orange-500" />
        <h1 className="text-3xl font-bold">Email Management</h1>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="logs">Email Logs</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduler Status</CardTitle>
                <Clock className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statusLoading ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">
                      {(schedulerStatus as any)?.initialized ? 'Active' : 'Inactive'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {(schedulerStatus as any)?.jobCount || 0} scheduled jobs
                    </div>
                    {(schedulerStatus as any)?.activeJobs && (
                      <div className="text-xs space-y-1">
                        {((schedulerStatus as any).activeJobs as string[]).map((job: string) => (
                          <div key={job} className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            {job.replace(/_/g, ' ')}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Emails</CardTitle>
                <Send className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">
                      {(emailLogs as any[])?.length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Last 50 email logs
                    </div>
                    {emailLogs && (emailLogs as any[]).length > 0 && (
                      <div className="text-xs space-y-1">
                        <div>
                          Sent: {(emailLogs as any[]).filter((log: any) => log.status === 'sent').length}
                        </div>
                        <div>
                          Failed: {(emailLogs as any[]).filter((log: any) => log.status === 'failed').length}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Email Templates</CardTitle>
                <Eye className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">3</div>
                  <div className="text-sm text-muted-foreground">
                    Active templates
                  </div>
                  <div className="text-xs space-y-1">
                    <div>• Trial Reminders</div>
                    <div>• Conversion Success</div>
                    <div>• Cancellation</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Manual Campaign Trigger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="space-y-2">
                  <Label htmlFor="days-select">Trial Reminder Days</Label>
                  <select
                    id="days-select"
                    value={selectedDays}
                    onChange={(e) => setSelectedDays(parseInt(e.target.value))}
                    className="flex h-10 w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value={1}>1 day before expiry</option>
                    <option value={3}>3 days before expiry</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button
                    onClick={handleTriggerCampaign}
                    disabled={triggerReminder.isPending}
                    className="flex items-center gap-2"
                  >
                    {triggerReminder.isPending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Trigger Campaign
                  </Button>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Automated Schedule
                </h4>
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <div>• 3-day reminders: Daily at 10:00 AM UK time</div>
                  <div>• 1-day reminders: Daily at 2:00 PM UK time</div>
                  <div>• Cleanup: Weekly on Sunday at 3:00 AM UK time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Email Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <div>Loading email logs...</div>
                </div>
              ) : emailLogs && (emailLogs as any[]).length > 0 ? (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <div className="grid grid-cols-5 gap-4 p-3 font-medium text-sm bg-muted/50">
                      <div>Status</div>
                      <div>Type</div>
                      <div>Email</div>
                      <div>Subject</div>
                      <div>Date</div>
                    </div>
                    {(emailLogs as any[]).slice(0, 20).map((log: any) => (
                      <div key={log.id} className="grid grid-cols-5 gap-4 p-3 border-t text-sm">
                        <div>{getStatusBadge(log.status)}</div>
                        <div>
                          <Badge variant="outline">{log.emailType}</Badge>
                        </div>
                        <div className="truncate">{log.email}</div>
                        <div className="truncate font-medium">{log.subject}</div>
                        <div className="text-muted-foreground">
                          {formatDate(log.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No email logs found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Email Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preview-firstName">First Name</Label>
                  <Input
                    id="preview-firstName"
                    value={previewData.firstName}
                    onChange={(e) => setPreviewData({...previewData, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preview-lastName">Last Name</Label>
                  <Input
                    id="preview-lastName"
                    value={previewData.lastName}
                    onChange={(e) => setPreviewData({...previewData, lastName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preview-email">Email</Label>
                  <Input
                    id="preview-email"
                    type="email"
                    value={previewData.email}
                    onChange={(e) => setPreviewData({...previewData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Trial Reminder</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Remind users about their expiring trial
                    </p>
                    <Button
                      onClick={() => openEmailPreview('trial_reminder')}
                      className="w-full"
                      size="sm"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Conversion Success</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Welcome new subscribers
                    </p>
                    <Button
                      onClick={() => openEmailPreview('conversion_success')}
                      className="w-full"
                      size="sm"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Cancellation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Confirm subscription cancellation
                    </p>
                    <Button
                      onClick={() => openEmailPreview('cancellation')}
                      className="w-full"
                      size="sm"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}