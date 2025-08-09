import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, Filter, Calendar, User, AlertTriangle, Info, AlertCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  resource: string | null;
  resourceId: string | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  severity: string;
  status: string;
  sessionId: string | null;
  createdAt: string;
  userEmail?: string | null;
  userFirstName?: string | null;
  userLastName?: string | null;
}

interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    action: '',
    severity: '',
    userId: '',
    startDate: '',
    endDate: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, refetch } = useQuery<AuditLogsResponse>({
    queryKey: ['/api/super-admin/audit-logs', page, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
        ...(filters.action && filters.action !== 'all' && { action: filters.action }),
        ...(filters.severity && filters.severity !== 'all' && { severity: filters.severity }),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });

      const response = await fetch(`/api/super-admin/audit-logs?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      return response.json();
    }
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: { [key: string]: any } = {
      critical: 'destructive',
      error: 'destructive',
      warning: 'outline',
      info: 'secondary'
    };
    
    return (
      <Badge variant={variants[severity] || 'secondary'} className="flex items-center gap-1">
        {getSeverityIcon(severity)}
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: any } = {
      success: 'default',
      failure: 'destructive',
      warning: 'outline'
    };
    
    return <Badge variant={variants[status] || 'secondary'}>{status.toUpperCase()}</Badge>;
  };

  const formatUserName = (log: AuditLog) => {
    if (log.userEmail) {
      const fullName = [log.userFirstName, log.userLastName].filter(Boolean).join(' ');
      return fullName ? `${fullName} (${log.userEmail})` : log.userEmail;
    }
    return log.userId ? `User ID: ${log.userId}` : 'System';
  };

  const formatDetails = (details: any) => {
    if (!details) return '';
    
    // Convert details object to readable string
    if (typeof details === 'object') {
      const keys = Object.keys(details);
      if (keys.length === 0) return '';
      
      return keys.map(key => {
        const value = details[key];
        if (typeof value === 'object') {
          return `${key}: ${JSON.stringify(value)}`;
        }
        return `${key}: ${value}`;
      }).join(', ');
    }
    
    return String(details);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      severity: '',
      userId: '',
      startDate: '',
      endDate: ''
    });
    setSearchTerm('');
    setPage(1);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Audit Logs
        </CardTitle>
        <CardDescription>
          System activity and security logs. Track user actions, system changes, and security events.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Action</label>
            <Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="login_attempt">Login Attempt</SelectItem>
                <SelectItem value="login_success">Login Success</SelectItem>
                <SelectItem value="login_failure">Login Failure</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="book_access">Book Access</SelectItem>
                <SelectItem value="subscription_change">Subscription Change</SelectItem>
                <SelectItem value="admin_action">Admin Action</SelectItem>
                <SelectItem value="security_event">Security Event</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Severity</label>
            <Select value={filters.severity} onValueChange={(value) => handleFilterChange('severity', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">User ID</label>
            <Input
              placeholder="Enter user ID"
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">End Date</label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>

          <div className="flex items-end space-x-2">
            <Button onClick={clearFilters} variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading audit logs...
                    </div>
                  </TableCell>
                </TableRow>
              ) : !data?.logs?.length ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                data.logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">
                      {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span className="text-xs">{formatUserName(log)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {log.action}
                      </code>
                    </TableCell>
                    <TableCell className="text-xs">
                      {log.resource && (
                        <div>
                          {log.resource}
                          {log.resourceId && (
                            <div className="text-muted-foreground font-mono">
                              {log.resourceId.substring(0, 8)}...
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {getSeverityBadge(log.severity)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(log.status)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.ipAddress || '-'}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="text-xs text-muted-foreground truncate" title={formatDetails(log.details)}>
                        {formatDetails(log.details) || '-'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {((page - 1) * 25) + 1} to {Math.min(page * 25, data.total)} of {data.total} logs
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <div className="flex items-center space-x-2">
                {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(prev => Math.min(prev + 1, data.totalPages))}
                disabled={page === data.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}