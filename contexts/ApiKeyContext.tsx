import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { validateApiKey } from '../services/geminiService';

type ApiKeyContextType = {
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
  isApiKeyValid: boolean;
  validationStatus: 'idle' | 'validating' | 'valid' | 'invalid';
  validateCurrentApiKey: () => Promise<void>;
};

export const ApiKeyContext = createContext<ApiKeyContextType>({
  apiKey: null,
  setApiKey: () => {},
  isApiKeyValid: false,
  validationStatus: 'idle',
  validateCurrentApiKey: async () => {},
});

export const useApiKey = () => useContext(ApiKeyContext);

export const ApiKeyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(() => localStorage.getItem('gemini-api-key'));
  const [isApiKeyValid, setIsApiKeyValid] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');

  const setApiKey = (key: string | null) => {
    if (key) {
      localStorage.setItem('gemini-api-key', key);
    } else {
      localStorage.removeItem('gemini-api-key');
    }
    setApiKeyState(key);
  };

  const validateCurrentApiKey = useCallback(async () => {
    if (!apiKey) {
      setValidationStatus('invalid');
      setIsApiKeyValid(false);
      return;
    }
    setValidationStatus('validating');
    const { isValid } = await validateApiKey(apiKey);
    if (isValid) {
      setValidationStatus('valid');
      setIsApiKeyValid(true);
    } else {
      setValidationStatus('invalid');
      setIsApiKeyValid(false);
    }
  }, [apiKey]);

  useEffect(() => {
    if (apiKey) {
      validateCurrentApiKey();
    } else {
      // No key, so it's invalid
      setIsApiKeyValid(false);
      setValidationStatus('invalid');
    }
  }, [apiKey, validateCurrentApiKey]);

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, isApiKeyValid, validationStatus, validateCurrentApiKey }}>
      {children}
    </ApiKeyContext.Provider>
  );
};