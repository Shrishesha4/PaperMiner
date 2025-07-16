'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { type Analysis } from '@/types';
import { useToast } from './use-toast';

interface HistoryContextType {
  history: Analysis[];
  selectedAnalysis: Analysis | null;
  addAnalysis: (newAnalysisData: Omit<Analysis, 'id' | 'date'>) => void;
  selectAnalysis: (id: string | null) => void;
  removeAnalysis: (id: string) => void;
  clearHistory: () => void;
  isLoading: boolean;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

const HISTORY_STORAGE_KEY = 'paperminer_history';

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [history, setHistory] = useState<Analysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load history from localStorage on initial mount
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory) as Analysis[];
        setHistory(parsedHistory);
        // Automatically select the most recent analysis
        if (parsedHistory.length > 0) {
            setSelectedAnalysis(parsedHistory[0]);
        }
      }
    } catch (error) {
      console.error("Could not load history from localStorage", error);
      toast({
        variant: 'destructive',
        title: 'Load Error',
        description: 'Could not load analysis history.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Persist history to localStorage whenever it changes
  useEffect(() => {
    if (isLoading) return; // Don't save during initial load
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error("Could not save history to localStorage", error);
      toast({
        variant: 'destructive',
        title: 'Save Error',
        description: 'Could not save analysis history.',
      });
    }
  }, [history, isLoading, toast]);

  const addAnalysis = useCallback((newAnalysisData: Omit<Analysis, 'id' | 'date'>) => {
    const newAnalysis: Analysis = {
      ...newAnalysisData,
      id: `analysis-${Date.now()}-${Math.random()}`,
      date: new Date().toISOString(),
    };
    
    // Prepend new analysis to keep history sorted by most recent
    const updatedHistory = [newAnalysis, ...history];
    setHistory(updatedHistory);
    setSelectedAnalysis(newAnalysis); // Automatically select the new analysis
    toast({
        title: "Analysis Saved",
        description: `"${newAnalysis.name}" has been added to your history.`,
    })
  }, [history, toast]);

  const selectAnalysis = useCallback((id: string | null) => {
    if (id === null) {
        setSelectedAnalysis(null);
        return;
    }
    const analysisToSelect = history.find(item => item.id === id);
    setSelectedAnalysis(analysisToSelect || null);
  }, [history]);
  
  const removeAnalysis = useCallback((id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    // If the removed analysis was the selected one, clear selection
    if (selectedAnalysis?.id === id) {
        // Select the next available analysis, or null if history is empty
        const currentHistory = history.filter(item => item.id !== id);
        setSelectedAnalysis(currentHistory.length > 0 ? currentHistory[0] : null);
    }
    toast({
        title: "Analysis Removed",
        description: `The selected analysis has been removed from your history.`,
    })
  }, [selectedAnalysis, history, toast]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setSelectedAnalysis(null);
    toast({
        title: "History Cleared",
        description: "All analysis history has been removed.",
    })
  }, [toast]);

  return (
    <HistoryContext.Provider value={{ history, selectedAnalysis, addAnalysis, selectAnalysis, removeAnalysis, clearHistory, isLoading }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
}
