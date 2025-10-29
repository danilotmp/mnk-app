/**
 * Exportar todas las traducciones
 */
import { Language, Translations } from '../types';
import { en } from './en';
import { es } from './es';

// Mapa de todas las traducciones
export const translations: Record<Language, Translations> = {
  es,
  en,
};

// Función para obtener traducciones por idioma
export function getTranslations(language: Language): Translations {
  return translations[language];
}

