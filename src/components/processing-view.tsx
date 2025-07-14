'use client';

import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Loader2 } from 'lucide-react';

interface ProcessingViewProps {
  progress: number;
  message: string;
}

export function ProcessingView({ progress, message }: ProcessingViewProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full space-y-4">
        <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
        <h2 className="text-2xl font-semibold tracking-tight">Analyzing Your Data...</h2>
        <Progress value={progress} className="w-full" />
        <p className="text-sm text-muted-foreground h-10">{message}</p>
      </div>
    </div>
  );
}
