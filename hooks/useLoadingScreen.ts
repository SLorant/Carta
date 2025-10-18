import { useState, useCallback } from "react";

interface UseLoadingScreenOptions {
  defaultMessage?: string;
}

export function useLoadingScreen(options: UseLoadingScreenOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(
    options.defaultMessage || "Loading..."
  );

  const showLoading = useCallback((loadingMessage?: string) => {
    if (loadingMessage) {
      setMessage(loadingMessage);
    }
    setIsLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const withLoading = useCallback(
    async <T>(
      asyncFunction: () => Promise<T>,
      loadingMessage?: string
    ): Promise<T> => {
      showLoading(loadingMessage);
      try {
        const result = await asyncFunction();
        return result;
      } finally {
        hideLoading();
      }
    },
    [showLoading, hideLoading]
  );

  return {
    isLoading,
    message,
    showLoading,
    hideLoading,
    withLoading,
  };
}
