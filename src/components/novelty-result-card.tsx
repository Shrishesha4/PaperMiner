
'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { Lightbulb, MessageSquareQuote } from 'lucide-react';
import type { CheckTitleNoveltyOutput } from '@/types/schemas';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface NoveltyResultCardProps {
  result: CheckTitleNoveltyOutput;
}

const getNoveltyAlertVariant = (score: number) => {
    if (score < 0.5) return 'destructive';
    if (score < 0.8) return 'default';
    return 'default'; // A green/success variant could be added to themes
};

const getNoveltyAlertTitle = (score: number) => {
    if (score < 0.5) return 'Low Novelty';
    if (score < 0.8) return 'Moderate Novelty';
    return 'High Novelty';
}

function ImprovementSuggestions({ suggestions }: { suggestions: string[] }) {
    if (!suggestions || suggestions.length === 0) return null;

    return (
        <Card className="mt-4 bg-muted/50">
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    Suggestions for Improvement
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2 text-sm list-disc pl-5 text-muted-foreground">
                    {suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}

export function NoveltyResultCard({ result }: NoveltyResultCardProps) {
  return (
    <div className="space-y-4">
      <Alert variant={getNoveltyAlertVariant(result.noveltyScore)} className={`${result.noveltyScore >= 0.8 ? 'border-green-500/50 text-green-700 [&>svg]:text-green-700' : ''}`}>
        <AlertTitle className="flex items-center gap-2">
          {getNoveltyAlertTitle(result.noveltyScore)} (Score: {result.noveltyScore.toFixed(2)} / 1.0)
        </AlertTitle>
        <AlertDescription className="text-foreground">{result.overallReasoning}</AlertDescription>
      </Alert>
      
      <ImprovementSuggestions suggestions={result.suggestionsForImprovement ?? []} />

      {result.similarTitles.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium">Potentially Similar Titles Found:</h5>
            <div className="space-y-3">
              {result.similarTitles.map((item, index) => (
                <div key={index} className="text-sm p-3 border rounded-md bg-background/50 flex flex-col gap-2">
                  <div className="flex justify-between items-start gap-2">
                    <p className="flex-1 font-medium pr-2 break-words">{item.title}</p>
                    <Badge variant="secondary" className="shrink-0">{item.similarityScore.toFixed(2)}</Badge>
                  </div>
                   <div className="flex items-start gap-2 text-muted-foreground text-xs border-t pt-2 mt-1">
                      <MessageSquareQuote className="w-4 h-4 mt-0.5 shrink-0" />
                      <p className="flex-1">{item.reasoning}</p>
                  </div>
                </div>
              ))}
            </div>
        </div>
      )}
    </div>
  );
}
