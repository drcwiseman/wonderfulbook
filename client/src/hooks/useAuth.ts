import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: (failureCount, error: any) => {
      // Don't retry on rate limit errors
      if (error?.message?.includes('429')) return false;
      if (error?.message?.includes('Rate limited')) return false;
      return failureCount < 1;
    },
    staleTime: 30 * 1000, // 30 seconds - faster auth updates
    gcTime: 5 * 60 * 1000, // 5 minutes cache time
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    // Use the last successful data even on error
    select: (data) => data,
    // Keep previous data on error to prevent flicker
    placeholderData: (previousData) => previousData,
  });

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user && !error,
    error,
  };
}
