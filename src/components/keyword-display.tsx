'use client';

import React, { useMemo } from 'react';
import type { CategorizedPaper } from '@/types';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

interface KeywordDisplayProps {
  data: CategorizedPaper[];
}

const MAX_KEYWORDS = 50;

export function KeywordDisplay({ data }: KeywordDisplayProps) {
  const topKeywords = useMemo(() => {
    const keywordCounts: { [key: string]: number } = {};
    data.forEach(paper => {
      // The 'Author Keywords' column is no longer guaranteed.
      // We will now only use 'IEEE Terms'
      const ieeeTerms = paper['IEEE Terms']?.split(';').map(k => k.trim()) || [];
      
      [...ieeeTerms].forEach(keyword => {
        if (keyword) {
          keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
        }
      });
    });

    return Object.entries(keywordCounts)
      .sort(([, countA], [, countB]) => countB - a)
      .slice(0, MAX_KEYWORDS);
  }, [data]);

  if(topKeywords.length === 0) {
    return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No keywords found.</p>
        </div>
    )
  }

  return (
    <ScrollArea className="h-96">
        <div className="flex flex-wrap gap-2">
            {topKeywords.map(([keyword, count]) => (
                <Badge key={keyword} variant="secondary" className="text-sm">
                    {keyword} <span className="ml-2 h-5 w-5 flex items-center justify-center rounded-full bg-primary/20 text-primary-foreground font-semibold text-xs">{count}</span>
                </Badge>
            ))}
        </div>
    </ScrollArea>
  );
}
