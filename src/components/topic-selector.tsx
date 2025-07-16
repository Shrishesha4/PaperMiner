'use client';

import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Plus, Wand2, X, Loader2 } from 'lucide-react';

interface TopicSelectorProps {
  availableCategories: string[];
  onGenerate: (topics: string[]) => void;
  isLoading: boolean;
}

export function TopicSelector({ availableCategories, onGenerate, isLoading }: TopicSelectorProps) {
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
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    setTopics(topics.filter(topic => topic !== topicToRemove));
  };
  
  const handleGenerateClick = () => {
    if (topics.length > 0) {
        onGenerate(topics);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">
          Add topics or select from existing categories to generate a title.
        </h4>
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={currentTopic}
            onChange={(e) => setCurrentTopic(e.target.value)}
            onKeyDown={handleTopicInputKeyDown}
            placeholder="e.g., Machine Learning, Cybersecurity"
            disabled={isLoading}
          />
          <Button type="button" size="icon" onClick={handleManualAdd} disabled={isLoading}>
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add topic</span>
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Click to add from existing categories:</h4>
        <div className="flex flex-wrap gap-1">
          {availableCategories.filter(cat => !topics.includes(cat)).map(cat => (
            <Badge
              key={cat}
              variant="outline"
              onClick={() => handleAddTopic(cat)}
              className={`cursor-pointer hover:bg-primary/10 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </div>
      
      <div className="min-h-[60px] p-2 bg-muted/50 rounded-md">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Selected Topics:</h4>
        {topics.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {topics.map(topic => (
              <Badge key={topic} variant="secondary" className="flex items-center gap-1">
                {topic}
                <button
                  onClick={() => handleRemoveTopic(topic)}
                  className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                  disabled={isLoading}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No topics selected yet.</p>
        )}
      </div>

      <Button onClick={handleGenerateClick} disabled={isLoading || topics.length === 0}>
        {isLoading ? (
          <Loader2 className="mr-2 animate-spin" />
        ) : (
          <Wand2 className="mr-2" />
        )}
        Generate Title with Gemini
      </Button>
    </div>
  );
}
