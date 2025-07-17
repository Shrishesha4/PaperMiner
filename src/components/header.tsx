
'use client';
import { BrainCircuit, Settings, ArrowLeft } from 'lucide-react';
import React from 'react';
import { useSidebar, SidebarTrigger } from './ui/sidebar';
import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AppHeader() {
  const { isMobile } = useSidebar();
  const pathname = usePathname();

  return (
    <header className="px-4 lg:px-6 h-16 flex items-center justify-between border-b shrink-0 bg-background/70 backdrop-blur-lg z-30">
      <div className="flex items-center gap-2">
        {isMobile && <SidebarTrigger />}
         <Link href="/" className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">PaperMiner</h1>
        </Link>
      </div>
       <div className="flex items-center gap-2">
         {pathname !== '/' && (
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to App
              </Link>
            </Button>
         )}
         {pathname !== '/settings' && (
            <Button asChild variant="ghost" size="icon">
                <Link href="/settings">
                    <Settings />
                    <span className="sr-only">Settings</span>
                </Link>
            </Button>
         )}
        <ThemeToggle />
      </div>
    </header>
  );
}
