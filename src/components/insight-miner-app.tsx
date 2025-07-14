'use client';

import React, { useState, useCallback } from 'react';
import { type ResearchPaper, type CategorizedPaper, FailedPaper } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { categorizeResearchTitles } from '@/ai/flows/categorize-research-titles';
import { AppHeader } from './header';
import { UploaderView } from './uploader-view';
import { ProcessingView } from './processing-view';
import { DashboardView } from './dashboard-view';
import { useApiKey } from '@/hooks/use-api-key';
import { ApiKeyDialog } from './api-key-dialog';

type AppStep = 'upload' | 'processing' | 'dashboard';
const BATCH_SIZE = 10;

export function InsightMinerApp() {
  const { toast } = useToast();
  const { apiKey, isApiKeySet } = useApiKey();
  const [step, setStep] = useState<AppStep>('upload');
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [categorizedPapers, setCategorizedPapers] = useState<CategorizedPaper[]>([]);
  const [failedPapers, setFailedPapers] = useState<FailedPaper[]>([]);
  const [progress, setProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState('');

  const handleDataProcessing = useCallback(async (parsedPapers: ResearchPaper[]) => {
    if (!apiKey) {
        toast({
            variant: 'destructive',
            title: 'API Key Not Set',
            description: 'Please set your Gemini API key before processing.',
        });
        return;
    }
    
    setPapers(parsedPapers);
    setStep('processing');
    setProgress(0);
    setFailedPapers([]);
    setProcessingMessage('Starting categorization process...');

    const results: CategorizedPaper[] = [];
    const failed: FailedPaper[] = [];
    let processedCount = 0;

    // Filter out papers without titles first
    const papersToProcess = parsedPapers.filter(paper => {
      if (!paper['Document Title']) {
        failed.push({ ...paper, failureReason: 'Missing document title.' });
        return false;
      }
      return true;
    });

    const totalToProcess = papersToProcess.length;

    for (let i = 0; i < totalToProcess; i += BATCH_SIZE) {
      const batch = papersToProcess.slice(i, i + BATCH_SIZE);
      const titles = batch.map(p => p['Document Title']);
      
      setProcessingMessage(`Categorizing batch ${i / BATCH_SIZE + 1}...`);

      try {
        const batchResults = await categorizeResearchTitles({ titles, apiKey });

        batch.forEach(paper => {
          const result = batchResults.find(r => r.title === paper['Document Title']);
          if (result) {
            results.push({ ...paper, ...result });
          } else {
            failed.push({ ...paper, failureReason: 'AI model did not return a category for this title in the batch.' });
          }
        });

      } catch (error) {
        console.error('Error categorizing title batch:', error);
        let failureReason = 'An unknown error occurred during batch categorization.';
        if (error instanceof Error) {
            failureReason = error.message.includes('SAFETY') 
              ? 'Categorization failed due to safety settings.' 
              : error.message.includes('429') 
              ? 'API rate limit exceeded.'
              : error.message;
        }

        // Mark all papers in the failed batch
        batch.forEach(paper => {
            failed.push({ ...paper, failureReason });
        });

        toast({
          variant: 'destructive',
          title: 'Batch Categorization Error',
          description: `Failed to categorize a batch of titles. They will be shown in the "Failed" section.`,
        });
      } finally {
        processedCount += batch.length;
        setProgress((processedCount / parsedPapers.length) * 100);
      }
    }

    setCategorizedPapers(results);
    // Combine papers that failed before processing with papers that failed during processing
    setFailedPapers(prev => [...prev, ...failed]);
    setProcessingMessage('Analysis complete!');
    setTimeout(() => setStep('dashboard'), 1000);
  }, [toast, apiKey]);

  const handleReset = () => {
    setStep('upload');
    setPapers([]);
    setCategorizedPapers([]);
    setFailedPapers([]);
    setProgress(0);
    setProcessingMessage('');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1 flex flex-col">
        {!isApiKeySet && <ApiKeyDialog />}
        {step === 'upload' && <UploaderView onProcess={handleDataProcessing} />}
        {step === 'processing' && <ProcessingView progress={progress} message={processingMessage} />}
        {step === 'dashboard' && <DashboardView data={categorizedPapers} failedData={failedPapers} onReset={handleReset} />}
      </main>
    </div>
  );
}
