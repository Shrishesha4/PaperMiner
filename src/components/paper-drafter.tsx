
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApiKey } from '@/hooks/use-api-key';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { ArrowLeft, Download, Edit, FileUp, Loader2, RefreshCw, Save } from 'lucide-react';
import { draftPaper } from '@/ai/flows/draft-paper-flow';
import type { DraftPaperOutput } from '@/types/schemas';
import { regenerateSection } from '@/ai/flows/regenerate-section-flow';
import { refineSection } from '@/ai/flows/refine-section-flow';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Packer } from 'docx';
import { saveAs } from 'file-saver';
import { Document, Packer as DocxPacker, Paragraph, HeadingLevel } from 'docx';
import { useHistory } from '@/hooks/use-history';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';


type RegenerationState = {
    isRegenerating: boolean;
    sectionIndex: number | null;
};

type RefinementState = {
    isRefining: boolean;
    sectionIndex: number | null;
}

export function PaperDrafter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { getNextApiKey, isApiKeySet } = useApiKey();
  const { history, updateAnalysis, isLoading: isHistoryLoading } = useHistory();
  
  const title = searchParams.get('title') || 'Untitled Document';
  const analysisId = searchParams.get('analysisId');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paper, setPaper] = useState<DraftPaperOutput | null>(null);
  const [refinementState, setRefinementState] = useState<RefinementState>({ isRefining: false, sectionIndex: null });
  const [regenerationState, setRegenerationState] = useState<RegenerationState>({ isRegenerating: false, sectionIndex: null });
  const [refinePrompt, setRefinePrompt] = useState('');


  const generateDraft = useCallback(async (isFullRegen = false) => {
    if (!isApiKeySet) {
      toast({ variant: 'destructive', title: 'API Key Not Set' });
      setError('Please set your Gemini API key before drafting.');
      setIsLoading(false);
      return;
    }

    if (!isFullRegen && analysisId) {
      const analysis = history.find(h => h.id === analysisId);
      if (analysis && analysis.draftedPaper) {
          setPaper(analysis.draftedPaper);
          setIsLoading(false);
          return;
      }
    }

    setIsLoading(true);
    setError(null);
    try {
      const apiKey = getNextApiKey();
      if (!apiKey) throw new Error("No API key available.");
      const result = await draftPaper({ title, apiKey });
      setPaper(result);
    } catch (e: any) {
      const errorMessage = e.message || 'An unknown error occurred.';
      toast({ variant: 'destructive', title: 'Drafting Failed', description: errorMessage });
      setError('Could not generate the paper draft. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [title, isApiKeySet, getNextApiKey, toast, history, analysisId]);

  useEffect(() => {
    if (isHistoryLoading) return;

    if (title === 'Untitled Document') {
        setIsLoading(false);
        setError("No title provided to draft a paper.");
        return;
    }
    
    generateDraft();
  }, [analysisId, generateDraft, title, isHistoryLoading, history]);


  const handleSaveDraft = async () => {
    if (!paper || !analysisId) return;
    setIsSaving(true);
    try {
      // Pass the current title along with the paper sections
      updateAnalysis(analysisId, { draftedPaper: { ...paper, title } });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save your draft.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefineSection = async (sectionIndex: number) => {
    if (!paper || !isApiKeySet || !refinePrompt) return;

    const sectionToRefine = paper.sections[sectionIndex];
    setRefinementState({ isRefining: true, sectionIndex });
    
    try {
        const apiKey = getNextApiKey();
        if(!apiKey) throw new Error("No API Key available.");

        const { refinedText } = await refineSection({
            sectionTitle: sectionToRefine.title,
            currentText: sectionToRefine.content,
            userPrompt: refinePrompt,
            apiKey,
        });

        const newSections = [...paper.sections];
        newSections[sectionIndex] = { ...sectionToRefine, content: refinedText };
        setPaper({ sections: newSections });
        setRefinePrompt(''); // Clear prompt on success
        
    } catch (e: any) {
        toast({
            variant: 'destructive',
            title: 'Refinement Failed',
            description: e.message || `Could not refine the ${sectionToRefine.title} section.`
        });
    } finally {
        setRefinementState({ isRefining: false, sectionIndex: null });
    }
  };

  const handleRegenerateSection = async (sectionIndex: number) => {
    if (!paper || !isApiKeySet) return;

    const sectionToRegen = paper.sections[sectionIndex];
    setRegenerationState({ isRegenerating: true, sectionIndex });

    try {
        const apiKey = getNextApiKey();
        if(!apiKey) throw new Error("No API key available.");

        const { newContent } = await regenerateSection({
            paperTitle: title,
            sectionTitle: sectionToRegen.title,
            apiKey,
        });

        const newSections = [...paper.sections];
        newSections[sectionIndex] = { ...sectionToRegen, content: newContent };
        setPaper({ sections: newSections });

    } catch (e: any) {
         toast({
            variant: 'destructive',
            title: 'Regeneration Failed',
            description: e.message || `Could not regenerate the ${sectionToRegen.title} section.`
        });
    } finally {
        setRegenerationState({ isRegenerating: false, sectionIndex: null });
    }
  };

  const handleDownloadDocx = async () => {
    if (!paper) return;

    setIsDownloading(true);
    try {
        const sections = paper.sections.flatMap(section => [
            new Paragraph({
                text: section.title,
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 240, after: 120 },
            }),
            ...section.content.split('\n').filter(p => p.trim() !== '').map(pText => new Paragraph({ text: pText }))
        ]);

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        text: title,
                        heading: HeadingLevel.TITLE,
                        alignment: 'center' as any,
                    }),
                    ...sections,
                ],
            }],
        });

        const blob = await DocxPacker.toBlob(doc);
        const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        saveAs(blob, `${safeTitle}.docx`);
    } catch (error) {
        console.error("Error generating .docx file:", error);
        toast({
            variant: "destructive",
            title: "Download Failed",
            description: "Could not generate the .docx file."
        });
    } finally {
        setIsDownloading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!paper) return;
    
    const plainText = [
        title,
        '\n\n',
        ...paper.sections.map(section => `${section.title}\n\n${section.content}\n\n`)
    ].join('');
    
    navigator.clipboard.writeText(plainText).then(() => {
        // Success handled by the dialog opening
    }, () => {
        toast({
            variant: "destructive",
            title: "Copy Failed",
            description: "Could not copy text to clipboard.",
        });
    });
  };

  const isAiWorking = refinementState.isRefining || regenerationState.isRegenerating || isLoading;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Generating initial draft...</p>
        </div>
      );
    }

    if (error) {
       return (
        <div className="flex items-center justify-center h-full">
            <Alert variant="destructive" className="max-w-md">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        </div>
       )
    }

    if (!paper) {
      return (
        <div className="flex items-center justify-center h-full">
             <Alert variant="destructive" className="max-w-md">
                <AlertTitle>No Paper Data</AlertTitle>
                <AlertDescription>Could not load or generate paper data.</AlertDescription>
            </Alert>
        </div>
       )
    }

    return (
        <div className="space-y-6">
             {paper.sections.map((section, index) => {
                const isSectionRefining = refinementState.isRefining && refinementState.sectionIndex === index;
                const isSectionRegenerating = regenerationState.isRegenerating && regenerationState.sectionIndex === index;
                const isSectionLoading = isSectionRefining || isSectionRegenerating;

                return (
                <Card key={index} data-section-index={index}>
                    <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-2 mb-4 gap-2">
                        <CardTitle className="text-2xl font-bold">{section.title}</CardTitle>
                        <div className="flex gap-2 shrink-0">
                             <AlertDialog onOpenChange={() => setRefinePrompt('')}>
                                <AlertDialogTrigger asChild>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        disabled={isAiWorking}
                                    >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Refine
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Refine "{section.title}"</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Provide specific instructions for how the AI should rewrite this section. Be descriptive for the best results.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="grid gap-2 py-4">
                                        <Label htmlFor="refine-prompt">Your instructions</Label>
                                        <Textarea 
                                            id="refine-prompt"
                                            placeholder="e.g., Make this more formal and academic, or expand on the proposed methodology..."
                                            value={refinePrompt}
                                            onChange={(e) => setRefinePrompt(e.target.value)}
                                        />
                                    </div>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={() => handleRefineSection(index)}
                                        disabled={!refinePrompt || refinementState.isRefining}
                                    >
                                       {refinementState.isRefining && refinementState.sectionIndex === index ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : null}
                                        Submit Refinement
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRegenerateSection(index)}
                                disabled={isAiWorking}
                            >
                                {regenerationState.isRegenerating && regenerationState.sectionIndex === index ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                )}
                                Regenerate
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        {isSectionLoading && (
                            <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg z-10">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}
                        <article className={`prose dark:prose-invert max-w-none transition-opacity ${isSectionLoading ? 'opacity-50' : 'opacity-100'}`}>
                           {section.content.split('\n').map((paragraph, pIndex) => (
                                <p key={pIndex}>{paragraph}</p>
                            ))}
                        </article>
                    </CardContent>
                </Card>
             )})}
        </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-muted/20">
      <div className="sticky top-0 z-20">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 border-b bg-background/80 p-4 backdrop-blur-lg sm:p-3">
          <div className="flex-grow overflow-hidden">
            <h1 className="truncate text-xl font-bold" title={title}>
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSaveDraft} variant="default" size="sm" disabled={isLoading || !!error || isSaving || isAiWorking}>
              {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
              <span className="ml-2 hidden sm:inline">Save Draft</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isLoading || !!error || isAiWorking}>
                  <RefreshCw />
                  <span className="ml-2 hidden sm:inline">Regen All</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will regenerate the entire paper, replacing all current content and edits. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => generateDraft(true)}>
                    Yes, Regenerate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={handleDownloadDocx} variant="outline" size="sm" disabled={isLoading || !!error || isDownloading || isAiWorking}>
              {isDownloading ? <Loader2 className="animate-spin" /> : <Download />}
              <span className="ml-2 hidden sm:inline">.docx</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isLoading || !!error || isAiWorking} onClick={handleCopyToClipboard}>
                  <FileUp />
                  <span className="ml-2 hidden sm:inline">G Docs</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Ready to Export</AlertDialogTitle>
                  <AlertDialogDescription>
                    The paper content has been copied to your clipboard. Click the button below to open a new Google Doc, where you can paste the content.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => window.open('https://docs.new', '_blank')}>
                    Open Google Docs
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
