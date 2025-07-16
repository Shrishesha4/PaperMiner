
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApiKey } from '@/hooks/use-api-key';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { ArrowLeft, Download, Edit, FileUp, Loader2, RefreshCw, Wand2 } from 'lucide-react';
import { draftPaper, type DraftPaperOutput } from '@/ai/flows/draft-paper-flow';
import { regenerateSection } from '@/ai/flows/regenerate-section-flow';
import { refineSection } from '@/ai/flows/refine-section-flow';
import ReactMarkdown from 'react-markdown';
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
import { Document, Packer as DocxPacker, Paragraph, HeadingLevel, TextRun } from 'docx';


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
  
  const title = searchParams.get('title') || 'Untitled Document';
  
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paper, setPaper] = useState<DraftPaperOutput | null>(null);
  const [refinementState, setRefinementState] = useState<RefinementState>({ isRefining: false, sectionIndex: null });
  const [regenerationState, setRegenerationState] = useState<RegenerationState>({ isRegenerating: false, sectionIndex: null });
  const [refinePrompt, setRefinePrompt] = useState('');


  const generateDraft = useCallback(async () => {
    if (!isApiKeySet) {
      toast({ variant: 'destructive', title: 'API Key Not Set' });
      setError('Please set your Gemini API key before drafting.');
      setIsLoading(false);
      return;
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
  }, [title, isApiKeySet, getNextApiKey, toast]);

  useEffect(() => {
    if (title !== 'Untitled Document') {
      generateDraft();
    } else {
      setIsLoading(false);
      setError("No title provided to draft a paper.");
    }
  }, [generateDraft, title]);

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


  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Generating initial paper draft...</p>
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
            <Alert className="max-w-md">
                <Wand2 className="h-4 w-4" />
                <AlertTitle>Ready to Draft</AlertTitle>
                <AlertDescription>A title is required to start drafting.</AlertDescription>
            </Alert>
        </div>
       )
    }

    return (
        <div className="bg-background p-8 rounded-lg shadow-md space-y-8">
             {paper.sections.map((section, index) => (
                <div key={index} className="mb-8" data-section-index={index}>
                    <div className="flex justify-between items-center border-b pb-2 mb-4">
                        <h2 className="text-2xl font-bold">{section.title}</h2>
                        <div className="flex gap-2">
                             <AlertDialog onOpenChange={() => setRefinePrompt('')}>
                                <AlertDialogTrigger asChild>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        disabled={regenerationState.isRegenerating || refinementState.isRefining}
                                    >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Refine
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Refine "{section.title}"</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Provide instructions for how the AI should rewrite this section.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="grid gap-2 py-4">
                                        <Label htmlFor="refine-prompt">Your instructions</Label>
                                        <Textarea 
                                            id="refine-prompt"
                                            placeholder="e.g., Make this more formal, or expand on the methodology."
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
                                        Submit
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRegenerateSection(index)}
                                disabled={regenerationState.isRegenerating || refinementState.isRefining}
                            >
                                {regenerationState.isRegenerating && regenerationState.sectionIndex === index ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                )}
                                Regenerate
                            </Button>
                        </div>
                    </div>
                    <article className="prose prose-lg dark:prose-invert max-w-none">
                        <ReactMarkdown>{section.content}</ReactMarkdown>
                    </article>
                </div>
            ))}
        </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-muted/20">
      <header className="flex items-center justify-between p-4 border-b shrink-0 bg-background z-10">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="max-w-xs sm:max-w-sm md:max-w-md lg:max-w-2xl">
            <h1 className="text-xl font-bold truncate">Paper Drafter</h1>
            <p className="text-sm text-muted-foreground truncate">
                {title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Button onClick={handleDownloadDocx} variant="outline" disabled={isLoading || !!error || isDownloading}>
                {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download .docx
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={isLoading || !!error} onClick={handleCopyToClipboard}>
                    <FileUp className="mr-2 h-4 w-4" />
                    Export to Google Docs
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
      </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
            {renderContent()}
        </div>
      </main>
    </div>
  );
}
