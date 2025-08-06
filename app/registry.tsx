'use client';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { theme } from '@/lib/theme';
import { ReactNode, useState } from 'react';

interface RegistryProps {
  children: ReactNode;
}

function isErrorWithStatus(error: unknown): error is { status: number } {
  return error !== null &&
         typeof error === 'object' &&
         'status' in error &&
         typeof (error as { status: unknown }).status === 'number';
}

export function Registry({ children }: RegistryProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 10,
            gcTime: 1000 * 60 * 60,
            retry: (failureCount, error) => {
              if (isErrorWithStatus(error)) {
                const { status } = error;
                if (status >= 400 && status < 500) return false;
              }
              return failureCount < 3;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            networkMode: 'offlineFirst',
          },
          mutations: {
            retry: 1,
            networkMode: 'offlineFirst',
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </ThemeProvider>
    </QueryClientProvider>
  );
}