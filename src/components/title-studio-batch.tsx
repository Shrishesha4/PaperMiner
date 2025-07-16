'use client';

import React, { useState } from 'react';
import { useApiKey } from '@/hooks/use-api-key';
import { useToast } from '@/hooks/use-toast';
import { generateBatchTitles } from '@/ai/flows/generate-batch-titles';
import { checkTitleNovelty } from '@/ai/flows/check-title-novelty';
import type { CheckTitleNoveltyOutput } from '@/types/schemas';
import { TopicSelector } from './topic-selector';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter } from './ui/card';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Loader2, Wand2, Copy, SearchCheck, Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { NoveltyResultCard } from './novelty-result-card';

interface TitleStudioBatchProps {
  analysis: {
    name: string;
    categories: string[];
    titles: string[];
  };
  generatedTitles: string[];
  onTitlesGenerated: (titles: string[]) => void;
}

type NoveltyState = {
  isLoading: boolean;
  result: CheckTitleNoveltyOutput | null;
  error: string | null;
};

export function TitleStudioBatch({ analysis, generatedTitles, onTitlesGenerated }: TitleStudioBatchProps) {
  const { apiKey } = useApiKey();
  const { toast } = useToast();
  const [topics, setTopics] = useState<string[]>([]);
  const [numTitles, setNumTitles] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedStates, setCopiedStates] = useState<boolean[]>([]);
  const [noveltyChecks, setNoveltyChecks] = useState<Record<number, NoveltyState>>({});

  const handleGenerate = async () => {
    if (!apiKey || topics.length === 0) return;

    setIsGenerating(true);
    onTitlesGenerated([]);
    setCopiedStates([]);
    setNoveltyChecks({});

    try {
      const result = await generateBatchTitles({
        topics,
        count: numTitles,
        apiKey,
      });
      onTitlesGenerated(result.titles);
      setCopiedStates(new Array(result.titles.length).fill(false));
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Batch Generation Failed',
        description: 'An error occurred while generating titles. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    const newCopiedStates = [...copiedStates];
    newCopiedStates[index] = true;
    setCopiedStates(newCopiedStates);
    setTimeout(() => {
      setCopiedStates(prev => {
          const resetCopiedStates = [...prev];
          resetCopiedStates[index] = false;
          return resetCopiedStates;
      });
    }, 2000);
  };
  
  const handleCheckNovelty = async (title: string, index: number) => {
    if (!apiKey) return;

    setNoveltyChecks(prev => ({ ...prev, [index]: { isLoading: true, result: null, error: null } }));

    try {
      const result = await checkTitleNovelty({
        generatedTitle: title,
        existingTitles: analysis.titles,
        apiKey
      });
      setNoveltyChecks(prev => ({ ...prev, [index]: { isLoading: false, result, error: null } }));
    } catch (error) {
      console.error('Novelty check failed:', error);
      let errorMessage = 'An error occurred during the novelty check.';
      if (error instanceof Error) {
        errorMessage = error.message.includes('API key not valid')
            ? 'Your Gemini API Key is invalid. Please check it and try again.'
            : error.message.includes('SAFETY')
            ? 'The novelty check was blocked by safety settings.'
            : 'Could not connect to the novelty check service. Please try again later.';
      }
      setNoveltyChecks(prev => ({ ...prev, [index]: { isLoading: false, result: null, error: errorMessage } }));
       toast({
        variant: 'destructive',
        title: 'Novelty Check Failed',
        description: errorMessage,
      });
    }
  }

  const getNoveltyScoreColor = (score: number) => {
    if (score < 0.5) return 'text-destructive';
    if (score < 0.8) return 'text-amber-600';
    return 'text-green-600';
  };

  return (
    <div className="flex flex-col">
      <div className="p-4 sm:p-6 border-b">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TopicSelector
                availableCategories={analysis.categories}
                onTopicsChange={setTopics}
                isLoading={isGenerating}
            />
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="num-titles">Number of Titles to Generate: {numTitles}</Label>
                    <Slider
                        id="num-titles"
                        min={1}
                        max={5}
                        step={1}
                        value={[numTitles]}
                        onValueChange={(value) => setNumTitles(value[0])}
                        disabled={isGenerating}
                    />
                </div>
                <Button onClick={handleGenerate} disabled={isGenerating || topics.length === 0} className="w-full">
                    {isGenerating ? (
                        <Loader2 className="mr-2 animate-spin" />
                    ) : (
                        <Wand2 className="mr-2" />
                    )}
                    Generate {numTitles} Title{numTitles > 1 ? 's' : ''}
                </Button>
            </div>
        </div>
      </div>
      
      <div className="p-4 sm:p-6 bg-muted/40">
        {isGenerating ? (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-2" />
                    <p className="text-muted-foreground">Generating titles...</p>
                </div>
            </div>
        ) : generatedTitles.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {generatedTitles.map((title, index) => {
              const noveltyState = noveltyChecks[index];
              return (
                <Card key={index} className="flex flex-col">
                  <CardContent className="p-4 flex-1">
                    <p className="font-medium">{title}</p>
                  </CardContent>
                  <CardFooter className="p-4 bg-background border-t flex justify-between items-center gap-2">
                     <Button variant="ghost" size="sm" onClick={() => handleCopy(title, index)}>
                      {copiedStates[index] ? <Check className="text-green-500" /> : <Copy />}
                      <span className="ml-2">{copiedStates[index] ? 'Copied!' : 'Copy'}</span>
                    </Button>
                    
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => !noveltyState?.result && handleCheckNovelty(title, index)}
                                disabled={noveltyState?.isLoading}
                                className={noveltyState?.result ? getNoveltyScoreColor(noveltyState.result.noveltyScore) : ''}
                            >
                                {noveltyState?.isLoading ? (
                                    <Loader2 className="animate-spin" />
                                ) : noveltyState?.result ? (
                                    `Score: ${noveltyState.result.noveltyScore.toFixed(2)}`
                                ) : (
                                    <SearchCheck />
                                )}
                                <span className="ml-2">{noveltyState?.result ? 'View Details' : 'Check Novelty'}</span>
                            </Button>
                        </DialogTrigger>
                        {noveltyState?.result && (
                            <DialogContent className="sm:max-w-lg">
                               <DialogHeader>
                                  <DialogTitle>Novelty Analysis</DialogTitle>
                               </DialogHeader>
                               <p className="text-sm border-l-4 pl-3 py-1 bg-muted">"{title}"</p>
                               <NoveltyResultCard result={noveltyState.result} />
                            </DialogContent>
                        )}
                    </Dialog>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
             <Alert className="max-w-md mx-auto">
                <Wand2 className="h-4 w-4" />
                <AlertTitle>Ready to Generate!</AlertTitle>
                <AlertDescription>
                    Select your topics and click the "Generate" button to create a batch of new titles.
                </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
}
