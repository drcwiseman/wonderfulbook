import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Button, 
  Badge, 
  SelectionDropdown, 
  createOptionsFromObject, 
  Input 
} from '@/components/shared';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Users, Eye, Ban, UserCheck, Search, Shield, User, Crown } from 'lucide-react';

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

export function UserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Users query
  const { data: usersData, isLoading: usersLoading } = useQuery<UsersResponse>({
    queryKey: ['/api/admin/users', userPage, userSearch, roleFilter],
  });

  // Update user status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      apiRequest('PATCH', `/api/admin/users/${userId}/status`, { isActive }),
    onSuccess: () => {
      toast({ title: 'Success', description: 'User status updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleStatusToggle = (user: User) => {
    updateStatusMutation.mutate({ userId: user.id, isActive: !user.isActive });
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
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5" />
        <h3 className="text-lg font-semibold">User Overview</h3>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="w-[180px]">
          <SelectionDropdown
            options={[
              { value: 'all', label: 'All Roles', icon: <Users className="h-4 w-4" /> },
              { value: 'user', label: 'Users', icon: <User className="h-4 w-4" /> },
              { value: 'admin', label: 'Admins', icon: <Shield className="h-4 w-4" /> },
              { value: 'super_admin', label: 'Super Admins', icon: <Crown className="h-4 w-4" /> }
            ]}
            value={roleFilter}
            onValueChange={setRoleFilter}
            placeholder="Filter by role"
            size="md"
          />
        </div>
      </div>

      {usersLoading ? (
        <div className="text-center py-8">Loading users...</div>
      ) : (
        <div className="border rounded-lg">
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
              {usersData?.users.slice(0, 5).map((user) => (
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
                    <Badge variant={user.isActive ? 'default' : 'destructive'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusToggle(user)}
                      disabled={updateStatusMutation.isPending}
                    >
                      {user.isActive ? (
                        <>
                          <Ban className="h-4 w-4 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {usersData && usersData.users.length > 5 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing 5 of {usersData.total} users. Visit Super Admin for full user management.
        </div>
      )}
    </div>
  );
}