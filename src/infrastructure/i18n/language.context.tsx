/**
 * Contexto de idioma para la aplicación
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from '../api/types';
import { getStorageAdapter } from '../api/storage.adapter';
import { API_CONFIG } from '../api/config';
import { ApiConfig } from '../api/config';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  availableLanguages: { code: Language; name: string; flag: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('es');
  const storage = getStorageAdapter();
  const config = ApiConfig.getInstance();

  // Cargar idioma guardado al iniciar
  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await storage.getItem(API_CONFIG.STORAGE_KEYS.LANGUAGE);
      if (savedLanguage && (savedLanguage === 'es' || savedLanguage === 'en')) {
        setLanguageState(savedLanguage as Language);
        config.setCurrentLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const setLanguage = async (newLanguage: Language) => {
    try {
      await storage.setItem(API_CONFIG.STORAGE_KEYS.LANGUAGE, newLanguage);
      setLanguageState(newLanguage);
      config.setCurrentLanguage(newLanguage);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const availableLanguages = [
    { code: 'es' as Language, name: 'Español', flag: '🇪🇸' },
    { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
  ];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, availableLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

