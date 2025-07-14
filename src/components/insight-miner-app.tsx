'use client';

import React, { useState, useCallback } from 'react';
import { type ResearchPaper, type CategorizedPaper } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { categorizeResearchTitles } from '@/ai/flows/categorize-research-titles';
import { AppHeader } from './header';
import { UploaderView } from './uploader-view';
import { ProcessingView } from './processing-view';
import { DashboardView } from './dashboard-view';

type AppStep = 'upload' | 'processing' | 'dashboard';

export function InsightMinerApp() {
  const { toast } = useToast();
  const [step, setStep] = useState<AppStep>('upload');
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [categorizedPapers, setCategorizedPapers] = useState<CategorizedPaper[]>([]);
  const [progress, setProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState('');

  const handleDataProcessing = useCallback(async (parsedPapers: ResearchPaper[]) => {
    setPapers(parsedPapers);
    setStep('processing');
    setProgress(0);
    setProcessingMessage('Starting categorization process...');

    const results: CategorizedPaper[] = [];
    let processedCount = 0;

    for (const paper of parsedPapers) {
      try {
        const title = paper['Document Title'];
        if (!title) {
          processedCount++;
          continue;
        }

        setProcessingMessage(`Categorizing: "${title.substring(0, 40)}..."`);
        
        const result = await categorizeResearchTitles({ title });
        results.push({ ...paper, ...result });

      } catch (error) {
        console.error('Error categorizing title:', error);
        toast({
          variant: 'destructive',
          title: 'Processing Error',
          description: `Failed to categorize a title. Skipping.`,
        });
      } finally {
        processedCount++;
        setProgress((processedCount / parsedPapers.length) * 100);
      }
    }

    setCategorizedPapers(results);
    setProcessingMessage('Analysis complete!');
    setTimeout(() => setStep('dashboard'), 1000);
  }, [toast]);

  const handleReset = () => {
    setStep('upload');
    setPapers([]);
    setCategorizedPapers([]);
    setProgress(0);
    setProcessingMessage('');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1 flex flex-col">
        {step === 'upload' && <UploaderView onProcess={handleDataProcessing} />}
        {step === 'processing' && <ProcessingView progress={progress} message={processingMessage} />}
        {step === 'dashboard' && <DashboardView data={categorizedPapers} onReset={handleReset} />}
      </main>
    </div>
  );
}
