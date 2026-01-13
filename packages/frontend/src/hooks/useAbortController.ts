/**
 * useAbortController Hook
 * Provides AbortController for cancelling requests on component unmount
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { getSignal, abort } = useAbortController();
 *
 *   const fetchData = async () => {
 *     try {
 *       const response = await apiClient.get('/api/data', {
 *           signal: getSignal()
 *       });
 *       // Handle response
 *     } catch (error) {
 *       if (error.name === 'AbortError' || error.message === 'Request cancelled') {
 *         // Request was cancelled, ignore
 *         return;
 *       }
 *       // Handle other errors
 *     }
 *   };
 *
 *   useEffect(() => {
 *     fetchData();
 *     return () => abort();
 *   }, []);
 *
 *   return <div>...</div>;
 * }
 * ```
 */

import React, { useCallback, useRef, useEffect } from 'react';

export interface AbortControllerHookResult {
  /**
   * Get the AbortSignal for the current request
   * @returns AbortSignal to pass to API calls
   */
  getSignal: () => AbortSignal;

  /**
   * Manually abort the current request
   */
  abort: () => void;

  /**
   * Check if the request was aborted
   */
  isAborted: () => boolean;
}

export function useAbortController(): AbortControllerHookResult {
  const controllerRef = useRef<AbortController | null>(null);

  // Create or get the existing AbortController
  const getSignal = useCallback(() => {
    if (!controllerRef.current) {
      controllerRef.current = new AbortController();
    }
    return controllerRef.current.signal;
  }, []);

  // Abort the current request
  const abort = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);

  // Check if the request was aborted
  const isAborted = useCallback(() => {
    return controllerRef.current?.signal.aborted || false;
  }, []);

  return {
    getSignal,
    abort,
    isAborted,
  };
}

/**
 * useCancellableRequest Hook
 * Wraps an async function with automatic cancellation on unmount
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { execute, isLoading, error } = useCancellableRequest(
 *     async (signal) => {
 *       const response = await apiClient.get('/api/data', { signal });
 *       return response.data;
 *     }
 *   );
 *
 *   useEffect(() => {
 *     execute();
 *   }, []);
 *
 *   if (isLoading) return <Loading />;
 *   if (error) return <Error />;
 *   return <div>Data</div>;
 * }
 * ```
 */

export interface CancellableRequestState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  isAborted: boolean;
}

export function useCancellableRequest<T>(
  asyncFn: (signal: AbortSignal, ...args: any[]) => Promise<T>,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  } = {}
): CancellableRequestState<T> {
  const { getSignal, abort, isAborted } = useAbortController();
  const isLoadingRef = useRef(false);

  const [state, setState] = useState<{
    data: T | null;
    isLoading: boolean;
    error: Error | null;
  }>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      // Abort any ongoing request
      if (isLoadingRef.current) {
        abort();
      }

      setState({ data: null, isLoading: true, error: null });
      isLoadingRef.current = true;

      const signal = getSignal();

      try {
        const result = await asyncFn(signal, ...args);

        // Check if request was aborted during the async operation
        if (signal.aborted) {
          setState((prev) => ({ ...prev, isLoading: false }));
          return null;
        }

        setState({ data: result, isLoading: false, error: null });
        options.onSuccess?.(result);
        return result;
      } catch (error: any) {
        // Ignore aborted requests
        if (
          error.name === 'AbortError' ||
          error.message === 'Request cancelled' ||
          signal.aborted
        ) {
          setState({ data: null, isLoading: false, error: null });
          return null;
        }

        const errorObj = error instanceof Error ? error : new Error(String(error));
        setState({ data: null, isLoading: false, error: errorObj });
        options.onError?.(errorObj);
        return null;
      } finally {
        isLoadingRef.current = false;
      }
    },
    [asyncFn, getSignal, abort, options]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abort();
    };
  }, [abort]);

  return {
    execute,
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    isAborted: isAborted(),
  };
}

export default useAbortController;
