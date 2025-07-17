
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface ApiKeyContextType {
  apiKeys: string[];
  setApiKeys: (keys: string[]) => void;
  isApiKeySet: boolean;
  getNextApiKey: () => string | null;
  termsAccepted: boolean;
  acceptTerms: () => void;
  themeToastShown: boolean;
  setThemeToastShown: () => void;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

const API_KEY_STORAGE_KEY = 'gemini_api_keys';
const TERMS_ACCEPTED_KEY = 'paperminer_terms_accepted';
const THEME_TOAST_SHOWN_KEY = 'paperminer_theme_toast_shown';

export function ApiKeyProvider({ children }: { children: React.ReactNode }) {
  const [apiKeys, setApiKeysState] = useState<string[]>([]);
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [termsAccepted, setTermsAcceptedState] = useState(false);
  const [themeToastShown, setThemeToastShownState] = useState(false);
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
      
      const storedTerms = localStorage.getItem(TERMS_ACCEPTED_KEY);
      if (storedTerms === 'true') {
        setTermsAcceptedState(true);
      }
      
      const storedThemeToast = localStorage.getItem(THEME_TOAST_SHOWN_KEY);
      if (storedThemeToast === 'true') {
        setThemeToastShownState(true);
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
  
  const acceptTerms = useCallback(() => {
    setTermsAcceptedState(true);
    try {
        localStorage.setItem(TERMS_ACCEPTED_KEY, 'true');
    } catch (error) {
        console.error("Could not save terms acceptance to localStorage", error);
    }
  }, []);
  
  const setThemeToastShown = useCallback(() => {
    setThemeToastShownState(true);
    try {
        localStorage.setItem(THEME_TOAST_SHOWN_KEY, 'true');
    } catch (error) {
        console.error("Could not save theme toast status to localStorage", error);
    }
  }, []);

  // Only render children when the key has been loaded from localStorage
  if (!isLoaded) {
    return null; // Or a loading spinner
  }

  const value = { apiKeys, setApiKeys, isApiKeySet, getNextApiKey, termsAccepted, acceptTerms, themeToastShown, setThemeToastShown };

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
