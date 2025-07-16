'use client';

import React, { useState } from 'react';
import { useApiKey } from '@/hooks/use-api-key';
import { useToast } from '@/hooks/use-toast';
import { generateBatchTitles } from '@/ai/flows/generate-batch-titles';
import { TopicSelector } from './topic-selector';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Loader2, Wand2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface TitleStudioBatchProps {
  analysis: {
    name: string;
    categories: string[];
    titles: string[];
  };
}

export function TitleStudioBatch({ analysis }: TitleStudioBatchProps) {
  const { apiKey } = useApiKey();
  const { toast } = useToast();
  const [topics, setTopics] = useState<string[]>([]);
  const [numTitles, setNumTitles] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!apiKey || topics.length === 0) return;

    setIsLoading(true);
    setGeneratedTitles([]);
    
    try {
      const result = await generateBatchTitles({
        topics,
        count: numTitles,
        apiKey,
      });
      setGeneratedTitles(result.titles);
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Batch Generation Failed',
        description: 'An error occurred while generating titles. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
        <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
                <TopicSelector
                    availableCategories={analysis.categories}
                    onTopicsChange={setTopics}
                    isLoading={isLoading}
                />

                <div className="space-y-2">
                    <Label htmlFor="num-titles">Number of Titles to Generate: {numTitles}</Label>
                    <Slider
                        id="num-titles"
                        min={1}
                        max={5}
                        step={1}
                        value={[numTitles]}
                        onValueChange={(value) => setNumTitles(value[0])}
                        disabled={isLoading}
                    />
                </div>
            </div>
        </ScrollArea>
        <div className="p-4 border-t bg-background shrink-0">
             <Button onClick={handleGenerate} disabled={isLoading || topics.length === 0} className="w-full">
                {isLoading ? (
                    <Loader2 className="mr-2 animate-spin" />
                ) : (
                    <Wand2 className="mr-2" />
                )}
                Generate {numTitles} Title{numTitles > 1 ? 's' : ''}
            </Button>
        </div>
        {generatedTitles.length > 0 && (
            <div className="p-4 border-t">
                <h3 className="text-lg font-semibold mb-2">Generated Titles</h3>
                <Card>
                    <CardContent className="p-4 space-y-2">
                        {generatedTitles.map((title, index) => (
                            <div key={index} className="text-sm p-2 border-b last:border-b-0">
                               {index + 1}. {title}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        )}
    </div>
  );
}
