/**
 * Tipos para el componente CurrencyInput
 */

import { ViewStyle } from 'react-native';

export interface CurrencyInputProps {
  /**
   * Valor del input
   */
  value: string;
  
  /**
   * Callback cuando cambia el valor
   */
  onChangeText: (value: string) => void;
  
  /**
   * Código de moneda (ej: "USD", "EUR")
   */
  currency?: string;
  
  /**
   * Placeholder del input
   */
  placeholder?: string;
  
  /**
   * Indica si el input está deshabilitado
   */
  disabled?: boolean;
  
  /**
   * Estilo personalizado para el contenedor
   */
  containerStyle?: ViewStyle;
  
  /**
   * Indica si el input tiene error
   */
  error?: boolean;
}
