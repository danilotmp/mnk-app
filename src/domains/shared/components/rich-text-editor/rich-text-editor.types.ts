import { ViewStyle } from 'react-native';

export interface RichTextEditorProps {
  /**
   * Contenido HTML inicial o actual
   */
  value: string;
  
  /**
   * Callback cuando el contenido cambia
   */
  onChange: (value: string) => void;
  
  /**
   * Estilo para el contenedor del componente
   */
  style?: ViewStyle;
  
  /**
   * Título opcional para el editor
   */
  placeholder?: string;
  
  /**
   * Altura del editor
   * @default 400
   */
  height?: number | string;
  
  /**
   * Si el editor está en modo lectura
   * @default false
   */
  readOnly?: boolean;
}
