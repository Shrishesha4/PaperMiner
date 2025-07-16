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
import { KeyRound, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';

export function ApiKeyDialog() {
  const { apiKeys, setApiKeys, isApiKeySet } = useApiKey();
  const [localKeys, setLocalKeys] = useState<string[]>(apiKeys);
  const [newKey, setNewKey] = useState('');
  const { toast } = useToast();

  const handleAddKey = () => {
    const keyToAdd = newKey.trim();
    if (keyToAdd && !localKeys.includes(keyToAdd)) {
      setLocalKeys([...localKeys, keyToAdd]);
      setNewKey('');
    } else if (localKeys.includes(keyToAdd)) {
      toast({
        variant: 'destructive',
        title: 'Duplicate Key',
        description: 'This API key has already been added.',
      });
    }
  };
  
  const handleRemoveKey = (keyToRemove: string) => {
    setLocalKeys(localKeys.filter(k => k !== keyToRemove));
  };

  const handleSaveKeys = () => {
    if (localKeys.length > 0) {
      setApiKeys(localKeys);
      toast({
        title: 'API Keys Saved',
        description: 'Your Gemini API keys have been saved locally.',
      });
    } else {
        toast({
            variant: 'destructive',
            title: 'No Keys',
            description: 'Please add at least one API key.',
        });
    }
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return "••••••••";
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  }

  return (
    <Dialog open={!isApiKeySet}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <KeyRound className="w-6 h-6 text-primary"/>
            <DialogTitle>Provide Your Gemini API Keys</DialogTitle>
          </div>
          <DialogDescription>
            Add one or more Google AI Gemini API keys to avoid rate limits. Your keys will be rotated automatically and stored securely in your browser&apos;s local storage.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="api-key" className="text-right">
              New Key
            </Label>
            <div className="col-span-3 flex gap-2">
                <Input
                id="api-key"
                type="password"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="col-span-3"
                placeholder="Enter your API key"
                onKeyDown={(e) => e.key === 'Enter' && handleAddKey()}
                />
                <Button type="button" size="icon" onClick={handleAddKey}>
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
          </div>
          {localKeys.length > 0 && (
            <div className="col-span-4 space-y-2 rounded-md border p-2 bg-muted/50 max-h-48 overflow-y-auto">
                <p className="text-sm font-medium px-2">Added Keys ({localKeys.length})</p>
                {localKeys.map((key) => (
                    <div key={key} className="flex items-center justify-between p-2 rounded-md bg-background">
                        <span className="font-mono text-sm">{maskKey(key)}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveKey(key)}>
                            <Trash2 className="h-4 w-4 text-destructive"/>
                        </Button>
                    </div>
                ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <p className="text-xs text-muted-foreground mr-auto">
            Get keys from{' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">
              Google AI Studio
            </a>.
          </p>
          <Button onClick={handleSaveKeys}>Save Keys</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
