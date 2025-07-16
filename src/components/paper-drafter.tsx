'use client';

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function PaperDrafter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const title = searchParams.get('title') || 'Untitled Document';

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between p-4 border-b shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Paper Drafter</h1>
            <p className="text-sm text-muted-foreground truncate max-w-sm md:max-w-md">
                {title}
            </p>
          </div>
        </div>
        <Button>Save Draft</Button>
      </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
            <Textarea
                placeholder="Start writing your abstract, introduction, or any section of your paper here..."
                className="w-full h-[60vh] text-base"
            />
        </div>
      </main>
    </div>
  );
}
