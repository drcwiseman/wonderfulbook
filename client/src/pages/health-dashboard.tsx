import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, Clock, Server, Database, Mail, CreditCard, Globe, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface HealthItem {
  name: string;
  status: 'OK' | 'WARN' | 'FAIL';
  duration: number;
  message: string;
  meta: any;
}

interface HealthData {
  status: string;
  timestamp: string;
  latest: {
    id: string;
    overallStatus: string;
    startedAt: string;
    finishedAt: string;
    summaryJson: any;
    items: HealthItem[];
  };
  stats: any;
  scheduler: any;
  recentHistory: any[];
  systemInfo: {
    nodeVersion: string;
    platform: string;
    uptime: number;
    memoryUsage: any;
    cpuUsage: any;
    environment: string;
    port: number;
  };
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'OK':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'WARN':
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    case 'FAIL':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Clock className="h-5 w-5 text-gray-500" />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === 'OK' ? 'default' : status === 'WARN' ? 'secondary' : 'destructive';
  return <Badge variant={variant}>{status}</Badge>;
}

function ServiceIcon({ name }: { name: string }) {
  switch (name.toLowerCase()) {
    case 'database':
      return <Database className="h-4 w-4" />;
    case 'server':
      return <Server className="h-4 w-4" />;
    case 'smtp':
      return <Mail className="h-4 w-4" />;
    case 'stripe':
      return <CreditCard className="h-4 w-4" />;
    case 'external_api':
      return <Globe className="h-4 w-4" />;
    case 'storage':
      return <Activity className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
}

export default function HealthDashboard() {
  const { data: healthData, isLoading, error, refetch } = useQuery<HealthData>({
    queryKey: ['/api/super-admin/health'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading health dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Health Dashboard Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">Failed to load health monitoring data.</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!healthData) return null;

  const { latest, systemInfo, scheduler } = healthData;
  const overallStatus = latest?.overallStatus || 'UNKNOWN';
  const items = latest?.items || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Health Dashboard</h1>
          <p className="text-muted-foreground">
            Super Admin monitoring console • Last updated: {
              latest ? formatDistanceToNow(new Date(latest.finishedAt), { addSuffix: true }) : 'Never'
            }
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <Activity className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon status={overallStatus} />
            Overall System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <StatusBadge status={overallStatus} />
            <span className="text-lg">
              {overallStatus === 'OK' ? 'All systems operational' : 
               overallStatus === 'WARN' ? 'Some services experiencing issues' : 
               'Critical issues detected'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Service Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Card key={item.name} className="border-l-4 border-l-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ServiceIcon name={item.name} />
                {item.name.charAt(0).toUpperCase() + item.name.slice(1).replace('_', ' ')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <StatusBadge status={item.status} />
                <span className="text-sm text-muted-foreground">{item.duration}ms</span>
              </div>
              <p className="text-sm">{item.message}</p>
              {item.meta && Object.keys(item.meta).length > 0 && (
                <div className="text-xs text-muted-foreground border-t pt-2">
                  {Object.entries(item.meta).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span>{key}:</span>
                      <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span>Node.js Version:</span>
              <span className="font-mono">{systemInfo.nodeVersion}</span>
              <span>Platform:</span>
              <span className="font-mono">{systemInfo.platform}</span>
              <span>Environment:</span>
              <span className="font-mono">{systemInfo.environment}</span>
              <span>Port:</span>
              <span className="font-mono">{systemInfo.port}</span>
              <span>Uptime:</span>
              <span className="font-mono">{Math.floor(systemInfo.uptime / 60)}m {Math.floor(systemInfo.uptime % 60)}s</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Memory & Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span>Memory Used:</span>
              <span className="font-mono">{Math.round(systemInfo.memoryUsage.used / 1024 / 1024)}MB</span>
              <span>Heap Used:</span>
              <span className="font-mono">{Math.round(systemInfo.memoryUsage.heapUsed / 1024 / 1024)}MB</span>
              <span>Heap Total:</span>
              <span className="font-mono">{Math.round(systemInfo.memoryUsage.heapTotal / 1024 / 1024)}MB</span>
              <span>External:</span>
              <span className="font-mono">{Math.round(systemInfo.memoryUsage.external / 1024 / 1024)}MB</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduler Status */}
      {scheduler && (
        <Card>
          <CardHeader>
            <CardTitle>Health Check Scheduler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Status:</span>
                <div className="font-medium">{scheduler.isRunning ? 'Running' : 'Stopped'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Pattern:</span>
                <div className="font-mono">{scheduler.pattern || '*/5 * * * *'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Last Run:</span>
                <div>{scheduler.lastRun ? formatDistanceToNow(new Date(scheduler.lastRun), { addSuffix: true }) : 'Never'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Next Run:</span>
                <div>{scheduler.nextRun ? formatDistanceToNow(new Date(scheduler.nextRun), { addSuffix: true }) : 'Unknown'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}