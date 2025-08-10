import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    // Handle rate limiting gracefully - return cached data or null instead of throwing
    if (res.status === 429) {
      console.warn('Rate limited, returning null to prevent cascading requests');
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000, // 5 minutes - much more aggressive caching
      gcTime: 10 * 60 * 1000, // 10 minutes cache time
      retry: (failureCount, error: any) => {
        // Don't retry on rate limit errors to prevent cascade
        if (error?.message?.includes('429')) return false;
        if (error?.message?.includes('Rate limited')) return false;
        return failureCount < 1; // Only retry once for other errors
      },
      retryDelay: (attemptIndex) => Math.min(2000 * 2 ** attemptIndex, 10000), // Longer delays
    },
    mutations: {
      retry: false,
    },
  },
});
