import { useState, useCallback } from 'react';
import { fetchWithRetry } from '../utils/apiClient';
import { useOnlineStatus } from './useOnlineStatus';

export function useApi<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isOnline = useOnlineStatus();

  const request = useCallback(async (url: string, options?: RequestInit) => {
    if (!isOnline) {
      throw new Error('Offline');
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetchWithRetry(url, options);
      setData(result);
      return result;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  return { data, loading, error, request };
}
