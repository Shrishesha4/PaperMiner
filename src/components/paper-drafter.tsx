'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApiKey } from '@/hooks/use-api-key';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { ArrowLeft, Edit, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { draftPaper, type DraftPaperOutput, type PaperSectionSchema } from '@/ai/flows/draft-paper-flow';
import { refineSection } from '@/ai/flows/refine-section-flow';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import ReactMarkdown from 'react-markdown';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

type PaperSection = z.infer<typeof PaperSectionSchema>;

export function PaperDrafter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { getNextApiKey, isApiKeySet } = useApiKey();
  
  const title = searchParams.get('title') || 'Untitled Document';
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paper, setPaper] = useState<DraftPaperOutput | null>(null);

  const [refinementStates, setRefinementStates] = useState<Record<number, { prompt: string; isLoading: boolean }>>({});

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
      // Initialize refinement states
      const initialStates = result.sections.reduce((acc, _, index) => {
        acc[index] = { prompt: '', isLoading: false };
        return acc;
      }, {} as Record<number, { prompt: string; isLoading: boolean }>);
      setRefinementStates(initialStates);
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
    const section = paper?.sections[sectionIndex];
    const refinement = refinementStates[sectionIndex];
    if (!section || !refinement.prompt || !isApiKeySet) return;
    
    setRefinementStates(prev => ({...prev, [sectionIndex]: {...prev[sectionIndex], isLoading: true}}));

    try {
        const apiKey = getNextApiKey();
        if (!apiKey) throw new Error("No API key available.");

        const result = await refineSection({
            sectionTitle: section.title,
            currentText: section.content,
            userPrompt: refinement.prompt,
            apiKey,
        });

        const newSections = [...(paper?.sections || [])];
        newSections[sectionIndex] = { ...section, content: result.refinedText };
        setPaper({ sections: newSections });
        setRefinementStates(prev => ({...prev, [sectionIndex]: {...prev[sectionIndex], prompt: '', isLoading: false}}));
    } catch (e: any) {
        toast({ variant: 'destructive', title: `Failed to refine ${section.title}`, description: e.message });
        setRefinementStates(prev => ({...prev, [sectionIndex]: {...prev[sectionIndex], isLoading: false}}));
    }
  };

  const handlePromptChange = (index: number, value: string) => {
    setRefinementStates(prev => ({ ...prev, [index]: { ...prev[index], prompt: value } }));
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
        <Accordion type="multiple" defaultValue={paper.sections.map(s => s.title)} className="w-full space-y-4">
            {paper.sections.map((section, index) => (
                <AccordionItem value={section.title} key={index} className="border rounded-lg bg-card">
                    <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline">
                       {section.title}
                    </AccordionTrigger>
                    <AccordionContent className="p-4 pt-0">
                        <article className="prose prose-sm dark:prose-invert max-w-none p-4 border rounded-md bg-background">
                           <ReactMarkdown>{section.content}</ReactMarkdown>
                        </article>
                        <Card className="mt-4 bg-muted/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                    Refine this section
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    placeholder={`e.g., "Make the introduction more engaging" or "Add more details about the methodology"`}
                                    value={refinementStates[index]?.prompt || ''}
                                    onChange={(e) => handlePromptChange(index, e.target.value)}
                                    disabled={refinementStates[index]?.isLoading}
                                />
                            </CardContent>
                            <CardFooter>
                                <Button
                                    onClick={() => handleRefineSection(index)}
                                    disabled={!refinementStates[index]?.prompt || refinementStates[index]?.isLoading}
                                    size="sm"
                                >
                                    {refinementStates[index]?.isLoading ? <Loader2 className="animate-spin" /> : <Edit />}
                                    <span className="ml-2">Refine</span>
                                </Button>
                            </CardFooter>
                        </Card>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-muted/20">
      <header className="flex items-center justify-between p-4 border-b shrink-0 bg-background">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="max-w-sm md:max-w-md lg:max-w-2xl">
            <h1 className="text-xl font-bold truncate">Paper Drafter</h1>
            <p className="text-sm text-muted-foreground truncate">
                {title}
            </p>
          </div>
        </div>
        <Button onClick={() => setIsSaving(true)} disabled={isSaving || isLoading || !!error}>
            {isSaving ? <Loader2 className="animate-spin"/> : null}
            <span className="ml-2">Save Draft</span>
        </Button>
      </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
            {renderContent()}
        </div>
      </main>
    </div>
  );
}
