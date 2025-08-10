import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Smartphone, Laptop, Monitor, Trash2, Plus, Activity } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Device {
  id: string;
  name: string;
  deviceFingerprint: string;
  lastActiveAt: string;
  isActive: boolean;
  createdAt: string;
}

export default function DevicesPage() {
  const [deviceName, setDeviceName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Generate a simple RSA key pair for demo (in production, use Web Crypto API)
  const generateKeyPair = async () => {
    // Simple demo key generation - in production use proper Web Crypto API
    const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA${btoa(Math.random().toString())}
-----END PUBLIC KEY-----`;
    return { publicKey };
  };

  // Get user's devices
  const { data: devicesData, isLoading } = useQuery({
    queryKey: ['/api/devices/me'],
  });

  // Register device mutation
  const registerDeviceMutation = useMutation({
    mutationFn: async (data: { name: string; publicKey: string }) => {
      const response = await fetch('/api/devices/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to register device');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/devices/me'] });
      setDeviceName('');
      setIsRegistering(false);
      toast({
        title: 'Device registered successfully',
        description: 'Your device can now access offline content',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Registration failed',
        description: error.message || 'Failed to register device',
        variant: 'destructive',
      });
    },
  });

  // Deactivate device mutation
  const deactivateDeviceMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to deactivate device');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/devices/me'] });
      toast({
        title: 'Device deactivated',
        description: 'Device access has been revoked',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Deactivation failed',
        description: error.message || 'Failed to deactivate device',
        variant: 'destructive',
      });
    },
  });

  const handleRegisterDevice = async () => {
    if (!deviceName.trim()) {
      toast({
        title: 'Device name required',
        description: 'Please enter a name for this device',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { publicKey } = await generateKeyPair();
      registerDeviceMutation.mutate({
        name: deviceName.trim(),
        publicKey,
      });
    } catch (error) {
      toast({
        title: 'Key generation failed',
        description: 'Failed to generate device keys',
        variant: 'destructive',
      });
    }
  };

  const getDeviceIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('phone') || lowerName.includes('mobile')) {
      return <Smartphone className="h-5 w-5" />;
    }
    if (lowerName.includes('laptop') || lowerName.includes('macbook')) {
      return <Laptop className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const devices: Device[] = (devicesData as any)?.devices || [];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Device Management</h1>
          <p className="text-gray-600 mt-2">
            Manage devices for offline reading access. You can have up to 5 active devices.
          </p>
        </div>

        {/* Device Registration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Register New Device
            </CardTitle>
            <CardDescription>
              Register this device to enable offline reading access
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isRegistering ? (
              <Button 
                onClick={() => setIsRegistering(true)}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Register This Device
              </Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="deviceName">Device Name</Label>
                  <Input
                    id="deviceName"
                    placeholder="e.g., My iPhone, Work Laptop"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleRegisterDevice}
                    disabled={registerDeviceMutation.isPending}
                    className="flex-1 sm:flex-none"
                  >
                    {registerDeviceMutation.isPending ? 'Registering...' : 'Register Device'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsRegistering(false);
                      setDeviceName('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registered Devices */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Registered Devices ({devices.length}/5)</h2>
          
          {devices.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Monitor className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No devices registered yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  Register this device to start downloading books for offline reading
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {devices.map((device) => (
                <Card key={device.id} className={device.isActive ? '' : 'opacity-60'}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getDeviceIcon(device.name)}
                        <div>
                          <h3 className="font-medium">{device.name}</h3>
                          <p className="text-sm text-gray-600">
                            ID: {device.deviceFingerprint?.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={device.isActive ? 'default' : 'secondary'}>
                          {device.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {device.isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deactivateDeviceMutation.mutate(device.id)}
                            disabled={deactivateDeviceMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        Last active: {formatDate(device.lastActiveAt)}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      Registered: {formatDate(device.createdAt)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Information Card */}
        <Card className="bg-blue-50 dark:bg-blue-950">
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">About Device Registration</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Each device gets unique encryption keys for secure offline access</li>
              <li>• You can have up to 5 active devices at any time</li>
              <li>• Offline content expires after 30 days and needs renewal</li>
              <li>• Deactivating a device immediately revokes all its offline licenses</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}