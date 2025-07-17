
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useApiKey } from '@/hooks/use-api-key';
import { ShieldCheck } from 'lucide-react';

export function WelcomeDialog() {
  const { termsAccepted, acceptTerms } = useApiKey();

  return (
    <Dialog open={!termsAccepted}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <DialogTitle>Welcome to PaperMiner</DialogTitle>
          </div>
          <DialogDescription>
            Before you start, please review these important points about your data privacy.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 text-sm">
            <ul className="space-y-3 list-disc pl-5 text-muted-foreground">
                <li>
                    <span className="font-semibold text-foreground">API Keys are Stored Locally:</span> Your Google AI Gemini API keys are saved exclusively in your browser's local storage. They are never sent to or stored on any server other than Google's own services when you make a request.
                </li>
                <li>
                    <span className="font-semibold text-foreground">All Data Stays on Your Machine:</span> Your analysis history, saved drafts, and any other application data are also stored only in your browser's local storage. Your work is private to you and this browser.
                </li>
                 <li>
                    <span className="font-semibold text-foreground">Clearing Your Browser Data:</span> Be aware that clearing your browser's cache or local storage for this site will permanently delete all your saved API keys and analysis history.
                </li>
            </ul>
        </div>
        <DialogFooter>
          <Button onClick={acceptTerms} className="w-full">Accept and Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
