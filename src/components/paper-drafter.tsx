
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApiKey } from '@/hooks/use-api-key';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { ArrowLeft, Download, Edit, FileUp, Loader2, RefreshCw, Save, Check, FileText, Columns, PenTool } from 'lucide-react';
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
import { Switch } from './ui/switch';
import { Packer } from 'docx';
import { saveAs } from 'file-saver';
import { Document, Packer as DocxPacker, Paragraph, HeadingLevel, TextRun, AlignmentType, SymbolRun } from 'docx';
import { useHistory } from '@/hooks/use-history';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import MarkdownEditor from './markdown-editor';


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
  const { history, addAnalysis, updateAnalysis, isLoading: isHistoryLoading } = useHistory();
  
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
  const [isExistingDraft, setIsExistingDraft] = useState(false);
  const [sourceAnalysisName, setSourceAnalysisName] = useState('Scratch');
  
  // New States for View Modes
  const [isIEEEFormat, setIsIEEEFormat] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const draftGenerated = useRef(false);


  const generateDraft = useCallback(async (isFullRegen = false) => {
    if (!isApiKeySet) {
      toast({ variant: 'destructive', title: 'API Key Not Set' });
      setError('Please set your Gemini API key before drafting.');
      setIsLoading(false);
      return;
    }

    let currentContextData: string | undefined;

    // Check if we should load an existing draft
    if (analysisId) {
      const analysis = history.find(h => h.id === analysisId);
      if (analysis) {
        currentContextData = analysis.contextData;

        if (!isFullRegen) {
            const isAlreadyDraft = analysis.name.startsWith('Draft: ');
            setIsExistingDraft(isAlreadyDraft);
            setSourceAnalysisName(analysis.name.replace(/^Draft: /, ''));

            // Only load a saved draft if its title matches the current one
            if (analysis.draftedPaper && analysis.draftedPaper.title === title) {
                setPaper(analysis.draftedPaper);
                setIsLoading(false);
                return;
            }
        }
      }
    }

    setIsLoading(true);
    setError(null);
    try {
      const apiKey = getNextApiKey();
      if (!apiKey) throw new Error("No API key available.");
      // Pass contextData if available
      const result = await draftPaper({ title, contextData: currentContextData, apiKey });
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
    if (isHistoryLoading || draftGenerated.current) return;

    if (title === 'Untitled Document') {
        setIsLoading(false);
        setError("No title provided to draft a paper.");
        return;
    }
    
    generateDraft();
    draftGenerated.current = true;
  }, [analysisId, generateDraft, title, isHistoryLoading]);


  const handleSaveOrUpdateDraft = async () => {
    if (!paper || !title) return;
    setIsSaving(true);
    
    try {
        if (isExistingDraft && analysisId) {
            // This is an update to an existing draft.
            updateAnalysis(analysisId, { draftedPaper: { ...paper, title } });
        } else {
            // This is a new draft being saved for the first time.
            const newDraftAnalysis = addAnalysis({
                name: `Draft: ${sourceAnalysisName}`,
                draftedPaper: { ...paper, title },
                categorizedPapers: [],
                failedPapers: [],
                generatedTitles: [],
                // Preserve context data if it was passed
                contextData: history.find(h => h.id === analysisId)?.contextData
            });
            // Redirect to the new draft's URL to enable updating later
            router.replace(`/paper-drafter?title=${encodeURIComponent(title)}&analysisId=${newDraftAnalysis.id}`);
            setIsExistingDraft(true); // It's now an existing draft
        }
        toast({ title: "Draft Saved", description: "Your paper draft has been saved successfully." });
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
  
  const handleContentChange = (index: number, newContent: string) => {
      if (!paper) return;
      const newSections = [...paper.sections];
      newSections[index] = { ...newSections[index], content: newContent };
      setPaper({ sections: newSections });
  };

  const createDocxParagraphs = (content: string) => {
    const paragraphs: Paragraph[] = [];
    const lines = content.split('\n');

    const parseLine = (text: string) => {
        const children = [];
        const parts = text.split(/(\*\*.*?\*\*)/g);
        for (const part of parts) {
            if (part.startsWith('**') && part.endsWith('**')) {
                children.push(new TextRun({ text: part.slice(2, -2), bold: true }));
            } else {
                children.push(new TextRun(part));
            }
        }
        return children;
    };

    lines.forEach(line => {
        const trimmedLine = line.trim();
        const indentation = line.length - line.trimStart().length;

        if (trimmedLine.startsWith('### ')) {
            paragraphs.push(new Paragraph({ children: parseLine(trimmedLine.substring(4)), heading: HeadingLevel.HEADING_3 }));
        } else if (trimmedLine.startsWith('## ')) {
            paragraphs.push(new Paragraph({ children: parseLine(trimmedLine.substring(3)), heading: HeadingLevel.HEADING_2 }));
        } else if (/^\d+\.\s/.test(trimmedLine)) {
             paragraphs.push(new Paragraph({
                children: parseLine(trimmedLine.replace(/^\d+\.\s/, '')),
                numbering: {
                    reference: "numbered-list",
                    level: 0,
                },
            }));
        } else if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
            let level = 0;
            if (indentation >= 4) {
                level = 2;
            } else if (indentation >= 2) {
                level = 1;
            }
            paragraphs.push(new Paragraph({
                children: parseLine(trimmedLine.substring(2)),
                bullet: { level },
            }));
        } else if (trimmedLine.length > 0) {
            paragraphs.push(new Paragraph({ children: parseLine(trimmedLine) }));
        }
    });
    return paragraphs;
  };

  const handleDownloadDocx = async () => {
    if (!paper) return;

    setIsDownloading(true);
    try {
        const docxContent: Paragraph[] = [];

        docxContent.push(new Paragraph({
            text: title,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
        }));

        for (const section of paper.sections) {
            docxContent.push(new Paragraph({
                text: section.title,
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 240, after: 120 },
            }));

            docxContent.push(...createDocxParagraphs(section.content));
        }
        
        const doc = new Document({
            numbering: {
                config: [
                    {
                        reference: "numbered-list",
                        levels: [
                            {
                                level: 0,
                                format: "decimal",
                                text: "%1.",
                                start: 1,
                            },
                        ],
                    },
                ],
            },
            sections: [{
                properties: {},
                children: docxContent,
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

  const handleCopyToClipboard = async () => {
    if (!paper) return;

    const markdownToHtml = (markdown: string) => {
        let html = markdown
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/### (.*)/g, '<h3>$1</h3>')
            .replace(/## (.*)/g, '<h2>$1</h2>')

        const lines = html.split('\n');
        let inList = false;
        html = lines.map(line => {
            if (line.match(/^(\* |- |• )/)) {
                let li = `<li>${line.replace(/^(\* |- |• )/, '')}</li>`;
                if (!inList) {
                    inList = true;
                    return `<ul>${li}`;
                }
                return li;
            } else {
                if (inList) {
                    inList = false;
                    return `</ul>${line}`;
                }
                return line;
            }
        }).join('<br>');
        
        if (inList) {
            html += '</ul>';
        }

        return html.replace(/<br>/g, '\n').replace(/\n/g, '<br>');
    };

    const htmlContent = `<h1>${title}</h1>` + paper.sections.map(section => 
        `<h2>${section.title}</h2>${markdownToHtml(section.content)}`
    ).join('');
    
    try {
      const blob = new Blob([htmlContent], { type: 'text/html' });
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/html': blob })
      ]);
      // Success is handled by the dialog opening
    } catch (err) {
      console.error('Failed to copy rich text: ', err);
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Could not copy rich text to clipboard.",
      });
    }
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

    // IEEE Format View
    if (isIEEEFormat) {
        return (
            <div className="w-full max-w-full bg-white text-black p-8 shadow-lg min-h-screen">
                <div className="text-center mb-8 border-b-2 border-black pb-4">
                    <h1 className="text-3xl font-bold uppercase tracking-wide break-words">{title}</h1>
                </div>
                <div className="columns-1 md:columns-2 gap-8 text-justify">
                    {paper.sections.map((section, index) => (
                        <div key={index} className="break-inside-avoid mb-6">
                            <h2 className="text-lg font-bold uppercase mb-2 border-b border-gray-400 pb-1">{section.title}</h2>
                            {isEditMode ? (
                                <MarkdownEditor
                                    value={section.content}
                                    onChange={(newContent) => handleContentChange(index, newContent)}
                                    className="mb-4"
                                />
                            ) : (
                                <div className="text-sm font-serif leading-relaxed break-words w-full whitespace-normal">
                                    <ReactMarkdown>{section.content}</ReactMarkdown>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Standard / Card View
    return (
        <div className="space-y-6">
            {paper.sections.map((section, index) => {
            const isSectionRefining = refinementState.isRefining && refinementState.sectionIndex === index;
            const isSectionRegenerating = regenerationState.isRegenerating && regenerationState.sectionIndex === index;
            const isSectionLoading = isSectionRefining || isSectionRegenerating;

            return (
            <Card key={index} data-section-index={index}>
                <CardHeader className="flex flex-col sm:flex-row flex-wrap justify-between sm:items-center border-b pb-2 mb-4 gap-2">
                    <CardTitle className="text-2xl font-bold">{section.title}</CardTitle>
                    <div className="flex gap-2 shrink-0">
                        {!isEditMode && (
                        <>
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
                        </>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="relative">
                    {isSectionLoading && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg z-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}
                    {isEditMode ? (
                        <MarkdownEditor 
                            value={section.content}
                            onChange={(newContent) => handleContentChange(index, newContent)}
                            className=""
                        />
                    ) : (
                        <article className={`prose dark:prose-invert max-w-full w-full break-words transition-opacity whitespace-normal ${isSectionLoading ? 'opacity-50' : 'opacity-100'}`}>
                           <ReactMarkdown>{section.content}</ReactMarkdown>
                        </article>
                    )}
                </CardContent>
            </Card>
            )})}
        </div>
    )
  }

  return (
    <div className="w-full max-w-full space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
             <div className="flex-1 min-w-0">
                <Button variant="outline" size="sm" className="mb-4" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4"/>
                    Back
                </Button>
                <h1 className="text-3xl font-bold tracking-tight break-words">
                    {title}
                </h1>
            </div>
            
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
                {/* View Toggles */}
                <div className="flex items-center gap-2 border p-2 rounded-lg bg-muted/20">
                    <div className="flex items-center gap-2">
                        <Switch id="ieee-mode" checked={isIEEEFormat} onCheckedChange={setIsIEEEFormat} />
                        <Label htmlFor="ieee-mode" className="flex items-center cursor-pointer">
                            <Columns className="w-4 h-4 mr-1" />
                            IEEE
                        </Label>
                    </div>
                    <div className="w-px h-6 bg-border mx-2" />
                    <div className="flex items-center gap-2">
                        <Switch id="edit-mode" checked={isEditMode} onCheckedChange={setIsEditMode} />
                        <Label htmlFor="edit-mode" className="flex items-center cursor-pointer">
                            <PenTool className="w-4 h-4 mr-1" />
                            Edit
                        </Label>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={handleSaveOrUpdateDraft} variant="default" size="sm" disabled={isLoading || !!error || isSaving || isAiWorking}>
                        {isSaving ? <Loader2 className="animate-spin" /> : (isExistingDraft ? <Check /> : <Save />)}
                        <span className="ml-2 hidden sm:inline">{isExistingDraft ? 'Update Draft' : 'Save Draft'}</span>
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
                        <span className="ml-2 hidden sm:inline">Google Docs</span>
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
        
        {renderContent()}
    </div>
  );
}
