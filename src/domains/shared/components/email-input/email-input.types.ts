/**
 * Tipos para el componente EmailInput
 */

import { ViewStyle } from 'react-native';

export interface EmailInputProps {
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
   * Indica si el input tiene error
   */
  error?: boolean;
  
  /**
   * Mensaje de error a mostrar
   */
  errorMessage?: string;
  
  /**
   * Indica si el input está deshabilitado
   */
  disabled?: boolean;
  
  /**
   * Indica si el campo es requerido
   */
  required?: boolean;
  
  /**
   * Si es true, valida automáticamente el formato del email
   * Por defecto: true
   */
  validate?: boolean;
  
  /**
   * Mensaje de error personalizado para email inválido
   */
  invalidEmailMessage?: string;
  
  /**
   * Estilo personalizado para el contenedor
   */
  containerStyle?: ViewStyle | ViewStyle[];
  
  /**
   * Estilo personalizado para el input
   */
  inputStyle?: ViewStyle | ViewStyle[];
  
  /**
   * Callback cuando el input recibe focus
   */
  onFocus?: () => void;
  
  /**
   * Callback cuando el input pierde focus
   */
  onBlur?: () => void;
  
  /**
   * Tipo de tecla de retorno
   */
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  
  /**
   * Callback cuando se presiona submit
   */
  onSubmitEditing?: () => void;
}
