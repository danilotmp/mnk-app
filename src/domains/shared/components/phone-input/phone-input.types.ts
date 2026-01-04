/**
 * Tipos para el componente PhoneInput
 */

import { ViewStyle } from 'react-native';

export interface PhoneInputProps {
  /**
   * Valor del input
   */
  value: string;
  
  /**
   * Callback cuando cambia el valor
   */
  onChangeText: (text: string) => void;
  
  /**
   * Placeholder del input
   */
  placeholder?: string;
  
  /**
   * Si hay error
   */
  error?: boolean;
  
  /**
   * Mensaje de error
   */
  errorMessage?: string;
  
  /**
   * Si el input está deshabilitado
   */
  disabled?: boolean;
  
  /**
   * Si el campo es requerido
   */
  required?: boolean;
  
  /**
   * Estilos personalizados para el contenedor
   */
  containerStyle?: ViewStyle | ViewStyle[];
  
  /**
   * Estilos personalizados para el input
   */
  inputStyle?: ViewStyle | ViewStyle[];
  
  /**
   * Callback cuando el input obtiene foco
   */
  onFocus?: () => void;
  
  /**
   * Callback cuando el input pierde foco
   */
  onBlur?: () => void;
  
  /**
   * Tipo de tecla de retorno
   */
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  
  /**
   * Callback cuando se presiona la tecla de retorno
   */
  onSubmitEditing?: () => void;
}
