import { LRUCache } from 'lru-cache';

type RateLimitOptions = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

export function rateLimit(options?: RateLimitOptions) {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000,
  });

  return {
    check: (res: Response, limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage >= limit;
        
        // Add headers to response (Note: In Next.js App Router we often return new Responses, 
        // so this helper might need to return headers instead. 
        // For simplicity in this implementation, we throw if limited)
        
        if (isRateLimited) {
          reject(new Error('Rate limit exceeded'));
        } else {
          resolve();
        }
      }),
      
    // Simplified version for App Router to just return boolean
    isRateLimited: (token: string, limit: number): boolean => {
      const tokenCount = (tokenCache.get(token) as number) || 0;
      const currentUsage = tokenCount + 1;
      tokenCache.set(token, currentUsage);
      return currentUsage > limit;
    }
  };
}
