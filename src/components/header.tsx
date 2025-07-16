import { BrainCircuit, KeyRound } from 'lucide-react';
import React from 'react';
import { Button } from './ui/button';
import { useApiKey } from '@/hooks/use-api-key';
import { SidebarTrigger } from './ui/sidebar';

export function AppHeader() {
  const { setApiKey } = useApiKey();

  return (
    <header className="px-4 lg:px-6 h-16 flex items-center justify-between border-b shrink-0">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden"/>
        <BrainCircuit className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">PaperMiner</h1>
      </div>
      <Button variant="outline" size="sm" onClick={() => setApiKey(null)}>
        <KeyRound className="mr-2 h-4 w-4" />
        Change API Key
      </Button>
    </header>
  );
}
