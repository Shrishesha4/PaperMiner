'use client';
import { BrainCircuit, KeyRound } from 'lucide-react';
import React from 'react';
import { Button } from './ui/button';
import { useApiKey } from '@/hooks/use-api-key';
import { SidebarTrigger } from './ui/sidebar';
import { useSidebar } from './ui/sidebar';
import { ApiKeyDialog } from './api-key-dialog';
import { Dialog, DialogTrigger } from './ui/dialog';

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
      <Dialog>
        <DialogTrigger asChild>
            <Button variant="outline" size="sm">
                <KeyRound className="mr-2 h-4 w-4" />
                Manage API Keys
            </Button>
        </DialogTrigger>
        <ApiKeyDialog />
      </Dialog>
    </header>
  );
}
