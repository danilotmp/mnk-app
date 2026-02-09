/**
 * Helpers para transformar datos de catálogos a formatos usados en la UI
 */

import { SelectOption } from '@/components/ui/select';
import { PaymentInstructionType, PaymentMethodType, RecommendationType } from '@/src/domains/commercial/types';
import { Ionicons } from '@expo/vector-icons';
import { CatalogEntry } from '../types';

/**
 * Transforma detalles de catálogo a SelectOption[] (opciones simples)
 */
export function catalogDetailsToSelectOptions(details: CatalogEntry[]): SelectOption[] {
  return catalogDetailsToSimpleOptions(details);
}

/**
 * Transforma detalles de catálogo a opciones con descripción
 */
export function catalogDetailsToOptionsWithDescription(
  details: CatalogEntry[]
): Array<{ value: string; label: string; description?: string }> {
  return details
    .filter(entry => entry.status === 1)
    .map(entry => ({
      value: entry.code.toLowerCase(),
      label: entry.name,
      description: entry.description || undefined,
    }));
}

/**
 * Transforma detalles de catálogo a opciones de métodos de pago
 * Incluye icono desde metadata
 */
export function catalogDetailsToPaymentMethodOptions(
  details: CatalogEntry[]
): Array<{ value: PaymentMethodType; label: string; icon: keyof typeof Ionicons.glyphMap }> {
  return details
    .filter(entry => entry.status === 1)
    .map(entry => {
      // Los códigos vienen en mayúsculas (CASH, TRANSFER, etc.), convertir a lowercase
      const code = entry.code.toLowerCase() as PaymentMethodType;
      const icon = (entry.metadata?.icon || 'ellipse-outline') as keyof typeof Ionicons.glyphMap;
      
      return {
        value: code,
        label: entry.name,
        icon,
      };
    });
}

/**
 * Transforma detalles de catálogo a opciones de tipos de instrucción
 */
export function catalogDetailsToInstructionTypeOptions(
  details: CatalogEntry[]
): Array<{ value: PaymentInstructionType; label: string; description: string }> {
  return details
    .filter(entry => entry.status === 1)
    .map(entry => ({
      value: entry.code.toLowerCase() as PaymentInstructionType,
      label: entry.name,
      description: entry.description || '',
    }));
}

/**
 * Transforma detalles de catálogo a opciones de tipos de recomendación
 * Incluye icono desde metadata
 */
export function catalogDetailsToRecommendationTypeOptions(
  details: CatalogEntry[]
): Array<{ value: RecommendationType; label: string; description: string; icon: keyof typeof Ionicons.glyphMap }> {
  return details
    .filter(entry => entry.status === 1)
    .map(entry => {
      const code = entry.code.toLowerCase() as RecommendationType;
      const icon = (entry.metadata?.icon || 'ellipse-outline') as keyof typeof Ionicons.glyphMap;
      
      return {
        value: code,
        label: entry.name,
        description: entry.description || '',
        icon,
      };
    });
}

/**
 * Transforma detalles de catálogo a opciones simples (value/label)
 */
export function catalogDetailsToSimpleOptions(
  details: CatalogEntry[]
): Array<{ value: string; label: string }> {
  return details
    .filter(entry => entry.status === 1)
    .map(entry => ({
      value: entry.code.toLowerCase(),
      label: entry.name,
    }));
}


