
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useHistory } from '@/hooks/use-history';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Download, Loader2, ArrowLeft } from 'lucide-react';
import { TitleStudioBatch } from './title-studio-batch';
import { continueInChatGPT } from '@/lib/chatgpt';
import jsPDF from 'jspdf';
import type { ExistingPaper } from '@/types/schemas';


type AnalysisData = {
  id: string | null; // Can be null for an unsaved scratch analysis
  name: string;
  categories: string[];
  papers: ExistingPaper[];
};

export function TitleStudio() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { history, isLoading: isHistoryLoading, addAnalysis, updateAnalysis } = useHistory();
  const { toast } = useToast();
  
  const analysisId = searchParams.get('analysisId');
  
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);
  const [generationTopics, setGenerationTopics] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use a ref to track the ID of a newly created scratch analysis
  // so we can update it instead of creating new ones on subsequent generations.
  const scratchAnalysisId = useRef<string | null>(null);


  useEffect(() => {
    if (isHistoryLoading) return;

    if (analysisId) {
      scratchAnalysisId.current = analysisId; // Store for potential updates
      const found = history.find((h) => h.id === analysisId);
      if (found) {
        const categories = Array.from(new Set(found.categorizedPapers.map((p) => p.category).filter(Boolean)));
        
        const papers: ExistingPaper[] = found.categorizedPapers.map((p) => {
            const ieeeTerms = p['IEEE Terms']?.split(';').map(k => k.trim()).filter(Boolean) || [];
            return {
                title: p['Document Title'],
                keywords: [...ieeeTerms]
            };
        });

        setAnalysis({ id: found.id, name: found.name, categories, papers });
        if (found.generatedTitles) {
            setGeneratedTitles(found.generatedTitles);
        }
      } else {
        toast({ variant: 'destructive', title: 'Analysis not found' });
        router.push('/');
      }
    } else {
      // Handle the "from scratch" case without saving immediately.
      setAnalysis({ id: null, name: 'From Scratch', categories: [], papers: [] });
      setGeneratedTitles([]);
      scratchAnalysisId.current = null;
    }
    setIsLoading(false);
  }, [analysisId, history, isHistoryLoading, router, toast]);

  const handleTitlesGenerated = useCallback((newTitles: string[], topics: string[]) => {
    setGeneratedTitles(newTitles);
    setGenerationTopics(topics);
    
    // If it's a new scratch analysis, create it now.
    if (!scratchAnalysisId.current && (analysisId === null || analysisId === undefined)) {
        const name = `Scratchpad: ${topics.join(', ')}`;
        const newAnalysis = addAnalysis({
            name,
            categorizedPapers: [],
            failedPapers: [],
            generatedTitles: newTitles,
        });
        scratchAnalysisId.current = newAnalysis.id;
        // Update URL to reflect the new analysis ID for persistence
        router.replace(`/title-studio?analysisId=${newAnalysis.id}`, { scroll: false });
        return;
    }
    
    // If it's an existing analysis (scratch or otherwise), update it.
    if (scratchAnalysisId.current) {
        const existingAnalysis = history.find(h => h.id === scratchAnalysisId.current);
        const updates: { generatedTitles: string[]; name?: string } = { generatedTitles: newTitles };
        
        // Update name for scratchpads
        if (existingAnalysis && (existingAnalysis.name === 'From Scratch' || existingAnalysis.name.startsWith('Scratchpad:'))) {
            updates.name = `Scratchpad: ${topics.join(', ')}`;
        }
        
        updateAnalysis(scratchAnalysisId.current, updates);
    }
  }, [updateAnalysis, analysisId, history, addAnalysis, router]);
  
  const handleContinueInChatGPT = () => {
    if (generatedTitles.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Titles to Export',
        description: 'Please generate some titles before exporting to ChatGPT.',
      });
      return;
    }

    const textToCopy = `Here is a list of research paper titles I've generated. Please help me refine them:\n\n${generatedTitles.map(t => `- ${t}`).join('\n')}`;
    continueInChatGPT(textToCopy);
  };

  const handleDownloadPDF = () => {
    if (generatedTitles.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Titles to Download',
        description: 'Please generate some titles first.',
      });
      return;
    }

    const doc = new jsPDF();
    const pageMargin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = pageMargin;

    doc.setFontSize(18);
    doc.text('Generated Research Titles', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    if (generationTopics.length > 0) {
        doc.setFontSize(14);
        doc.text('Generated from Topics:', pageMargin, yPos);
        yPos += 8;
        doc.setFontSize(10);
        doc.text(`- ${generationTopics.join('\n- ')}`, pageMargin, yPos);
        yPos += 10 + (generationTopics.length * 5);
    }
    
    doc.setFontSize(14);
    doc.text('Generated Titles:', pageMargin, yPos);
    yPos += 8;

    doc.setFontSize(11);
    
    // Use splitTextToSize to handle long titles and prevent overflow
    const splitTitles = generatedTitles.map(title => 
        doc.splitTextToSize(`• ${title}`, pageWidth - pageMargin * 2)
    );

    splitTitles.forEach(titleLines => {
      if (yPos + (titleLines.length * 7) > doc.internal.pageSize.getHeight() - pageMargin) {
        doc.addPage();
        yPos = pageMargin;
      }
      doc.text(titleLines, pageMargin, yPos);
      yPos += titleLines.length * 7;
    });

    doc.save(`PaperMiner-Generated-Titles.pdf`);
  };

  if (isLoading || !analysis) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b shrink-0 gap-4 pb-4">
        <div className='flex-1'>
            <Button variant="outline" size="sm" className="mb-4" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4"/>
              Back
            </Button>
          <h1 className="text-3xl font-bold tracking-tight">Title Studio</h1>
          <p className="text-sm text-muted-foreground">
            {analysis.name === 'From Scratch' || analysis.name.startsWith('Scratchpad:')
              ? 'Generating new title ideas' 
              : <>Using dataset: <span className="font-semibold">{analysis.name}</span></>
            }
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Button onClick={handleDownloadPDF} variant="outline" disabled={generatedTitles.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
            </Button>
            <Button onClick={handleContinueInChatGPT} variant="outline" disabled={generatedTitles.length === 0}>
                Continue in ChatGPT
            </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <TitleStudioBatch 
          analysis={{...analysis, id: analysis.id || 'scratch'}}
          generatedTitles={generatedTitles}
          onTitlesGenerated={handleTitlesGenerated}
        />
      </div>
    </div>
  );
}
