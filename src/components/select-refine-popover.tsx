
'use client';

import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Edit, Loader2 } from 'lucide-react';

interface SelectRefinePopoverProps {
  range: Range | null | undefined;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRefine: (prompt: string) => void;
  isRefining: boolean;
  children: React.ReactNode;
}

export function SelectRefinePopover({ range, isOpen, onOpenChange, onRefine, isRefining, children }: SelectRefinePopoverProps) {
  const [prompt, setPrompt] = useState('');

  const handleRefineClick = () => {
    if (prompt.trim()) {
      onRefine(prompt);
    }
  };
  
  // Clear prompt when popover closes
  useEffect(() => {
    if (!isOpen) {
      setPrompt('');
    }
  }, [isOpen]);

  const handleOpenChange = (open: boolean) => {
    // This allows clicking inside the popover without it closing
    if (open) {
      onOpenChange(true);
    } else {
      // Only close if not in the middle of refining
      if (!isRefining) {
        onOpenChange(false);
        window.getSelection()?.removeAllRanges();
      }
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {range ? (
          <span
            style={{
              position: 'absolute',
              left: `${range.getBoundingClientRect().left + window.scrollX}px`,
              top: `${range.getBoundingClientRect().top + window.scrollY - 4}px`, // position slightly above
              width: '1px',
              height: '1px',
            }}
            className="pointer-events-none"
          />
        ) : children}
      </PopoverTrigger>
      <PopoverContent 
        className="w-80" 
        align="start" 
        side="top"
        onInteractOutside={(e) => {
          // Prevent closing if we are in the middle of an operation
          if (isRefining) {
            e.preventDefault();
          }
        }}
      >
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Refine Selection</h4>
            <p className="text-sm text-muted-foreground">
              Tell the AI how to improve the selected text.
            </p>
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='e.g., "Make this more formal" or "Explain this in simpler terms"'
            disabled={isRefining}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleRefineClick();
              }
            }}
          />
          <Button onClick={handleRefineClick} disabled={!prompt.trim() || isRefining}>
            {isRefining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit className="mr-2 h-4 w-4" />}
            Refine
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
