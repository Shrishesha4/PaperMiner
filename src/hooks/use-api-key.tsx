'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface ApiKeyContextType {
  apiKeys: string[];
  setApiKeys: (keys: string[]) => void;
  isApiKeySet: boolean;
  getNextApiKey: () => string | null;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

const API_KEY_STORAGE_KEY = 'gemini_api_keys'; // Changed key name

export function ApiKeyProvider({ children }: { children: React.ReactNode }) {
  const [apiKeys, setApiKeysState] = useState<string[]>([]);
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const currentIndex = useRef(0);

  useEffect(() => {
    try {
      const storedKeys = localStorage.getItem(API_KEY_STORAGE_KEY);
      if (storedKeys) {
        const parsedKeys = JSON.parse(storedKeys);
        if (Array.isArray(parsedKeys) && parsedKeys.length > 0) {
            setApiKeysState(parsedKeys);
            setIsApiKeySet(true);
        }
      }
    } catch (error) {
      console.error("Could not access localStorage", error);
    } finally {
        setIsLoaded(true);
    }
  }, []);

  const setApiKeys = useCallback((keys: string[]) => {
    setApiKeysState(keys);
    if (keys.length > 0) {
      try {
        localStorage.setItem(API_KEY_STORAGE_KEY, JSON.stringify(keys));
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

  const getNextApiKey = useCallback(() => {
    if (apiKeys.length === 0) {
      return null;
    }
    const key = apiKeys[currentIndex.current];
    currentIndex.current = (currentIndex.current + 1) % apiKeys.length;
    return key;
  }, [apiKeys]);

  // Only render children when the key has been loaded from localStorage
  if (!isLoaded) {
    return null; // Or a loading spinner
  }

  const value = { apiKeys, setApiKeys, isApiKeySet, getNextApiKey };

  return (
    <ApiKeyContext.Provider value={value}>
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
