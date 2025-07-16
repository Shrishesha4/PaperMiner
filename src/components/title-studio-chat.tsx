'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useApiKey } from '@/hooks/use-api-key';
import { generateNewTitle } from '@/ai/flows/generate-new-title';
import { checkTitleNovelty } from '@/ai/flows/check-title-novelty';
import { refineTitle } from '@/ai/flows/refine-title';
import { Button } from './ui/button';
import { Loader2, SearchCheck, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { cn } from '@/lib/utils';
import { TopicSelector } from './topic-selector';
import { NoveltyResultCard } from './novelty-result-card';
import type { CheckTitleNoveltyOutput } from '@/types/schemas';
import { ScrollArea } from './ui/scroll-area';

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  type: 'topics' | 'title' | 'novelty' | 'refinement' | 'error';
  content: string | CheckTitleNoveltyOutput;
  actions?: { type: 'check-novelty' } | { type: 'refine'; suggestions: string[] };
};

interface TitleStudioChatProps {
    analysis: { name: string, categories: string[], titles: string[] };
    onMessagesChange: (messages: Message[]) => void;
}

export function TitleStudioChat({ analysis, onMessagesChange }: TitleStudioChatProps) {
  const { apiKey } = useApiKey();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTitle, setActiveTitle] = useState<string | null>(null);

  useEffect(() => {
    onMessagesChange(messages);
  }, [messages, onMessagesChange]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div');
        if (viewport) {
            viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }
    }
  }, [messages]);

  const handleGenerateTitle = useCallback(async (topics: string[]) => {
    if (!apiKey) return;
    setIsLoading(true);
    setActiveTitle(null);
    setMessages(prev => [
        ...prev,
        { id: `msg-${Date.now()}`, role: 'user', type: 'topics', content: `Generate a title based on: ${topics.join(', ')}` },
        { id: `msg-${Date.now()}-loading`, role: 'assistant', type: 'title', content: '' } // Placeholder
    ]);

    try {
        const result = await generateNewTitle({ topics, apiKey });
        setActiveTitle(result.newTitle);
        setMessages(prev => prev.slice(0, -1).concat({ // Replace placeholder
            id: `msg-${Date.now()}`,
            role: 'assistant',
            type: 'title',
            content: result.newTitle,
            actions: { type: 'check-novelty' }
        }));
    } catch (e) {
        setMessages(prev => prev.slice(0, -1).concat({
            id: `msg-${Date.now()}`,
            role: 'assistant',
            type: 'error',
            content: 'Sorry, I failed to generate a title. Please try again.'
        }));
    } finally {
        setIsLoading(false);
    }
  }, [apiKey]);
  
  const handleCheckNovelty = useCallback(async () => {
    if (!apiKey || !activeTitle || !analysis) return;
    setIsLoading(true);
    // Disable actions on the previous message
    setMessages(prev => prev.map(m => ({...m, actions: undefined})));

    setMessages(prev => [
        ...prev,
        { id: `msg-${Date.now()}`, role: 'user', type: 'novelty', content: `Check the novelty of "${activeTitle}"` },
        { id: `msg-${Date.now()}-loading`, role: 'assistant', type: 'novelty', content: '' } // Placeholder
    ]);

    try {
        const result = await checkTitleNovelty({ generatedTitle: activeTitle, existingTitles: analysis.titles, apiKey });
        setMessages(prev => prev.slice(0, -1).concat({
            id: `msg-${Date.now()}`,
            role: 'assistant',
            type: 'novelty',
            content: result,
            actions: result.suggestionsForImprovement ? { type: 'refine', suggestions: result.suggestionsForImprovement } : undefined
        }));
    } catch (e) {
        setMessages(prev => prev.slice(0, -1).concat({
            id: `msg-${Date.now()}`,
            role: 'assistant',
            type: 'error',
            content: 'Sorry, I failed to check the novelty. Please try again.'
        }));
    } finally {
        setIsLoading(false);
    }
  }, [apiKey, activeTitle, analysis]);

  const handleRefineTitle = useCallback(async (suggestion: string) => {
    if (!apiKey || !activeTitle) return;
    setIsLoading(true);
    // Disable actions on the previous message
    setMessages(prev => prev.map(m => ({...m, actions: undefined})));

    setMessages(prev => [
        ...prev,
        { id: `msg-${Date.now()}`, role: 'user', type: 'refinement', content: `Refine the title using the suggestion: "${suggestion}"`},
        { id: `msg-${Date.now()}-loading`, role: 'assistant', type: 'title', content: '' }
    ]);
    
    try {
        const result = await refineTitle({ originalTitle: activeTitle, suggestion, apiKey });
        setActiveTitle(result.refinedTitle);
        setMessages(prev => prev.slice(0, -1).concat({
            id: `msg-${Date.now()}`,
            role: 'assistant',
            type: 'title',
            content: result.refinedTitle,
            actions: { type: 'check-novelty' }
        }));
    } catch (e) {
        setMessages(prev => prev.slice(0, -1).concat({
            id: `msg-${Date.now()}`,
            role: 'assistant',
            type: 'error',
            content: 'Sorry, I failed to refine the title. Please try again.'
        }));
    } finally {
        setIsLoading(false);
    }
  }, [apiKey, activeTitle]);

  const handleTopicsChanged = (topics: string[]) => {
    // This function can be used if TopicSelector needs to report back changes
    // for other purposes, but for generation it has its own button.
  }

  return (
    <>
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-6">
          {messages.map((message) => (
            <div key={message.id}>
              <div className={cn('flex items-start gap-4', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback><Sparkles /></AvatarFallback>
                  </Avatar>
                )}
                <div className={cn("max-w-xl rounded-lg p-3 text-sm", message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                  {message.type === 'novelty' && typeof message.content === 'object' ? (
                    <NoveltyResultCard result={message.content} />
                  ) : message.content === '' ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <p>{message.content as string}</p>
                  )}
                </div>
              </div>
              {message.actions && !isLoading && (
                <div className="flex justify-start gap-2 ml-12 mt-2 flex-wrap">
                  {message.actions.type === 'check-novelty' && (
                    <Button size="sm" onClick={handleCheckNovelty}>
                      <SearchCheck className="mr-2 h-4 w-4" /> Check Novelty
                    </Button>
                  )}
                  {message.actions.type === 'refine' && (
                    <div className="flex flex-col gap-2 items-start">
                      <p className="text-sm font-medium">Suggestions to improve:</p>
                      {message.actions.suggestions.map((s, i) => (
                        <Button key={i} size="sm" variant="outline" onClick={() => handleRefineTitle(s)} className="h-auto text-left py-1.5 whitespace-normal">
                          {s}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t bg-background">
        {messages.length === 0 ? (
          <TopicSelector availableCategories={analysis.categories} onGenerate={handleGenerateTitle} isLoading={isLoading} onTopicsChange={handleTopicsChanged}/>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            {isLoading ? 'Thinking...' : 'Interact with the suggestions above or restart the conversation.'}
          </p>
        )}
      </div>
    </>
  );
}
