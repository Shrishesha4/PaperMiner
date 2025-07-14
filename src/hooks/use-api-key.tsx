'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface ApiKeyContextType {
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
  isApiKeySet: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

const API_KEY_STORAGE_KEY = 'gemini_api_key';

export function ApiKeyProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
      if (storedKey) {
        setApiKeyState(storedKey);
        setIsApiKeySet(true);
      }
    } catch (error) {
      console.error("Could not access localStorage", error);
    } finally {
        setIsLoaded(true);
    }
  }, []);

  const setApiKey = useCallback((key: string | null) => {
    setApiKeyState(key);
    if (key) {
      try {
        localStorage.setItem(API_KEY_STORAGE_KEY, key);
        setIsApiKeySet(true);
      } catch (error) {
        console.error("Could not access localStorage", error);
      }
    } else {
      try {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
        setIsApiKeySet(false);
      } catch (error) {
        console.error("Could not access localStorage", error);
      }
    }
  }, []);

  // Only render children when the key has been loaded from localStorage
  if (!isLoaded) {
    return null; // Or a loading spinner
  }

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, isApiKeySet }}>
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
}
