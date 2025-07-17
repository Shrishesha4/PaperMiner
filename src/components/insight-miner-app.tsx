
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { type ResearchPaper, type CategorizedPaper, FailedPaper, Analysis } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { categorizeResearchTitles } from '@/ai/flows/categorize-research-titles';
import { categorizeSingleTitle } from '@/ai/flows/categorize-single-title';
import { AppHeader } from './header';
import { UploaderView } from './uploader-view';
import { ProcessingView } from './processing-view';
import { DashboardView } from './dashboard-view';
import { useApiKey } from '@/hooks/use-api-key';
import { ApiKeyDialog } from './api-key-dialog';
import { useHistory } from '@/hooks/use-history';
import { SidebarProvider, SidebarInset } from './ui/sidebar';
import { HistorySidebar } from './history-sidebar';
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
  
  // Effect to sync URL search param with history selection
  useEffect(() => {
    if (!isHistoryLoading) {
        const analysisIdFromUrl = searchParams.get('analysisId');
        if (analysisIdFromUrl) {
            selectAnalysis(analysisIdFromUrl);
        } else {
            selectAnalysis(null);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isHistoryLoading]);

  useEffect(() => {
    if (!isHistoryLoading) {
        if (selectedAnalysis) {
            setCurrentStep('dashboard');
            // Ensure URL reflects the selected analysis
            if (searchParams.get('analysisId') !== selectedAnalysis.id) {
                router.replace(`/?analysisId=${selectedAnalysis.id}`, { scroll: false });
            }
        } else {
            setCurrentStep('upload');
            // Clear analysisId from URL if no analysis is selected
            if (searchParams.has('analysisId')) {
                 router.replace(`/`, { scroll: false });
            }
        }
    }
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
    if (retries.length > 0) {
        setProcessingMessage(`Retrying ${retries.length} failed papers individually...`);
        let retriedCount = 0;
        
        for (const paper of retries) {
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
    
    if (analysisIdToUpdate) {
        const existingAnalysis = history.find(h => h.id === analysisIdToUpdate);
        if (existingAnalysis) {
             updateAnalysis(analysisIdToUpdate, {
                categorizedPapers: [...existingAnalysis.categorizedPapers, ...results],
                failedPapers: finalFailed,
                categoryHierarchy: undefined, // Reset hierarchy to be regenerated
            });
        }
    } else {
        addAnalysis({
            name: fileName,
            categorizedPapers: results,
            failedPapers: finalFailed,
        });
    }

    setProcessingMessage('Analysis complete!');
    setProcessingProgress(100);
    setTimeout(() => setCurrentStep('dashboard'), 1000);
  }, [toast, isApiKeySet, addAnalysis, getNextApiKey, updateAnalysis, history]);

  const handleReset = (analysisId: string) => {
    selectAnalysis(null);
    setCurrentStep('upload');
  };

  const handleRecategorize = useCallback((analysis: Analysis) => {
    if (!analysis.failedPapers || analysis.failedPapers.length === 0) {
        toast({
            title: "No Papers to Re-categorize",
            description: "All papers have already been successfully categorized."
        });
        return;
    }
    const papersToProcess = analysis.failedPapers.map(({ failureReason, ...paper }) => paper);
    handleDataProcessing(papersToProcess, analysis.name, analysis.id);
  }, [handleDataProcessing, toast]);


  const renderContent = () => {
    if (isHistoryLoading) {
      return (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Loading analysis history...</p>
          </div>
      );
    }
    
    switch (currentStep) {
        case 'upload':
            return <UploaderView onProcess={(papers, name) => handleDataProcessing(papers, name)} />;
        case 'processing':
            return <ProcessingView progress={processingProgress} message={processingMessage} />;
        case 'dashboard':
            if (selectedAnalysis) {
                return (
                    <DashboardView
                        key={selectedAnalysis.id}
                        analysis={selectedAnalysis}
                        onReset={handleReset}
                        onRecategorize={handleRecategorize}
                    />
                );
            }
            // If no analysis is selected (e.g., history is cleared), go to uploader
            return <UploaderView onProcess={(papers, name) => handleDataProcessing(papers, name)} />;
        default:
            return <UploaderView onProcess={(papers, name) => handleDataProcessing(papers, name)} />;
    }
  }

  return (
    <SidebarProvider>
        <HistorySidebar />
        <SidebarInset className="flex flex-col">
            <AppHeader />
            <Dialog open={termsAccepted && !isApiKeySet}>
              <ApiKeyDialog />
            </Dialog>
            <WelcomeDialog />
            <div className="flex-1 flex flex-col">
              {renderContent()}
            </div>
        </SidebarInset>
    </SidebarProvider>
  );
}
