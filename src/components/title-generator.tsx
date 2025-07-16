'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useApiKey } from '@/hooks/use-api-key';
import { useToast } from '@/hooks/use-toast';
import { generateNewTitle } from '@/ai/flows/generate-new-title';
import { checkTitleNovelty } from '@/ai/flows/check-title-novelty';
import { refineTitle } from '@/ai/flows/refine-title';
import { Loader2, Wand2, MessageSquareText, Plus, X, SearchCheck, Info, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import type { CheckTitleNoveltyOutput } from '@/types/schemas';

interface TitleGeneratorProps {
  availableCategories: string[];
  existingTitles: string[];
}

export function TitleGenerator({ availableCategories, existingTitles }: TitleGeneratorProps) {
  const { apiKey } = useApiKey();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCheckingNovelty, setIsCheckingNovelty] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);
  const [activeTitle, setActiveTitle] = useState<string | null>(null);

  const [noveltyResult, setNoveltyResult] = useState<CheckTitleNoveltyOutput | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [currentTopic, setCurrentTopic] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddTopic = (topic: string) => {
    const trimmedTopic = topic.trim();
    if (trimmedTopic && !topics.includes(trimmedTopic)) {
      setTopics([...topics, trimmedTopic]);
    }
  };
  
  const handleManualAdd = () => {
    handleAddTopic(currentTopic);
    setCurrentTopic('');
  };
  
  const handleTopicInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleManualAdd();
    }
  }

  const handleRemoveTopic = (topicToRemove: string) => {
    setTopics(topics.filter(topic => topic !== topicToRemove));
  };

  const handleGenerateClick = useCallback(async () => {
    if (!apiKey) {
      toast({ variant: 'destructive', title: 'API Key Not Set' });
      return;
    }
    if (topics.length === 0) {
      toast({ variant: 'destructive', title: 'No Topics Added', description: 'Please add at least one topic.' });
      return;
    }

    setIsGenerating(true);
    setGeneratedTitles([]);
    setActiveTitle(null);
    setNoveltyResult(null);
    try {
      const result = await generateNewTitle({ topics, apiKey });
      setGeneratedTitles([result.newTitle]);
      setActiveTitle(result.newTitle);
    } catch (error) {
      console.error('Error generating new title:', error);
      toast({ variant: 'destructive', title: 'Generation Failed', description: 'Could not generate a new title.' });
    } finally {
      setIsGenerating(false);
    }
  }, [apiKey, topics, toast]);

  const handleNoveltyCheck = useCallback(async () => {
    if (!apiKey || !activeTitle) {
      return;
    }
    setIsCheckingNovelty(true);
    setNoveltyResult(null);
    try {
      const result = await checkTitleNovelty({
        generatedTitle: activeTitle,
        existingTitles,
        apiKey,
      });
      setNoveltyResult(result);
    } catch (error) {
      console.error('Error checking novelty:', error);
      toast({ variant: 'destructive', title: 'Novelty Check Failed', description: 'Could not check the title novelty.' });
    } finally {
      setIsCheckingNovelty(false);
    }
  }, [apiKey, activeTitle, existingTitles, toast]);

  const handleSuggestionClick = useCallback(async (suggestion: string) => {
    if (!apiKey || !activeTitle) return;

    setIsRefining(true);
    try {
        const result = await refineTitle({
            originalTitle: activeTitle,
            suggestion: suggestion,
            apiKey,
        });
        
        // Add the new title to the list and set it as active
        if (!generatedTitles.includes(result.refinedTitle)) {
            const newTitles = [...generatedTitles, result.refinedTitle];
            setGeneratedTitles(newTitles);
        }
        setActiveTitle(result.refinedTitle);

        setNoveltyResult(null); // Clear old novelty results
        toast({
            title: "Title Refined",
            description: "A new version of the title has been generated. You can now check its novelty."
        });
    } catch (error) {
        console.error("Error refining title:", error);
        toast({
            variant: "destructive",
            title: "Refinement Failed",
            description: "Could not refine the title based on the suggestion."
        });
    } finally {
        setIsRefining(false);
    }
  }, [apiKey, activeTitle, generatedTitles, toast]);


  const handleChatGptClick = () => {
    const prompt = `You are an expert academic writer specializing in creating compelling research paper titles that adhere to IEEE conventions.
  
Based on the following list of topics, generate one new, creative, and insightful title that synthesizes these themes.

The title must follow these strict conventions:
1. **IEEE Style**: It should be concise, descriptive, and accurately reflect the paper's content. Avoid overly sensational language.
2. **PICO Framework**: Structure the title conceptually around PICO elements where applicable:
   - **P (Population/Problem)**: What is the specific problem or group being studied?
   - **I (Intervention)**: What is the new method, technology, or approach being proposed?
   - **C (Comparison)**: What is the main alternative or baseline it's being compared against? (Optional if not applicable)
   - **O (Outcome)**: What is the primary result or benefit of the intervention?

Topics to synthesize:
${topics.map(t => `- ${t}`).join('\n')}

Respond with only the new title.`;

    const chatGptUrl = `https://chat.openai.com/?q=${encodeURIComponent(prompt)}`;
    window.open(chatGptUrl, '_blank');
  };
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
        setTopics([]);
        setGeneratedTitles([]);
        setActiveTitle(null);
        setCurrentTopic('');
        setNoveltyResult(null);
    }
  }

  const getNoveltyAlertVariant = (score: number) => {
    if (score < 0.5) return 'destructive';
    if (score < 0.8) return 'default';
    return 'default'; // Success variant would be nice here
  }
  
  const anyLoading = isGenerating || isCheckingNovelty || isRefining;

  return (
    <>
      <Button onClick={() => handleOpenChange(true)}>
        <Wand2 className="mr-2" />
        Generate Title
      </Button>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Generate a New Research Title</DialogTitle>
            <DialogDescription>
              Add topics, generate a title, check its novelty, and refine it with AI suggestions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 overflow-y-auto pr-6 -mr-6 break-words">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={currentTopic}
                onChange={(e) => setCurrentTopic(e.target.value)}
                onKeyDown={handleTopicInputKeyDown}
                placeholder="e.g., Machine Learning"
                disabled={anyLoading}
              />
              <Button type="button" size="icon" onClick={handleManualAdd} disabled={anyLoading}>
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add topic</span>
              </Button>
            </div>
            
            <div className="space-y-4">
                <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Selected Topics</h4>
                    <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-muted/50 rounded-md">
                    {topics.length > 0 ? topics.map(topic => (
                        <Badge key={topic} variant="secondary" className="flex items-center gap-1">
                        {topic}
                        <button onClick={() => handleRemoveTopic(topic)} className="rounded-full hover:bg-muted-foreground/20 p-0.5" disabled={anyLoading}>
                            <X className="h-3 w-3" />
                        </button>
                        </Badge>
                    )) : (
                        <p className="text-sm text-muted-foreground p-2">No topics selected yet.</p>
                    )}
                    </div>
                </div>

                {availableCategories.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Click to Add Existing Categories</h4>
                        <div className="flex flex-wrap gap-2">
                            {availableCategories.map(cat => (
                                <Badge
                                key={cat}
                                variant="outline"
                                onClick={() => handleAddTopic(cat)}
                                className={`cursor-pointer hover:bg-primary/10 ${anyLoading ? 'opacity-50 pointer-events-none' : ''}`}
                                >
                                {cat}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {(generatedTitles.length > 0 || isGenerating) && (
              <div className="pt-4">
                <Separator className="my-4" />
                <h4 className="font-medium mb-2 text-sm text-foreground">Generated Titles:</h4>
                <div className="space-y-2">
                   {isGenerating && <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 min-h-[60px] flex items-center"><Loader2 className="animate-spin" /></div>}
                   {generatedTitles.map((title, index) => (
                        <div key={index} 
                             onClick={() => {
                                 if (anyLoading) return;
                                 setActiveTitle(title);
                                 setNoveltyResult(null);
                             }}
                             className={`p-4 rounded-lg border transition-all ${activeTitle === title ? 'bg-primary/10 border-primary/20' : 'bg-muted/50 border-border'} ${anyLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-primary/5'}`}>
                            <p className={`font-semibold ${activeTitle === title ? 'text-primary' : ''}`}>{title}</p>
                        </div>
                   ))}
                </div>
                {isRefining && <div className="p-4 mt-2 bg-primary/10 rounded-lg border border-primary/20 min-h-[60px] flex items-center"><Loader2 className="animate-spin" /><span className="ml-2">Refining...</span></div>}
                {activeTitle && !isGenerating && (
                  <div className="mt-4">
                    <Button onClick={handleNoveltyCheck} disabled={anyLoading}>
                      {isCheckingNovelty ? <Loader2 className="mr-2 animate-spin" /> : <SearchCheck className="mr-2" />}
                      Check Novelty of Selected Title
                    </Button>
                  </div>
                )}
              </div>
            )}

            {(noveltyResult || isCheckingNovelty) && (
                <div className="pt-4">
                  <Separator className="my-4" />
                  <h4 className="font-medium mb-2 text-sm text-foreground">Novelty Analysis</h4>
                  {isCheckingNovelty && !noveltyResult ? <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin" /> <p>Analyzing...</p></div> : noveltyResult && (
                      <Alert variant={getNoveltyAlertVariant(noveltyResult.noveltyScore)}>
                          <AlertTitle className="flex items-center gap-2">
                              Novelty Score: {noveltyResult.noveltyScore.toFixed(2)} / 1.0
                          </AlertTitle>
                          <AlertDescription>
                              {noveltyResult.overallReasoning}
                          </AlertDescription>
                      </Alert>
                  )}

                  {noveltyResult && noveltyResult.suggestionsForImprovement && noveltyResult.suggestionsForImprovement.length > 0 && (
                      <div className="mt-4 space-y-2">
                          <h5 className="text-sm font-medium flex items-center gap-2"><Sparkles className="w-4 h-4 text-accent" /> Suggestions for Improvement (Click to apply):</h5>
                          <div className="flex flex-col items-start gap-2">
                              {noveltyResult.suggestionsForImprovement.map((suggestion, index) => (
                                  <Button
                                    key={index}
                                    variant="outline"
                                    className="h-auto whitespace-normal text-left p-2 w-full"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    disabled={anyLoading}
                                  >
                                      {suggestion}
                                  </Button>
                              ))}
                          </div>
                      </div>
                  )}

                  {noveltyResult && noveltyResult.similarTitles.length > 0 && (
                      <div className="mt-4 space-y-2">
                            <h5 className="text-sm font-medium">Potentially Similar Titles Found:</h5>
                            <TooltipProvider>
                              <ul className="space-y-2">
                                  {noveltyResult.similarTitles.map((item, index) => (
                                      <li key={index} className="text-sm text-muted-foreground p-2 border rounded-md">
                                          <div className="flex justify-between items-start gap-2">
                                              <p className="flex-1 pr-2 break-words">{item.title}</p>
                                              <div className="flex items-center gap-2">
                                                  <Badge variant="secondary">{item.similarityScore.toFixed(2)}</Badge>
                                                  <Tooltip delayDuration={100}>
                                                      <TooltipTrigger>
                                                          <Info className="h-4 w-4" />
                                                      </TooltipTrigger>
                                                      <TooltipContent className="max-w-xs">
                                                          <p>{item.reasoning}</p>
                                                      </TooltipContent>
                                                  </Tooltip>
                                              </div>
                                          </div>
                                      </li>
                                  ))}
                              </ul>
                            </TooltipProvider>
                      </div>
                  )}
                </div> 
            )}
          </div>
          <DialogFooter className="mt-auto pt-4">
            <div className="flex flex-wrap gap-2 w-full justify-end">
                <Button onClick={handleGenerateClick} disabled={isGenerating || topics.length === 0 || isCheckingNovelty || isRefining}>
                {isGenerating ? (
                    <Loader2 className="mr-2 animate-spin" />
                ) : (
                    <Wand2 className="mr-2" />
                )}
                Generate with Gemini
                </Button>
                <Button onClick={handleChatGptClick} variant="outline" disabled={topics.length === 0}>
                <MessageSquareText className="mr-2" />
                Open in ChatGPT
                </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
