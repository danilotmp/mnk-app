/**
 * Tipos para el componente IconInput
 */

export interface IconInputProps {
  /**
   * Valor del icono en formato "Familia:Nombre" o solo "Nombre"
   */
  value: string;
  
  /**
   * Callback cuando cambia el valor
   * Recibe el valor completo "Familia:Nombre"
   */
  onChange: (value: string) => void;
  
  /**
   * Placeholder del input
   */
  placeholder?: string;
  
  /**
   * Indica si el input está deshabilitado
   */
  disabled?: boolean;
  
  /**
   * Indica si el input tiene error
   */
  error?: boolean;
}
