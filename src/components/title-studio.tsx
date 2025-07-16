'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useHistory } from '@/hooks/use-history';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { TitleStudioBatch } from './title-studio-batch';
import { continueInChatGPT } from '@/lib/chatgpt';

type AnalysisData = {
  name: string;
  categories: string[];
  titles: string[];
};

export function TitleStudio() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { history, isLoading: isHistoryLoading, addAnalysis, updateAnalysis } = useHistory();
  const { toast } = useToast();
  
  const analysisId = searchParams.get('analysisId');
  
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isFromScratch = !analysisId;
  const scratchAnalysisId = useRef<string | null>(null);

  useEffect(() => {
    if (isHistoryLoading) return;

    if (analysisId) {
      const found = history.find((h) => h.id === analysisId);
      if (found) {
        const categories = Array.from(new Set(found.categorizedPapers.map((p) => p.category).filter(Boolean)));
        const titles = found.categorizedPapers.map((p) => p['Document Title']);
        setAnalysis({ name: found.name, categories, titles });
        if (found.generatedTitles) {
            setGeneratedTitles(found.generatedTitles);
        }
      } else {
        toast({ variant: 'destructive', title: 'Analysis not found' });
        router.push('/');
      }
    } else {
      // Handle the "from scratch" case
      setAnalysis({ name: 'From Scratch', categories: [], titles: [] });
    }
    setIsLoading(false);
  }, [analysisId, history, isHistoryLoading, router, toast]);

  const handleTitlesGenerated = useCallback((newTitles: string[]) => {
    setGeneratedTitles(newTitles);
    
    if (isFromScratch && newTitles.length > 0) {
      if (scratchAnalysisId.current) {
        // Update existing scratch analysis
        updateAnalysis(scratchAnalysisId.current, { generatedTitles: newTitles });
      } else {
        // Add new scratch analysis
        const newAnalysis = addAnalysis({
          name: "Scratchpad",
          categorizedPapers: [],
          failedPapers: [],
          generatedTitles: newTitles,
        });
        scratchAnalysisId.current = newAnalysis.id;
        // Update URL without reloading page, to persist this session
        router.replace(`/title-studio?analysisId=${newAnalysis.id}`, { scroll: false });
      }
    } else if (analysisId && newTitles.length > 0) {
        // This is an existing analysis based on a CSV
        updateAnalysis(analysisId, { generatedTitles: newTitles });
    }
  }, [isFromScratch, addAnalysis, updateAnalysis, analysisId, router]);
  
  const handleContinueInChatGPT = () => {
    if (generatedTitles.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Titles to Export',
        description: 'Please generate some titles before exporting to ChatGPT.',
      });
      return;
    }

    const textToCopy = `Here is a list of research paper titles I've generated. Please help me refine them:\n\n${generatedTitles.map(t => `- ${t}`).join('\n')}`;
    continueInChatGPT(textToCopy);
  };

  if (isLoading || !analysis) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Title Studio</h1>
            <p className="text-sm text-muted-foreground">
              {analysis.name === 'From Scratch' 
                ? 'Generating titles from scratch' 
                : <>Using dataset: <span className="font-semibold">{analysis.name}</span></>
              }
            </p>
          </div>
        </div>
        <Button onClick={handleContinueInChatGPT} variant="outline" disabled={generatedTitles.length === 0}>
            Continue in ChatGPT
        </Button>
      </div>
      <div className="flex-1">
        <TitleStudioBatch 
          analysis={analysis}
          generatedTitles={generatedTitles}
          onTitlesGenerated={handleTitlesGenerated}
        />
      </div>
    </div>
  );
}