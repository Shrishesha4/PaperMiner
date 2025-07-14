'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApiKey } from '@/hooks/use-api-key';
import { KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ApiKeyDialog() {
  const { setApiKey, isApiKeySet } = useApiKey();
  const [localKey, setLocalKey] = useState('');
  const { toast } = useToast();

  const handleSaveKey = () => {
    if (localKey.trim()) {
      setApiKey(localKey.trim());
      toast({
        title: 'API Key Saved',
        description: 'Your Gemini API key has been saved locally.',
      });
    } else {
        toast({
            variant: 'destructive',
            title: 'Invalid Key',
            description: 'Please enter a valid API key.',
        });
    }
  };

  return (
    <Dialog open={!isApiKeySet}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <KeyRound className="w-6 h-6 text-primary"/>
            <DialogTitle>Provide Your Gemini API Key</DialogTitle>
          </div>
          <DialogDescription>
            To use PaperMiner, please provide your Google AI Gemini API key. Your key will be stored securely in your browser&apos;s local storage and will not be shared.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="api-key" className="text-right">
              API Key
            </Label>
            <Input
              id="api-key"
              type="password"
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              className="col-span-3"
              placeholder="Enter your API key"
            />
          </div>
        </div>
        <DialogFooter>
          <p className="text-xs text-muted-foreground mr-auto">
            Get your key from{' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">
              Google AI Studio
            </a>.
          </p>
          <Button onClick={handleSaveKey}>Save Key</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
