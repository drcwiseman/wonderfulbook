import { useOfflineReading } from '@/hooks/useOfflineReading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Wifi, HardDrive, AlertCircle, CheckCircle } from 'lucide-react';

export function OfflineReadingStatus() {
  const { isOnline, cachedBooks } = useOfflineReading();
  
  const hasServiceWorker = 'serviceWorker' in navigator;
  const isSecureContext = window.isSecureContext;
  const isDevelopment = import.meta.env.DEV;

  return (
    <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
          Offline Reading Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
            <span className="font-medium">Connection</span>
            <Badge className={isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>

          {/* Downloaded Books */}
          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
            <span className="font-medium">Downloaded Books</span>
            <Badge className="bg-blue-100 text-blue-800">
              <HardDrive className="w-4 h-4 mr-1" />
              {cachedBooks.length}
            </Badge>
          </div>

          {/* Service Worker Support */}
          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
            <span className="font-medium">Service Worker</span>
            <Badge className={hasServiceWorker ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {hasServiceWorker ? (
                <><CheckCircle className="w-4 h-4 mr-1" />Supported</>
              ) : (
                <><AlertCircle className="w-4 h-4 mr-1" />Not Supported</>
              )}
            </Badge>
          </div>

          {/* Security Context */}
          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
            <span className="font-medium">HTTPS/Secure</span>
            <Badge className={isSecureContext ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
              {isSecureContext ? (
                <><CheckCircle className="w-4 h-4 mr-1" />Secure</>
              ) : (
                <><AlertCircle className="w-4 h-4 mr-1" />Development</>
              )}
            </Badge>
          </div>
        </div>

        {/* Development Notice */}
        {isDevelopment && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Development Mode</p>
                <p>PWA features work best in production builds. Service Worker registration may fail in development mode due to security restrictions.</p>
              </div>
            </div>
          </div>
        )}

        {/* Downloaded Books List */}
        {cachedBooks.length > 0 && (
          <div className="p-3 bg-white rounded-lg">
            <h4 className="font-medium mb-2">Available Offline:</h4>
            <div className="space-y-1">
              {cachedBooks.map((book) => (
                <div key={book.id} className="flex items-center gap-2 text-sm">
                  <HardDrive className="w-4 h-4 text-green-500" />
                  <span className="font-medium">{book.title}</span>
                  <span className="text-gray-500">by {book.author}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}