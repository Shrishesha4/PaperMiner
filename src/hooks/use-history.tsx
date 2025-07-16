
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { type Analysis } from '@/types';
import { useToast } from './use-toast';

interface HistoryContextType {
  history: Analysis[];
  selectedAnalysis: Analysis | null;
  addAnalysis: (newAnalysisData: Omit<Analysis, 'id' | 'date'>) => Analysis;
  updateAnalysis: (id: string, updates: Partial<Omit<Analysis, 'id' | 'date'>>) => void;
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
        // Sort by date descending to be sure
        parsedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setHistory(parsedHistory);
        if (parsedHistory.length > 0) {
            // By default, nothing is selected unless a URL param dictates it.
            // This simplifies logic in the app.
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
    if (newAnalysis.name !== 'From Scratch') {
        toast({
            title: "Analysis Saved",
            description: `"${newAnalysis.name}" has been added to your history.`,
        });
    }
    return newAnalysis;
  }, [history, toast]);

  const updateAnalysis = useCallback((id: string, updates: Partial<Omit<Analysis, 'id' | 'date'>>) => {
    let updatedAnalysis: Analysis | null = null;
    const newHistory = history.map(item => {
        if (item.id === id) {
            updatedAnalysis = { ...item, ...updates };
            return updatedAnalysis;
        }
        return item;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setHistory(newHistory);

    // If the updated analysis is the currently selected one, update that state too
    if (selectedAnalysis?.id === id && updatedAnalysis) {
        setSelectedAnalysis(updatedAnalysis);
    }
  }, [history, selectedAnalysis]);

  const selectAnalysis = useCallback((id: string | null) => {
    if (id === null) {
        setSelectedAnalysis(null);
        return;
    }
    const analysisToSelect = history.find(item => item.id === id);
    setSelectedAnalysis(analysisToSelect || null);
  }, [history]);
  
  const removeAnalysis = useCallback((id: string) => {
    const analysisToRemove = history.find(item => item.id === id);
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    
    // If the removed analysis was the selected one, clear selection
    if (selectedAnalysis?.id === id) {
        setSelectedAnalysis(updatedHistory.length > 0 ? updatedHistory[0] : null);
    }
    if (analysisToRemove) {
      toast({
          title: "Analysis Removed",
          description: `"${analysisToRemove.name}" has been removed from your history.`,
      });
    }
  }, [selectedAnalysis, history, toast]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setSelectedAnalysis(null);
    try {
        localStorage.removeItem(HISTORY_STORAGE_KEY);
        toast({
            title: "History Cleared",
            description: "All analysis history has been removed.",
        })
    } catch (error) {
        console.error("Could not clear history from localStorage", error);
    }
  }, [toast]);

  return (
    <HistoryContext.Provider value={{ history, selectedAnalysis, addAnalysis, updateAnalysis, selectAnalysis, removeAnalysis, clearHistory, isLoading }}>
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
