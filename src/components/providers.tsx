
'use client';

import { ApiKeyProvider } from '@/hooks/use-api-key';
import { HistoryProvider } from '@/hooks/use-history';
import React from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ApiKeyProvider>
      <HistoryProvider>{children}</HistoryProvider>
    </ApiKeyProvider>
  );
}
