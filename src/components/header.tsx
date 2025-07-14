import { BrainCircuit } from 'lucide-react';
import React from 'react';

export function AppHeader() {
  return (
    <header className="px-4 lg:px-6 h-16 flex items-center border-b shrink-0">
      <div className="flex items-center gap-2">
        <BrainCircuit className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">InsightMiner</h1>
      </div>
    </header>
  );
}
