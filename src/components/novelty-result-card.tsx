'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { Info, Sparkles } from 'lucide-react';
import type { CheckTitleNoveltyOutput } from '@/types/schemas';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface NoveltyResultCardProps {
  result: CheckTitleNoveltyOutput;
}

const getNoveltyAlertVariant = (score: number) => {
    if (score < 0.5) return 'destructive';
    if (score < 0.8) return 'default';
    return 'default';
};

export function NoveltyResultCard({ result }: NoveltyResultCardProps) {
  return (
    <div className="space-y-4">
      <Alert variant={getNoveltyAlertVariant(result.noveltyScore)}>
        <AlertTitle className="flex items-center gap-2">
          Novelty Score: {result.noveltyScore.toFixed(2)} / 1.0
        </AlertTitle>
        <AlertDescription>{result.overallReasoning}</AlertDescription>
      </Alert>

      {result.similarTitles.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium">Potentially Similar Titles Found:</h5>
          <TooltipProvider>
            <ul className="space-y-2">
              {result.similarTitles.map((item, index) => (
                <li key={index} className="text-sm text-muted-foreground p-2 border rounded-md bg-background/50">
                  <div className="flex justify-between items-start gap-2">
                    <p className="flex-1 pr-2 break-words">{item.title}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{item.similarityScore.toFixed(2)}</Badge>
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger>
                          <Info className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>{item.reasoning}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
