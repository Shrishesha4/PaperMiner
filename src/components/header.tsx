
'use client';
import { BrainCircuit, Settings } from 'lucide-react';
import React from 'react';
import { SidebarTrigger } from './ui/sidebar';
import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { SettingsDialogContent } from './settings-dialog';


export function AppHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 px-4 lg:px-6 h-16 flex items-center justify-between border-b shrink-0 bg-background/70 backdrop-blur-lg z-30">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
         <Link href="/" className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">PaperMiner</h1>
        </Link>
      </div>
       <div className="flex items-center gap-2">
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Settings />
                    <span className="sr-only">Settings</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Settings</DialogTitle>
                    <DialogDescription>
                        Manage your application settings, API keys, and data.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <SettingsDialogContent />
                </div>
            </DialogContent>
        </Dialog>
        <ThemeToggle />
      </div>
    </header>
  );
}
