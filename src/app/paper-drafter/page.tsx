import { PaperDrafter } from '@/components/paper-drafter';
import { Suspense } from 'react';

// Use Suspense to handle the case where search params are not immediately available
// or while the PaperDrafter component is loading.
export default function PaperDrafterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaperDrafter />
    </Suspense>
  );
}
