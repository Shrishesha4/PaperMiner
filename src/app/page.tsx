import { InsightMinerApp } from '@/components/insight-miner-app';
import { ApiKeyProvider } from '@/hooks/use-api-key';

export default function Home() {
  return (
    <ApiKeyProvider>
        <InsightMinerApp />
    </ApiKeyProvider>
  );
}
