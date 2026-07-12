"use client";

import { useEffect, useState } from "react";

type ApiQueryState<T> = {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
};

export function useApiQuery<T>(query: () => Promise<T>): ApiQueryState<T> {
  const [state, setState] = useState<ApiQueryState<T>>({
    data: null,
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    let cancelled = false;

    setState((current) => ({ ...current, error: null, isLoading: true }));

    void query()
      .then((data) => {
        if (!cancelled) setState({ data, error: null, isLoading: false });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          data: null,
          error: error instanceof Error ? error : new Error("Request failed."),
          isLoading: false,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  return state;
}
