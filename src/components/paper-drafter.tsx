
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApiKey } from '@/hooks/use-api-key';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { ArrowLeft, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { draftPaper, type DraftPaperOutput, type PaperSection } from '@/ai/flows/draft-paper-flow';
import { refineText } from '@/ai/flows/refine-text-flow';
import ReactMarkdown from 'react-markdown';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { SelectRefinePopover } from './select-refine-popover';

type SelectionState = {
  text: string;
  sectionIndex: number;
  startOffset: number;
  endOffset: number;
  range: Range | null;
} | null;

export function PaperDrafter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { getNextApiKey, isApiKeySet } = useApiKey();
  
  const title = searchParams.get('title') || 'Untitled Document';
  const paperContentRef = useRef<HTMLDivElement>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paper, setPaper] = useState<DraftPaperOutput | null>(null);
  const [isRefining, setIsRefining] = useState(false);

  const [selection, setSelection] = useState<SelectionState>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);


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

  const handleSelectionChange = () => {
    const currentSelection = window.getSelection();
    if (currentSelection && currentSelection.rangeCount > 0) {
      const range = currentSelection.getRangeAt(0);
      const selectedText = range.toString().trim();

      if (selectedText.length > 0 && paperContentRef.current?.contains(range.commonAncestorContainer)) {
        let sectionIndex = -1;
        let startOffset = -1;
        let endOffset = -1;
        
        let node: Node | null = range.startContainer;
        let sectionElement: HTMLElement | null = null;
        
        while(node) {
            if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).dataset.sectionIndex) {
                sectionElement = node as HTMLElement;
                break;
            }
            node = node.parentElement;
        }

        if (sectionElement && sectionElement.dataset.sectionIndex) {
            sectionIndex = parseInt(sectionElement.dataset.sectionIndex, 10);
            
            // This is a simplified offset calculation. A more robust solution might
            // need to traverse the DOM tree to get precise offsets within the raw markdown.
            // For now, we'll use string search which is good enough for most cases.
            const sectionContent = paper?.sections[sectionIndex].content || '';
            startOffset = sectionContent.indexOf(selectedText);
            endOffset = startOffset + selectedText.length;

            if (startOffset > -1) {
                setSelection({
                    text: selectedText,
                    sectionIndex,
                    startOffset,
                    endOffset,
                    range
                });
                setPopoverOpen(true);
                return;
            }
        }
      }
    }
    
    // If no valid selection, close the popover
    if(!isRefining) {
        setPopoverOpen(false);
        setSelection(null);
    }
  };

  const handleRefine = async (prompt: string) => {
    if (!selection || !isApiKeySet) return;

    setIsRefining(true);
    setPopoverOpen(false);
    
    try {
        const apiKey = getNextApiKey();
        if(!apiKey) throw new Error("No API Key available.");

        const result = await refineText({
            selectedText: selection.text,
            userPrompt: prompt,
            apiKey,
        });

        if (paper && paper.sections[selection.sectionIndex]) {
            const currentSection = paper.sections[selection.sectionIndex];
            const originalContent = currentSection.content;
            
            // Reconstruct the content with the refined text
            const newContent = originalContent.substring(0, selection.startOffset) + 
                               result.refinedText + 
                               originalContent.substring(selection.endOffset);

            const newSections = [...paper.sections];
            newSections[selection.sectionIndex] = { ...currentSection, content: newContent };
            setPaper({ sections: newSections });
        }
        
    } catch (e: any) {
        toast({
            variant: 'destructive',
            title: 'Refinement Failed',
            description: e.message || 'An error occurred during text refinement.'
        });
    } finally {
        setIsRefining(false);
        setSelection(null);
    }
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
        <div ref={paperContentRef} onMouseUp={handleSelectionChange} className="bg-background p-8 rounded-lg shadow-md">
             <SelectRefinePopover 
                range={selection?.range} 
                isOpen={popoverOpen} 
                onOpenChange={setPopoverOpen}
                onRefine={handleRefine}
                isRefining={isRefining}
              >
                {/* The child is a dummy element for positioning, the actual content is in the popover */}
                <span/>
              </SelectRefinePopover>
              {isRefining && <div className="fixed inset-0 bg-background/50 z-40 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>}

             {paper.sections.map((section, index) => (
                <div key={index} className="mb-8" data-section-index={index}>
                    <h2 className="text-2xl font-bold border-b pb-2 mb-4">{section.title}</h2>
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
          <div className="max-w-sm md:max-w-md lg:max-w-2xl">
            <h1 className="text-xl font-bold truncate">Paper Drafter</h1>
            <p className="text-sm text-muted-foreground truncate">
                {title}
            </p>
          </div>
        </div>
        <Button onClick={() => {}} disabled={isLoading || !!error}>
            <span>Save Draft</span>
        </Button>
      </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
            {renderContent()}
        </div>
      </main>
    </div>
  );
}
