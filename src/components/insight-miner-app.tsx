
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { type ResearchPaper, type CategorizedPaper, FailedPaper, Analysis } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { categorizeResearchTitles } from '@/ai/flows/categorize-research-titles';
import { categorizeSingleTitle } from '@/ai/flows/categorize-single-title';
import { UploaderView } from './uploader-view';
import { ProcessingView } from './processing-view';
import { DashboardView } from './dashboard-view';
import { useApiKey } from '@/hooks/use-api-key';
import { ApiKeyDialog } from './api-key-dialog';
import { useHistory } from '@/hooks/use-history';
import { Loader2 } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Dialog } from './ui/dialog';
import { WelcomeDialog } from './welcome-dialog';

type AppStep = 'upload' | 'processing' | 'dashboard';
const BATCH_SIZE = 40;

export function InsightMinerApp() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isApiKeySet, getNextApiKey, termsAccepted } = useApiKey();
  const { selectedAnalysis, selectAnalysis, addAnalysis, updateAnalysis, isLoading: isHistoryLoading, history } = useHistory();

  const [currentStep, setCurrentStep] = useState<AppStep>('upload');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState('');
  
  const isCancelled = useRef(false);

  // Effect to sync URL search param with history selection
  useEffect(() => {
    if (isHistoryLoading) return;
    
    const analysisIdFromUrl = searchParams.get('analysisId');
    if (analysisIdFromUrl) {
        // Only select if it's different from the currently selected one
        if (selectedAnalysis?.id !== analysisIdFromUrl) {
            selectAnalysis(analysisIdFromUrl);
        }
    } else {
        // If there's no ID in the URL, clear the selection
        if (selectedAnalysis !== null) {
            selectAnalysis(null);
        }
    }
  // This effect should ONLY re-run when the URL's analysisId or history loading state changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isHistoryLoading]);
  
  // Effect to determine which main view to show (upload vs dashboard)
  useEffect(() => {
    if (isHistoryLoading) return;
  
    if (selectedAnalysis) {
      setCurrentStep('dashboard');
      // Update URL if it doesn't match the selected analysis
      const analysisIdFromUrl = searchParams.get('analysisId');
      if (analysisIdFromUrl !== selectedAnalysis.id) {
        router.replace(`/?analysisId=${selectedAnalysis.id}`, { scroll: false });
      }
    } else {
      setCurrentStep('upload');
      // If no analysis is selected, make sure URL is clean
      if (searchParams.has('analysisId')) {
        router.replace(`/`, { scroll: false });
      }
    }
  // This effect depends on the selected analysis and history loading state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAnalysis, isHistoryLoading]);


  const handleDataProcessing = useCallback(async (papersToProcess: ResearchPaper[], fileName: string, analysisIdToUpdate?: string) => {
    if (!isApiKeySet) {
        toast({
            variant: 'destructive',
            title: 'API Key Not Set',
            description: 'Please set your Gemini API key before processing.',
        });
        return;
    }
    
    isCancelled.current = false;
    setCurrentStep('processing');
    setProcessingProgress(0);
    setProcessingMessage('Starting categorization process...');

    const results: CategorizedPaper[] = [];
    const retries: ResearchPaper[] = [];
    const finalFailed: FailedPaper[] = [];
    let processedCount = 0;

    const totalToProcess = papersToProcess.length;
    const totalSteps = totalToProcess + (totalToProcess * 0.2); // Estimate retries as 20% of work

    // STAGE 1: Batch Processing
    for (let i = 0; i < totalToProcess; i += BATCH_SIZE) {
      if (isCancelled.current) break;
      const batch = papersToProcess.slice(i, i + BATCH_SIZE);
      const titles = batch.map(p => p['Document Title']);
      
      setProcessingMessage(`Categorizing batch ${Math.ceil((i + 1) / BATCH_SIZE)} of ${Math.ceil(totalToProcess / BATCH_SIZE)}...`);

      try {
        const apiKey = getNextApiKey();
        if (!apiKey) throw new Error("No API key available.");

        const batchResults = await categorizeResearchTitles({ titles, apiKey });
        const successfulCategorizations = new Map(batchResults.map(r => [r.title, r]));

        batch.forEach(paper => {
          const result = successfulCategorizations.get(paper['Document Title']);
          if (result && result.category) {
            results.push({ ...paper, category: result.category, confidence: result.confidence });
          } else {
            retries.push(paper);
          }
        });

      } catch (error) {
        console.error('Error categorizing title batch:', error);
        retries.push(...batch);
        toast({
          variant: 'destructive',
          title: 'Batch Categorization Issue',
          description: `A batch of titles failed. Attempting individual retries.`,
        });
      } finally {
        processedCount += batch.length;
        setProcessingProgress((processedCount / totalSteps) * 100); 
      }
    }
    
    // STAGE 2: Individual Retries for Failed Papers
    if (!isCancelled.current && retries.length > 0) {
        setProcessingMessage(`Retrying ${retries.length} failed papers individually...`);
        let retriedCount = 0;
        
        for (const paper of retries) {
            if (isCancelled.current) break;
            try {
                const apiKey = getNextApiKey();
                if (!apiKey) throw new Error("No API key available for retry.");

                const result = await categorizeSingleTitle({ title: paper['Document Title'], apiKey });
                
                if (result && result.category) {
                    results.push({ ...paper, category: result.category, confidence: result.confidence });
                } else {
                    finalFailed.push({ ...paper, failureReason: 'AI model did not return a category on retry.' });
                }
            } catch (error) {
                 finalFailed.push({ ...paper, failureReason: 'An API error occurred on retry.' });
            } finally {
                retriedCount++;
                setProcessingProgress(((processedCount + retriedCount) / totalSteps) * 100);
            }
        }
    }

    if (isCancelled.current) {
        toast({
            title: 'Analysis Cancelled',
            description: 'The categorization process was stopped.',
        });
        setCurrentStep('upload');
        return;
    }
    
    if (analysisIdToUpdate) {
        const existingAnalysis = history.find(h => h.id === analysisIdToUpdate);
        if (existingAnalysis) {
             updateAnalysis(analysisIdToUpdate, {
                categorizedPapers: [...existingAnalysis.categorizedPapers, ...results],
                failedPapers: finalFailed,
            });
        }
    } else {
        const newAnalysis = addAnalysis({
            name: fileName,
            categorizedPapers: results,
            failedPapers: finalFailed,
        });
         // The new analysis is automatically selected, so no need to call setCurrentStep here.
         // The useEffect for selectedAnalysis will handle it.
         router.push(`/?analysisId=${newAnalysis.id}`);
    }

    setProcessingMessage('Analysis complete!');
    setProcessingProgress(100);
    setTimeout(() => {
        // Let the useEffect handle the step change based on selection
    }, 1000);
  }, [toast, isApiKeySet, addAnalysis, getNextApiKey, updateAnalysis, history, router]);

  const handleCancel = () => {
    isCancelled.current = true;
  };

  const handleReset = (analysisId: string) => {
    selectAnalysis(null);
  };

  const renderContent = () => {
    if (isHistoryLoading) {
      return (
          <div className="flex flex-col items-center justify-center p-4 text-center h-full">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Loading analysis history...</p>
          </div>
      );
    }
    
    switch (currentStep) {
        case 'upload':
            return <div className="h-full"><UploaderView onProcess={(papers, name) => handleDataProcessing(papers, name)} /></div>;
        case 'processing':
            return <div className="h-full"><ProcessingView progress={processingProgress} message={processingMessage} onCancel={handleCancel} /></div>;
        case 'dashboard':
            if (selectedAnalysis) {
                return (
                    <DashboardView
                        key={selectedAnalysis.id}
                        analysis={selectedAnalysis}
                        onReset={handleReset}
                    />
                );
            }
            // Fallback to upload if dashboard is current step but no analysis is selected
            setCurrentStep('upload');
            return <div className="h-full"><UploaderView onProcess={(papers, name) => handleDataProcessing(papers, name)} /></div>;
        default:
            return <div className="h-full"><UploaderView onProcess={(papers, name) => handleDataProcessing(papers, name)} /></div>;
    }
  }

  return (
    <>
      <Dialog open={termsAccepted && !isApiKeySet}>
        <ApiKeyDialog />
      </Dialog>
      <WelcomeDialog />
      {renderContent()}
    </>
  );
}
