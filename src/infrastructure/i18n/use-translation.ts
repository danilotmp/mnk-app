/**
 * Hook personalizado para usar traducciones
 * Proporciona acceso a las traducciones y funciones de interpolación
 */

import { useLanguage } from './language.context';
import { getTranslations } from './translations';

/**
 * Función para interpolar variables en strings
 * Ejemplo: interpolate("Hola {name}", { name: "Juan" }) => "Hola Juan"
 */
function interpolate(template: string, params: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = params[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Hook para acceder a traducciones
 * 
 * @example
 * const { t } = useTranslation();
 * <Text>{t.common.welcome}</Text>
 * 
 * @example Con interpolación
 * const { t, interpolate } = useTranslation();
 * <Text>{interpolate(t.pages.home.step1Description, { platform: 'F12' })}</Text>
 */
export function useTranslation() {
  const { language } = useLanguage();
  const translations = getTranslations(language);

  /**
   * Función helper para interpolar traducciones
   */
  const t = translations;

  return {
    t,
    language,
    interpolate,
  };
}

/**
 * Hook simplificado que retorna la función de traducción
 * Útil para casos donde solo necesitas traducciones simples
 */
export function useT() {
  const { language } = useLanguage();
  return getTranslations(language);
}

