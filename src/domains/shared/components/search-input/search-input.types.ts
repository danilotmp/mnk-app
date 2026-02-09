/**
 * Tipos para el componente SearchInput
 */

import { ViewStyle } from 'react-native';

export interface SearchInputProps {
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
   * Indica si el input está deshabilitado
   */
  disabled?: boolean;
  
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
  
  /**
   * Auto capitalize
   */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  
  /**
   * Auto correct
   */
  autoCorrect?: boolean;
  
  /**
   * Mostrar botón de limpiar cuando hay texto
   */
  showClearButton?: boolean;
}
