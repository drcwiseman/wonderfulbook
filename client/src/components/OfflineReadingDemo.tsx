import { useState } from 'react';
import { useOfflineReading } from '@/hooks/useOfflineReading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Download, HardDrive, BookOpen, CheckCircle } from 'lucide-react';

export function OfflineReadingDemo() {
  const { isOnline, cachedBooks, isBookCached, cacheBook } = useOfflineReading();
  const [demoStep, setDemoStep] = useState(1);

  const demoBook = {
    id: 'demo-book-1',
    title: 'The Power of Now',
    author: 'Eckhart Tolle',
    pdfUrl: '/demo-book.pdf'
  };

  const handleDemoDownload = async () => {
    setDemoStep(2);
    await cacheBook(demoBook.id, demoBook.pdfUrl, demoBook);
    setTimeout(() => setDemoStep(3), 2000);
  };

  const steps = [
    {
      title: "📱 Progressive Web App",
      description: "Wonderful Books works offline with PWA technology",
      icon: <BookOpen className="w-6 h-6" />
    },
    {
      title: "⬇️ Download Books", 
      description: "Download books when online for offline reading",
      icon: <Download className="w-6 h-6" />
    },
    {
      title: "🔒 Offline Access",
      description: "Read your downloaded books without internet",
      icon: <WifiOff className="w-6 h-6" />
    },
    {
      title: "💾 Smart Caching",
      description: "Books are cached securely on your device",
      icon: <HardDrive className="w-6 h-6" />
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <WifiOff className="w-6 h-6" />
            Offline Reading Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Features */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-800">Key Features:</h3>
              {steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <div className="text-orange-500">{step.icon}</div>
                  <div>
                    <h4 className="font-medium text-gray-800">{step.title}</h4>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Demo */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-800">Try It Out:</h3>
              
              <Card className="bg-white border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{demoBook.title}</h4>
                      <p className="text-sm text-gray-600">{demoBook.author}</p>
                    </div>
                    <Badge className={isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {isOnline ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                  
                  {demoStep === 1 && (
                    <Button 
                      onClick={handleDemoDownload}
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      disabled={!isOnline}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download for Offline Reading
                    </Button>
                  )}
                  
                  {demoStep === 2 && (
                    <div className="text-center py-4">
                      <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Downloading book...</p>
                    </div>
                  )}
                  
                  {demoStep === 3 && (
                    <div className="text-center py-4 text-green-600">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-medium">Book downloaded successfully!</p>
                      <p className="text-sm text-gray-600">Now available offline</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {cachedBooks.length > 0 && (
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Downloaded Books ({cachedBooks.length})</h4>
                    <div className="space-y-2">
                      {cachedBooks.map((book) => (
                        <div key={book.id} className="flex items-center gap-2 text-sm">
                          <HardDrive className="w-4 h-4 text-green-500" />
                          <span>{book.title}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}