import { TitleStudio } from '@/components/title-studio';
import { ApiKeyProvider } from '@/hooks/use-api-key';
import { Suspense } from 'react';

// Use Suspense to handle the case where search params are not immediately available
// or while the TitleStudio component is loading data.
export default function TitleStudioPage() {
  return (
    <ApiKeyProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <TitleStudio />
      </Suspense>
    </ApiKeyProvider>
  );
}
