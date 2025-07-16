import { TitleStudio } from '@/components/title-studio';
import { Suspense } from 'react';

// Use Suspense to handle the case where search params are not immediately available
// or while the TitleStudio component is loading data.
export default function TitleStudioPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TitleStudio />
    </Suspense>
  );
}
