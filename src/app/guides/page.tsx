import { GuidesPage } from '@/components/guides-page';
import { Suspense } from 'react';

export default function Guides() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GuidesPage />
    </Suspense>
  );
}
