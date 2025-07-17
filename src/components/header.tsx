
'use client';
import { BrainCircuit } from 'lucide-react';
import React from 'react';
import { useSidebar, SidebarTrigger } from './ui/sidebar';

export function AppHeader() {
  const { isMobile, open, state } = useSidebar();

  return (
    <header className="px-4 lg:px-6 h-16 flex items-center justify-between border-b shrink-0">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        {((isMobile && open) || !isMobile && state === 'expanded') && (
            <div className="flex items-center gap-2">
                <BrainCircuit className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold tracking-tight">PaperMiner</h1>
            </div>
        )}
      </div>
    </header>
  );
}
