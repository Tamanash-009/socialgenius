export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

interface FetchOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  backoffMs?: number;
}

export async function fetchWithRetry(url: string, options: FetchOptions = {}): Promise<any> {
  const { timeoutMs = 8000, retries = 2, backoffMs = 1000, ...fetchOptions } = options;

  let lastError: Error | null = null;

  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: fetchOptions.signal || controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new ApiError(response.status, `HTTP Error ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      lastError = error;

      if (error.name === 'AbortError') {
        throw new Error('Request Timeout');
      }

      // Do not retry on 4xx errors
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        throw error;
      }

      if (i < retries) {
        await new Promise((resolve) => setTimeout(resolve, backoffMs * Math.pow(2, i))); // Exponential backoff
      }
    }
  }

  throw lastError;
}
