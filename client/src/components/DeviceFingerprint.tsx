import { useEffect, useState } from 'react';

interface DeviceFingerprint {
  userAgent: string;
  language: string;
  platform: string;
  screenResolution: string;
  timezone: string;
  cookiesEnabled: boolean;
}

interface DeviceFingerprintProps {
  onFingerprintGenerated: (fingerprint: string) => void;
}

export function DeviceFingerprint({ onFingerprintGenerated }: DeviceFingerprintProps) {
  const [fingerprint, setFingerprint] = useState<string>('');

  useEffect(() => {
    const generateFingerprint = () => {
      try {
        const data: DeviceFingerprint = {
          userAgent: navigator.userAgent || '',
          language: navigator.language || '',
          platform: navigator.platform || '',
          screenResolution: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
          cookiesEnabled: navigator.cookieEnabled || false,
        };

        // Create a simple hash from the fingerprint data
        const fingerprintString = `${data.userAgent}-${data.platform}-${data.screenResolution}-${data.timezone}`;
        
        // Simple hash function (not cryptographically secure, but sufficient for tracking)
        let hash = 0;
        for (let i = 0; i < fingerprintString.length; i++) {
          const char = fingerprintString.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32bit integer
        }
        
        const fingerprintHash = Math.abs(hash).toString(36);
        setFingerprint(fingerprintHash);
        onFingerprintGenerated(fingerprintHash);
      } catch (error) {
        console.warn('Device fingerprinting failed:', error);
        // Generate a fallback fingerprint
        const fallback = Math.random().toString(36).substring(2, 15);
        setFingerprint(fallback);
        onFingerprintGenerated(fallback);
      }
    };

    generateFingerprint();
  }, [onFingerprintGenerated]);

  // This component doesn't render anything visible
  return null;
}

// Hook for easier usage
export function useDeviceFingerprint() {
  const [fingerprint, setFingerprint] = useState<string>('');

  useEffect(() => {
    const generateFingerprint = () => {
      try {
        const data: DeviceFingerprint = {
          userAgent: navigator.userAgent || '',
          language: navigator.language || '',
          platform: navigator.platform || '',
          screenResolution: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
          cookiesEnabled: navigator.cookieEnabled || false,
        };

        const fingerprintString = `${data.userAgent}-${data.platform}-${data.screenResolution}-${data.timezone}`;
        
        let hash = 0;
        for (let i = 0; i < fingerprintString.length; i++) {
          const char = fingerprintString.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        
        const fingerprintHash = Math.abs(hash).toString(36);
        setFingerprint(fingerprintHash);
      } catch (error) {
        console.warn('Device fingerprinting failed:', error);
        setFingerprint(Math.random().toString(36).substring(2, 15));
      }
    };

    generateFingerprint();
  }, []);

  return fingerprint;
}