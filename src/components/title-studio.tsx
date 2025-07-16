'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useHistory } from '@/hooks/use-history';
import { useApiKey } from '@/hooks/use-api-key';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { ArrowLeft, Loader2, MessageSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { TitleStudioChat } from './title-studio-chat';
import { TitleStudioBatch } from './title-studio-batch';
import { continueInChatGPT } from '@/lib/chatgpt';

export function TitleStudio() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { history, isLoading: isHistoryLoading } = useHistory();
  const { toast } = useToast();
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  const [analysisId] = useState(() => searchParams.get('analysisId'));
  const [analysis, setAnalysis] = useState<{ name: string; categories: string[]; titles: string[] } | null>(null);

  useEffect(() => {
    if (!analysisId || isHistoryLoading) return;
    const found = history.find((h) => h.id === analysisId);
    if (found) {
      const categories = Array.from(new Set(found.categorizedPapers.map((p) => p.category).filter(Boolean)));
      const titles = found.categorizedPapers.map((p) => p['Document Title']);
      setAnalysis({ name: found.name, categories, titles });
    } else {
      toast({ variant: 'destructive', title: 'Analysis not found' });
      router.push('/');
    }
  }, [analysisId, history, isHistoryLoading, router, toast]);

  if (isHistoryLoading || !analysis) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleContinueInChatGPT = () => {
    const context = `The user is working on generating research paper titles based on the dataset "${analysis.name}". Here is the current chat conversation for context:\n\n` +
      chatMessages
        .map(msg => {
            if (msg.role === 'user') return `USER: ${msg.content}\n`;
            if (msg.role === 'assistant' && typeof msg.content === 'string') return `ASSISTANT: ${msg.content}\n`;
            if (msg.type === 'novelty' && typeof msg.content === 'object') return `ASSISTANT (Novelty Analysis): Score ${msg.content.noveltyScore}. Reasoning: ${msg.content.overallReasoning}\n`
            return '';
        })
        .join('');
    
    continueInChatGPT(context);
    toast({
        title: "Copied to Clipboard",
        description: "Your conversation context has been copied. Paste it into ChatGPT to continue.",
    })
  }

  return (
    <div className="flex h-[calc(100vh-theme(height.16))] flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Title Studio</h1>
            <p className="text-sm text-muted-foreground">
              Using dataset: <span className="font-semibold">{analysis.name}</span>
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={handleContinueInChatGPT}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Continue in ChatGPT
        </Button>
      </div>
      <Tabs defaultValue="chat" className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chat">Chat Mode</TabsTrigger>
                <TabsTrigger value="batch">Batch Generate</TabsTrigger>
            </TabsList>
        </div>
        <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden m-0">
            <TitleStudioChat 
                analysis={analysis} 
                onMessagesChange={setChatMessages}
            />
        </TabsContent>
        <TabsContent value="batch" className="flex-1 overflow-hidden m-0">
            <TitleStudioBatch analysis={analysis} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
