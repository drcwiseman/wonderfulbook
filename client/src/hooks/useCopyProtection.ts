import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CopyTracking {
  id: string;
  userId: string;
  bookId: string;
  totalCharactersCopied: number;
  totalBookCharacters: number;
  copyPercentage: string;
  maxCopyPercentage: string;
  lastCopyAt: string | null;
  isLimitReached: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CopyAttemptResult {
  success: boolean;
  tracking: CopyTracking;
  remainingPercentage: number;
  message: string;
}

export function useCopyProtection(bookId: string) {
  const { toast } = useToast();
  const [isBlocked, setIsBlocked] = useState(false);
  
  // Fetch copy tracking data
  const { data: tracking, refetch } = useQuery<CopyTracking>({
    queryKey: ['/api/copy-tracking', bookId],
    queryFn: async () => {
      const response = await fetch(`/api/copy-tracking/${bookId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch copy tracking');
      return response.json();
    },
    staleTime: 30000, // 30 seconds
  });

  // Record copy attempt mutation
  const recordCopyMutation = useMutation({
    mutationFn: async (charactersCopied: number) => {
      return await apiRequest('POST', '/api/copy-attempt', {
        bookId,
        charactersCopied
      });
    },
    onSuccess: (result: CopyAttemptResult) => {
      if (!result.success) {
        toast({
          title: "Copy Limit Reached",
          description: result.message,
          variant: "destructive",
        });
        setIsBlocked(true);
      } else {
        toast({
          title: "Copy Successful",
          description: `${result.remainingPercentage.toFixed(1)}% copy allowance remaining`,
          variant: result.tracking.isLimitReached ? "destructive" : "default",
        });
        if (result.tracking.isLimitReached) {
          setIsBlocked(true);
        }
      }
      refetch(); // Refresh tracking data
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process copy request",
        variant: "destructive",
      });
    }
  });

  // Check if copy is allowed before attempting
  const canCopy = useCallback((textLength: number = 0) => {
    if (!tracking) return true; // Allow if no tracking initialized yet
    if (isBlocked || tracking.isLimitReached) return false;
    
    const currentPercentage = parseFloat(tracking.copyPercentage || '0');
    const estimatedNewPercentage = ((tracking.totalCharactersCopied + textLength) / tracking.totalBookCharacters) * 100;
    
    return estimatedNewPercentage <= 40;
  }, [tracking, isBlocked]);

  // Record copy attempt
  const recordCopy = useCallback((text: string) => {
    if (!text || text.length === 0) return false;
    if (!canCopy(text.length)) {
      toast({
        title: "Copy Not Allowed",
        description: "You have reached the 40% copy limit for this book",
        variant: "destructive",
      });
      return false;
    }
    
    recordCopyMutation.mutate(text.length);
    return true;
  }, [canCopy, recordCopyMutation, toast]);

  // Get remaining copy percentage
  const getRemainingPercentage = useCallback(() => {
    if (!tracking) return 40;
    const currentPercentage = parseFloat(tracking.copyPercentage || '0');
    return Math.max(0, 40 - currentPercentage);
  }, [tracking]);

  // Check if limit is close (within 5%)
  const isCloseToLimit = useCallback(() => {
    const remaining = getRemainingPercentage();
    return remaining <= 5 && remaining > 0;
  }, [getRemainingPercentage]);

  // Update blocked state based on tracking
  useEffect(() => {
    if (tracking) {
      const currentPercentage = parseFloat(tracking.copyPercentage || '0');
      setIsBlocked(currentPercentage >= 40 || tracking.isLimitReached);
    } else {
      setIsBlocked(false);
    }
  }, [tracking]);

  return {
    tracking,
    isBlocked,
    canCopy,
    recordCopy,
    getRemainingPercentage,
    isCloseToLimit,
    isLoading: !tracking && !recordCopyMutation.isError,
  };
}