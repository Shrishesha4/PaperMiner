'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useApiKey } from '@/hooks/use-api-key';
import { useToast } from '@/hooks/use-toast';
import { generateNewTitle } from '@/ai/flows/generate-new-title';
import { Loader2, Wand2, MessageSquareText, Plus, X } from 'lucide-react';
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

export function TitleGenerator() {
  const { apiKey } = useApiKey();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [currentTopic, setCurrentTopic] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddTopic = () => {
    if (currentTopic.trim() && !topics.includes(currentTopic.trim())) {
      setTopics([...topics, currentTopic.trim()]);
      setCurrentTopic('');
    }
  };
  
  const handleTopicInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTopic();
    }
  }

  const handleRemoveTopic = (topicToRemove: string) => {
    setTopics(topics.filter(topic => topic !== topicToRemove));
  };

  const handleGenerateClick = useCallback(async () => {
    if (!apiKey) {
      toast({
        variant: 'destructive',
        title: 'API Key Not Set',
        description: 'Please set your Gemini API key before generating a title.',
      });
      return;
    }
    if (topics.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Topics Added',
        description: 'Please add at least one topic to generate a new title.',
      });
      return;
    }

    setIsLoading(true);
    setGeneratedTitle('');
    try {
      const result = await generateNewTitle({ topics, apiKey });
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
  }, [apiKey, topics, toast]);

  const handleChatGptClick = () => {
    const prompt = `You are an expert academic writer. Based on the following list of topics, generate one new, creative, and insightful title that synthesizes their key themes.

Topics:
${topics.map(t => `- ${t}`).join('\n')}

Respond with only the new title.`;

    const chatGptUrl = `https://chat.openai.com/?q=${encodeURIComponent(prompt)}`;
    window.open(chatGptUrl, '_blank');
  };
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
        setTopics([]);
        setGeneratedTitle('');
        setCurrentTopic('');
    }
  }

  return (
    <>
      <Button onClick={() => handleOpenChange(true)}>
        <Wand2 className="mr-2" />
        Generate Title
      </Button>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Generate a New Title</DialogTitle>
            <DialogDescription>
              Add topics or categories to generate a synthesized research title. Press Enter to add a topic.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={currentTopic}
                onChange={(e) => setCurrentTopic(e.target.value)}
                onKeyDown={handleTopicInputKeyDown}
                placeholder="e.g., Machine Learning, Cybersecurity"
              />
              <Button type="button" size="icon" onClick={handleAddTopic}>
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add topic</span>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[40px]">
              {topics.map(topic => (
                <Badge key={topic} variant="secondary" className="flex items-center gap-1">
                  {topic}
                  <button onClick={() => handleRemoveTopic(topic)} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            {generatedTitle && (
              <div className="pt-4">
                <h4 className="font-medium mb-2 text-sm text-foreground">Suggested Title:</h4>
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="font-semibold text-primary">{generatedTitle}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <div className="flex flex-wrap gap-2 w-full justify-end">
                <Button onClick={handleGenerateClick} disabled={isLoading || topics.length === 0}>
                {isLoading ? (
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
