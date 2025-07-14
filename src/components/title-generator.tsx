'use client';

import React, { useState, useCallback } from 'react';
import type { CategorizedPaper } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/card';
import { useApiKey } from '@/hooks/use-api-key';
import { useToast } from '@/hooks/use-toast';
import { generateNewTitle } from '@/ai/flows/generate-new-title';
import { Loader2, Wand2, MessageSquareText } from 'lucide-react';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

interface TitleGeneratorProps {
  selectedPapers: CategorizedPaper[];
}

export function TitleGenerator({ selectedPapers }: TitleGeneratorProps) {
  const { apiKey } = useApiKey();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedTitle, setGeneratedTitle] = useState('');

  const handleGenerateClick = useCallback(async () => {
    if (!apiKey) {
      toast({
        variant: 'destructive',
        title: 'API Key Not Set',
        description: 'Please set your Gemini API key before generating a title.',
      });
      return;
    }
    if (selectedPapers.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Papers Selected',
        description: 'Please select at least one paper to generate a new title.',
      });
      return;
    }

    setIsLoading(true);
    setGeneratedTitle('');
    try {
      const papersToPrompt = selectedPapers.map(p => ({
        title: p['Document Title'],
        category: p.category,
      }));

      const result = await generateNewTitle({ papers: papersToPrompt, apiKey });
      setGeneratedTitle(result.newTitle);
    } catch (error) {
      console.error('Error generating new title:', error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'Could not generate a new title. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, selectedPapers, toast]);

  const handleChatGptClick = () => {
    const promptLines = selectedPapers.map(p => `- Title: "${p['Document Title']}" (Category: ${p.category})`);
    const prompt = `You are an expert academic writer. Based on the following list of research papers, generate one new, creative, and insightful title that synthesizes their key themes.

Selected Papers:
${promptLines.join('\n')}

Respond with only the new title.`;

    const chatGptUrl = `https://chat.openai.com/?q=${encodeURIComponent(prompt)}`;
    window.open(chatGptUrl, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate New Title</CardTitle>
        <CardDescription>
          Use your selected papers as inspiration to generate a new, synthesized research title.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Selected Papers ({selectedPapers.length})</h4>
          <ScrollArea className="h-40 rounded-md border p-2">
            <div className="flex flex-col gap-2">
              {selectedPapers.map(paper => (
                <div key={paper['Document Identifier']} className="text-sm p-2 rounded-md bg-muted/50">
                  <p className="font-semibold truncate">{paper['Document Title']}</p>
                  <Badge variant="secondary">{paper.category}</Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleGenerateClick} disabled={isLoading || selectedPapers.length === 0}>
            {isLoading ? (
              <Loader2 className="mr-2 animate-spin" />
            ) : (
              <Wand2 className="mr-2" />
            )}
            Generate with Gemini
          </Button>
          <Button onClick={handleChatGptClick} variant="outline" disabled={selectedPapers.length === 0}>
            <MessageSquareText className="mr-2" />
            Open in ChatGPT
          </Button>
        </div>
        {generatedTitle && (
          <div className="pt-4">
            <h4 className="font-medium mb-2">Suggested Title:</h4>
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-lg font-semibold text-primary">{generatedTitle}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
