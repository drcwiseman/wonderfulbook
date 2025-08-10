import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TestPDFReaderProps {
  bookId: string;
}

export function TestPDFReader({ bookId }: TestPDFReaderProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const getPdfToken = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiRequest('POST', `/api/pdf-token/${bookId}`);
        const { token } = await response.json();
        
        const pdfStreamUrl = `/api/stream-token/${token}/${bookId}`;
        console.log('Test PDF URL:', pdfStreamUrl);
        setPdfUrl(pdfStreamUrl);
        
        // Test if the PDF actually loads by fetching it
        const testResponse = await fetch(pdfStreamUrl);
        if (testResponse.ok) {
          console.log('✅ PDF URL is accessible');
          const contentType = testResponse.headers.get('content-type');
          console.log('Content-Type:', contentType);
          
          if (contentType?.includes('application/pdf')) {
            toast({
              title: "PDF Test Success",
              description: "PDF URL is working correctly",
            });
          } else {
            setError(`Invalid content type: ${contentType}`);
          }
        } else {
          setError(`HTTP ${testResponse.status}: ${testResponse.statusText}`);
        }
        
      } catch (error: any) {
        console.error('PDF test error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    getPdfToken();
  }, [bookId, toast]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
        <p>Testing PDF URL...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        <h3>PDF Test Failed</h3>
        <p>{error}</p>
        {pdfUrl && <p className="text-xs mt-2">URL: {pdfUrl}</p>}
      </div>
    );
  }

  return (
    <div className="p-8">
      <h3 className="text-lg font-semibold mb-4">PDF Test Results</h3>
      <div className="bg-green-50 p-4 rounded">
        <p className="text-green-700">✅ PDF URL is working!</p>
        <p className="text-sm mt-2">URL: {pdfUrl}</p>
        <div className="mt-4">
          <a 
            href={pdfUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Open PDF in New Tab
          </a>
        </div>
      </div>
    </div>
  );
}