import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, Users, BookOpen, TrendingUp, Settings, UserCog, 
  Ban, RotateCcw, Eye, AlertCircle, Bug, TestTube, Mail, 
  CreditCard, FileText, Star, BarChart3 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { BookManagementCard } from '@/components/admin/BookManagementCard';
import { AnalyticsOverview } from '@/components/admin/AnalyticsOverview';
import { UserActionsDialog } from '@/components/admin/UserActionsDialog';

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
  createdAt: string;
  lastLoginAt?: string;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

export default function UnifiedAdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userActionType, setUserActionType] = useState<'edit' | 'role' | 'password' | 'delete' | null>(null);
  
  // User management filters
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Check admin permissions
  const userTyped = user as any;
  const isAdmin = userTyped?.role === 'admin' || userTyped?.role === 'super_admin';
  const isSuperAdmin = userTyped?.role === 'super_admin';

  // System stats query
  const { data: stats, isLoading: statsLoading } = useQuery<SystemStats>({
    queryKey: ['/api/super-admin/stats'],
    enabled: isSuperAdmin,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Users query
  const { data: usersData, isLoading: usersLoading } = useQuery<UsersResponse>({
    queryKey: ['/api/super-admin/users', userPage, userSearch, roleFilter],
    enabled: isSuperAdmin,
  });

  const handleUserAction = (user: User, actionType: 'edit' | 'role' | 'password' | 'delete') => {
    setSelectedUser(user);
    setUserActionType(actionType);
  };

  const closeUserDialog = () => {
    setSelectedUser(null);
    setUserActionType(null);
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

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-muted-foreground mt-2">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        {isSuperAdmin ? (
          <Shield className="h-8 w-8 text-red-600" />
        ) : (
          <Settings className="h-8 w-8 text-orange-600" />
        )}
        <div>
          <h1 className="text-3xl font-bold">
            {isSuperAdmin ? 'Super Admin Dashboard' : 'Admin Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            {isSuperAdmin ? 'Complete system control and management' : 'Content and user management'}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full ${isSuperAdmin ? 'grid-cols-6' : 'grid-cols-4'}`}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="books">Books</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          {isSuperAdmin && (
            <>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="testing">Testing</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {isSuperAdmin && (
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
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
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
          )}

          <AnalyticsOverview isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="books" className="space-y-6">
          <BookManagementCard isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsOverview isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Feedback Management
              </CardTitle>
              <CardDescription>
                Review and respond to user feedback and bug reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Bug className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Feedback management interface will be implemented here</p>
                <p className="text-sm">Integration with existing feedback system in progress</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isSuperAdmin && (
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
                            <Badge variant={user.isActive ? 'default' : 'secondary'}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUserAction(user, 'edit')}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUserAction(user, 'role')}
                              >
                                Role
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUserAction(user, 'password')}
                              >
                                Password
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleUserAction(user, 'delete')}
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
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isSuperAdmin && (
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
                <div className="text-center py-8 text-muted-foreground">
                  <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Testing interface will be implemented here</p>
                  <p className="text-sm">Integration with existing testing system in progress</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* User Actions Dialog */}
      <UserActionsDialog
        user={selectedUser}
        actionType={userActionType}
        onClose={closeUserDialog}
      />
    </div>
  );
}