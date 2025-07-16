import { InsightMinerApp } from '@/components/insight-miner-app';
import { Suspense } from 'react';

export default function Home() {
  return (
    <Suspense>
      <InsightMinerApp />
    </Suspense>
  );
}
