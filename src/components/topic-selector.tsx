
'use client';

import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Plus, X } from 'lucide-react';

interface TopicSelectorProps {
  topics: string[];
  onAddTopic: (topic: string) => void;
  onRemoveTopic: (topic: string) => void;
  onClearTopics: () => void;
  isLoading: boolean;
}

export function TopicSelector({ topics, onAddTopic, onRemoveTopic, onClearTopics, isLoading }: TopicSelectorProps) {
  const [currentTopic, setCurrentTopic] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleManualAdd = () => {
    onAddTopic(currentTopic);
    setCurrentTopic('');
  };

  const handleTopicInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleManualAdd();
    }
  };
  
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
      
      <div className="min-h-[60px] p-2 bg-muted/50 rounded-md">
        <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-muted-foreground">Selected Topics:</h4>
            {topics.length > 0 && (
                <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs text-muted-foreground"
                    onClick={onClearTopics}
                    disabled={isLoading}
                >
                    Clear all
                </Button>
            )}
        </div>
        {topics.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {topics.map(topic => (
              <Badge key={topic} variant="secondary" className="flex items-center gap-1 text-sm">
                {topic}
                <button
                  onClick={() => onRemoveTopic(topic)}
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
    </div>
  );
}
