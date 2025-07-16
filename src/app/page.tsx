import { InsightMinerApp } from '@/components/insight-miner-app';
import { ApiKeyProvider } from '@/hooks/use-api-key';
import { Suspense } from 'react';

export default function Home() {
  return (
    <ApiKeyProvider>
      <Suspense>
        <InsightMinerApp />
      </Suspense>
    </ApiKeyProvider>
  );
}
