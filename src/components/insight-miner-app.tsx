
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { type ResearchPaper, type CategorizedPaper, FailedPaper, Analysis } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { categorizeResearchTitles } from '@/ai/flows/categorize-research-titles';
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
  const { selectedAnalysis, selectAnalysis, addAnalysis, removeAnalysis, isLoading: isHistoryLoading } = useHistory();

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


  const handleDataProcessing = useCallback(async (parsedPapers: ResearchPaper[], fileName: string) => {
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
    const failed: FailedPaper[] = [];
    let processedCount = 0;

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
      
      setProcessingMessage(`Categorizing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(totalToProcess / BATCH_SIZE)}...`);

      try {
        const apiKey = getNextApiKey();
        if (!apiKey) throw new Error("No API key available.");

        const batchResults = await categorizeResearchTitles({ titles, apiKey });

        batch.forEach(paper => {
          const result = batchResults.find(r => r.title === paper['Document Title']);
          if (result && result.category) {
            results.push({ ...paper, ...result });
          } else {
            failed.push({ ...paper, failureReason: 'AI model did not return a category for this title.' });
          }
        });

      } catch (error) {
        console.error('Error categorizing title batch:', error);
        let failureReason = 'An unknown error occurred during batch categorization.';
        if (error instanceof Error) {
            failureReason = error.message.includes('SAFETY') 
              ? 'Categorization failed due to safety settings.' 
              : error.message.includes('429') 
              ? 'API rate limit exceeded. Try adding more keys or waiting.'
              : error.message;
        }

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
        setProcessingProgress((processedCount / parsedPapers.length) * 100);
      }
    }

    const finalFailedPapers = [...failed];
    
    addAnalysis({
        name: fileName,
        categorizedPapers: results,
        failedPapers: finalFailedPapers,
    });

    setProcessingMessage('Analysis complete!');
    setTimeout(() => setCurrentStep('dashboard'), 1000);
  }, [toast, isApiKeySet, addAnalysis, getNextApiKey]);

  const handleReset = (analysisId: string) => {
    selectAnalysis(null);
    setCurrentStep('upload');
  };


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
            return <UploaderView onProcess={handleDataProcessing} />;
        case 'processing':
            return <ProcessingView progress={processingProgress} message={processingMessage} />;
        case 'dashboard':
            if (selectedAnalysis) {
                return (
                    <DashboardView
                        key={selectedAnalysis.id}
                        analysisId={selectedAnalysis.id}
                        analysisName={selectedAnalysis.name}
                        data={selectedAnalysis.categorizedPapers}
                        failedData={selectedAnalysis.failedPapers}
                        onReset={handleReset}
                    />
                );
            }
            // If no analysis is selected (e.g., history is cleared), go to uploader
            return <UploaderView onProcess={handleDataProcessing} />;
        default:
            return <UploaderView onProcess={handleDataProcessing} />;
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
