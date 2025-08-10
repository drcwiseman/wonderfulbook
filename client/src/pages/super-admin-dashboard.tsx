import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Users, BookOpen, Trophy, Settings, UserCog, Shield, Ban, RotateCcw, Eye, AlertCircle, Bug, TestTube, CreditCard, Calendar, DollarSign } from 'lucide-react';
import AuditLogs from '@/components/AuditLogs';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  superAdminUsers: number;
  subscriptionBreakdown: { [key: string]: number };
  recentSignups: number;
  totalBooks: number;
  totalChallenges: number;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  subscriptionTier: string;
  subscriptionStatus: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  trialEndsAt?: string;
  subscriptionEndsAt?: string;
  nextBillingDate?: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

export default function SuperAdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [subscriptionForm, setSubscriptionForm] = useState({
    tier: '',
    status: '',
    stripeCustomerId: '',
    stripeSubscriptionId: '',
    trialEndsAt: '',
    subscriptionEndsAt: '',
    nextBillingDate: ''
  });
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  
  // User management filters
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // System stats query
  const { data: stats, isLoading: statsLoading } = useQuery<SystemStats>({
    queryKey: ['/api/super-admin/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Users query
  const { data: usersData, isLoading: usersLoading } = useQuery<UsersResponse>({
    queryKey: ['/api/super-admin/users', userPage, userSearch, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: userPage.toString(),
        search: userSearch,
        role: roleFilter,
        limit: '20'
      });
      const response = await fetch(`/api/super-admin/users?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    }
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      apiRequest('PATCH', `/api/super-admin/users/${userId}/role`, { role }),
    onSuccess: () => {
      toast({ title: 'Success', description: 'User role updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/stats'] });
      setShowRoleDialog(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        toast({ 
          title: 'Session Expired', 
          description: 'Your session has expired. Please refresh the page and try again.', 
          variant: 'destructive' 
        });
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    },
  });

  // Update user status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      apiRequest('PATCH', `/api/super-admin/users/${userId}/status`, { isActive }),
    onSuccess: () => {
      toast({ title: 'Success', description: 'User status updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/stats'] });
    },
    onError: (error: any) => {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        toast({ 
          title: 'Session Expired', 
          description: 'Your session has expired. Please refresh the page and try again.', 
          variant: 'destructive' 
        });
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, newPassword }: { userId: string; newPassword: string }) =>
      apiRequest('PATCH', `/api/super-admin/users/${userId}/password`, { newPassword }),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Password reset successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/users'] });
      setShowPasswordDialog(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        toast({ 
          title: 'Session Expired', 
          description: 'Your session has expired. Please refresh the page and try again.', 
          variant: 'destructive' 
        });
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => apiRequest('DELETE', `/api/super-admin/users/${userId}`),
    onSuccess: () => {
      toast({ title: 'Success', description: 'User deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/stats'] });
      setShowDeleteDialog(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        toast({ 
          title: 'Session Expired', 
          description: 'Your session has expired. Please refresh the page and try again.', 
          variant: 'destructive' 
        });
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    },
  });

  // Update user details mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, userData }: { userId: string; userData: { firstName: string; lastName: string; email: string } }) =>
      apiRequest('PATCH', `/api/super-admin/users/${userId}`, userData),
    onSuccess: () => {
      toast({ title: 'Success', description: 'User details updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/stats'] });
      setShowEditDialog(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        toast({ 
          title: 'Session Expired', 
          description: 'Your session has expired. Please refresh the page and try again.', 
          variant: 'destructive' 
        });
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    },
  });

  const handleRoleChange = () => {
    if (selectedUser && newRole) {
      updateRoleMutation.mutate({ userId: selectedUser.id, role: newRole });
    }
  };

  const handlePasswordReset = () => {
    if (selectedUser && newPassword) {
      resetPasswordMutation.mutate({ userId: selectedUser.id, newPassword });
    }
  };

  const handleUserEdit = () => {
    if (selectedUser && editForm.firstName && editForm.lastName && editForm.email) {
      updateUserMutation.mutate({ 
        userId: selectedUser.id, 
        userData: {
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          email: editForm.email
        }
      });
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    });
    setShowEditDialog(true);
  };

  const handleUserDelete = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };

  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ userId, subscriptionData }: { 
      userId: string; 
      subscriptionData: {
        tier: string;
        status: string;
        stripeCustomerId?: string;
        stripeSubscriptionId?: string;
        trialEndsAt?: string;
        subscriptionEndsAt?: string;
        nextBillingDate?: string;
      }
    }) => {
      const response = await apiRequest("PATCH", `/api/super-admin/users/${userId}/subscription`, subscriptionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/stats'] });
      setShowSubscriptionDialog(false);
      setSubscriptionForm({
        tier: '',
        status: '',
        stripeCustomerId: '',
        stripeSubscriptionId: '',
        trialEndsAt: '',
        subscriptionEndsAt: '',
        nextBillingDate: ''
      });
      toast({
        title: "Success",
        description: "User subscription updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user subscription",
        variant: "destructive",
      });
    }
  });

  const handleStatusToggle = (user: User) => {
    updateStatusMutation.mutate({ userId: user.id, isActive: !user.isActive });
  };

  const openSubscriptionDialog = (user: User) => {
    setSelectedUser(user);
    setSubscriptionForm({
      tier: user.subscriptionTier || '',
      status: user.subscriptionStatus || '',
      stripeCustomerId: '',
      stripeSubscriptionId: '',
      trialEndsAt: '',
      subscriptionEndsAt: '',
      nextBillingDate: ''
    });
    setShowSubscriptionDialog(true);
  };

  const handleSubscriptionUpdate = () => {
    if (selectedUser && subscriptionForm.tier && subscriptionForm.status) {
      updateSubscriptionMutation.mutate({ 
        userId: selectedUser.id, 
        subscriptionData: subscriptionForm
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'admin': return 'secondary';
      default: return 'outline';
    }
  };

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'premium': return 'default';
      case 'basic': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="h-8 w-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">Complete system control and management</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="testing">Testing & QA</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats?.recentSignups || 0} this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Books</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalBooks || 0}</div>
                <p className="text-xs text-muted-foreground">
                  In library
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.adminUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Admin + Super Admin
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Breakdown</CardTitle>
                <CardDescription>Current user subscription distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.subscriptionBreakdown && Object.entries(stats.subscriptionBreakdown).map(([tier, count]) => (
                    <div key={tier} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{tier}</span>
                      <Badge variant={getTierBadgeVariant(tier)}>{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Critical system metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database Status</span>
                    <Badge variant="default">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Health Dashboard</span>
                    <Button variant="outline" size="sm" onClick={() => window.open('/admin/health', '_blank')}>
                      View Dashboard
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Payment Processing</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email Service</span>
                    <Badge variant="default">Operational</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">PDF Streaming</span>
                    <Badge variant="default">Running</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  User Management
                </span>
                <Badge variant="destructive" className="text-xs">
                  Super Admin Only
                </Badge>
              </CardTitle>
              <CardDescription>
                Manage user accounts, roles, and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <Input
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="max-w-sm"
                />
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">Users</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                    <SelectItem value="super_admin">Super Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {usersLoading ? (
                <div className="text-center py-8">Loading users...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData?.users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.firstName} {user.lastName}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getTierBadgeVariant(user.subscriptionTier)}>
                            {user.subscriptionTier}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusToggle(user)}
                            className={user.isActive ? 'text-green-600' : 'text-red-600'}
                          >
                            {user.isActive ? <Eye className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Button>
                        </TableCell>
                        <TableCell>
                          {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(user)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setNewRole(user.role);
                                setShowRoleDialog(true);
                              }}
                            >
                              Role
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openSubscriptionDialog(user)}
                              className="text-orange-600 hover:text-orange-700"
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Subscription
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setNewPassword('');
                                setShowPasswordDialog(true);
                              }}
                            >
                              Password
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDeleteDialog(true);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {usersData && usersData.totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUserPage(Math.max(1, userPage - 1))}
                      disabled={userPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {userPage} of {usersData.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUserPage(Math.min(usersData.totalPages, userPage + 1))}
                      disabled={userPage === usersData.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Testing & Quality Assurance
              </CardTitle>
              <CardDescription>
                System testing and quality control tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Integration Tests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => window.open('/testing-qa', '_blank')}
                      className="w-full"
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Run Integration Tests
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Accessibility Tests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => window.open('/accessibility-test', '_blank')}
                      variant="outline"
                      className="w-full"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Test Accessibility
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <AuditLogs />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Settings
              </CardTitle>
              <CardDescription>
                Platform configuration and maintenance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">System Configuration</h3>
                <p className="text-muted-foreground mb-6">Configure platform settings, maintenance mode, and system parameters</p>
                <Button 
                  onClick={() => window.location.href = '/system-settings'}
                  className="w-full max-w-sm"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Open System Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Management Dialogs */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Details</DialogTitle>
            <DialogDescription>
              Update user information for {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
              <Input
                id="firstName"
                value={editForm.firstName}
                onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="lastName" className="text-sm font-medium">Last Name</label>
              <Input
                id="lastName"
                value={editForm.lastName}
                onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUserEdit}
              disabled={updateUserMutation.isPending || !editForm.firstName || !editForm.lastName || !editForm.email}
            >
              {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Select a new role for {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="role" className="text-sm font-medium">New Role</label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRoleChange}
              disabled={updateRoleMutation.isPending || !newRole || newRole === selectedUser?.role}
            >
              {updateRoleMutation.isPending ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="text-sm font-medium">New Password</label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
              />
              {newPassword.length > 0 && newPassword.length < 8 && (
                <p className="text-sm text-red-500">Password must be at least 8 characters</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handlePasswordReset}
              disabled={resetPasswordMutation.isPending || newPassword.length < 8}
            >
              {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the account for {selectedUser?.firstName} {selectedUser?.lastName}? 
              This action cannot be undone and will permanently remove all user data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUserDelete}
              disabled={deleteUserMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-orange-600" />
              Manage Subscription
            </DialogTitle>
            <DialogDescription>
              Update subscription details for {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="tier" className="text-sm font-medium block mb-1">Subscription Tier</label>
              <Select value={subscriptionForm.tier} onValueChange={(value) => 
                setSubscriptionForm(prev => ({ ...prev, tier: value }))
              }>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free Trial</SelectItem>
                  <SelectItem value="basic">Basic Plan</SelectItem>
                  <SelectItem value="premium">Premium Plan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="status" className="text-sm font-medium block mb-1">Subscription Status</label>
              <Select value={subscriptionForm.status} onValueChange={(value) => 
                setSubscriptionForm(prev => ({ ...prev, status: value }))
              }>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="stripeCustomerId" className="text-sm font-medium block mb-1">Stripe Customer ID (Optional)</label>
              <Input
                id="stripeCustomerId"
                value={subscriptionForm.stripeCustomerId}
                onChange={(e) => setSubscriptionForm(prev => ({ ...prev, stripeCustomerId: e.target.value }))}
                placeholder="cus_..."
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="stripeSubscriptionId" className="text-sm font-medium block mb-1">Stripe Subscription ID (Optional)</label>
              <Input
                id="stripeSubscriptionId"
                value={subscriptionForm.stripeSubscriptionId}
                onChange={(e) => setSubscriptionForm(prev => ({ ...prev, stripeSubscriptionId: e.target.value }))}
                placeholder="sub_..."
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="trialEndsAt" className="text-sm font-medium block mb-1">Trial End Date</label>
                <Input
                  id="trialEndsAt"
                  type="date"
                  value={subscriptionForm.trialEndsAt}
                  onChange={(e) => setSubscriptionForm(prev => ({ ...prev, trialEndsAt: e.target.value }))}
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="subscriptionEndsAt" className="text-sm font-medium block mb-1">Subscription End Date</label>
                <Input
                  id="subscriptionEndsAt"
                  type="date"
                  value={subscriptionForm.subscriptionEndsAt}
                  onChange={(e) => setSubscriptionForm(prev => ({ ...prev, subscriptionEndsAt: e.target.value }))}
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="nextBillingDate" className="text-sm font-medium block mb-1">Next Billing Date</label>
                <Input
                  id="nextBillingDate"
                  type="date"
                  value={subscriptionForm.nextBillingDate}
                  onChange={(e) => setSubscriptionForm(prev => ({ ...prev, nextBillingDate: e.target.value }))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-orange-800">Current Subscription</p>
                  <p className="text-orange-700">
                    Tier: <span className="font-medium">{selectedUser?.subscriptionTier || 'N/A'}</span> | 
                    Status: <span className="font-medium">{selectedUser?.subscriptionStatus || 'N/A'}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubscriptionDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubscriptionUpdate}
              disabled={updateSubscriptionMutation.isPending || !subscriptionForm.tier || !subscriptionForm.status}
              className="btn-orange-accessible"
            >
              {updateSubscriptionMutation.isPending ? 'Updating...' : 'Update Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}