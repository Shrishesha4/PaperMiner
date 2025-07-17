
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { type Analysis } from '@/types';
import { useToast } from './use-toast';
import type { CategoryHierarchy } from '@/components/category-chart';

interface HistoryContextType {
  history: Analysis[];
  selectedAnalysis: Analysis | null;
  addAnalysis: (newAnalysisData: Omit<Analysis, 'id' | 'date'>) => Analysis;
  updateAnalysis: (id: string, updates: Partial<Analysis>) => void;
  selectAnalysis: (id: string | null) => void;
  removeAnalysis: (id: string) => void;
  removeDraft: (analysisId: string) => void;
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
      }
    } catch (error) {
      console.error("Could not load history from localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Persist history to localStorage whenever it changes
  useEffect(() => {
    if (isLoading) return; // Don't save during initial load
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error("Could not save history to localStorage", error);
    }
  }, [history, isLoading]);

  const addAnalysis = useCallback((newAnalysisData: Omit<Analysis, 'id' | 'date'>) => {
    const newAnalysis: Analysis = {
      ...newAnalysisData,
      id: `analysis-${Date.now()}-${Math.random()}`,
      date: new Date().toISOString(),
    };
    
    // Prepend new analysis to keep history sorted by most recent
    const newHistory = [newAnalysis, ...history];
    setHistory(newHistory);
    setSelectedAnalysis(newAnalysis); // Automatically select the new analysis
    
    // Only show toast for actual analysis, not scratchpads
    if (newAnalysis.name !== 'From Scratch' && !newAnalysis.name.startsWith('Scratchpad:')) {
        toast({
            title: "Analysis Saved",
            description: `"${newAnalysis.name}" has been added to your history.`,
        });
    }
    return newAnalysis;
  }, [history, toast]);

  const updateAnalysis = useCallback((id: string, updates: Partial<Analysis>) => {
    let updatedAnalysis: Analysis | undefined;
    const newHistory = history.map(item => {
        if (item.id === id) {
            updatedAnalysis = { ...item, ...updates };
            // If categoryHierarchy is explicitly set to undefined, remove it.
            if ('categoryHierarchy' in updates && updates.categoryHierarchy === undefined) {
                delete updatedAnalysis.categoryHierarchy;
            }
            return updatedAnalysis;
        }
        return item;
    });

    setHistory(newHistory);
    
    if (selectedAnalysis?.id === id && updatedAnalysis) {
        setSelectedAnalysis(updatedAnalysis);
    }
    
    // Only show toast for draft saving, not for other background updates.
    if (updates.draftedPaper) {
        toast({
            title: "Draft Saved",
            description: "Your paper draft has been saved to your history.",
        });
    }
  }, [history, selectedAnalysis, toast]);

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

  const removeDraft = useCallback((analysisId: string) => {
    let draftTitle = '';
    const newHistory = history.map(item => {
      if (item.id === analysisId) {
        draftTitle = item.draftedPaper?.title || '';
        const { draftedPaper, ...rest } = item;
        return rest;
      }
      return item;
    });

    setHistory(newHistory as Analysis[]); // Cast because we are removing an optional property

    toast({
      title: "Draft Removed",
      description: `The draft for "${draftTitle}" has been removed.`,
    });
  }, [history, toast]);

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
    <HistoryContext.Provider value={{ history, selectedAnalysis, addAnalysis, updateAnalysis, selectAnalysis, removeAnalysis, removeDraft, clearHistory, isLoading }}>
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
