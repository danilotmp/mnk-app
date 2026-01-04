/**
 * Tipos para el componente DatePicker
 */

export interface DatePickerProps {
  /**
   * Valor de la fecha en formato ISO (YYYY-MM-DD)
   */
  value?: string | null;
  
  /**
   * Callback cuando cambia la fecha
   * Recibe la fecha en formato ISO (YYYY-MM-DD)
   */
  onChange: (date: string | null) => void;
  
  /**
   * Formato de fecha para mostrar (ej: 'DD/MM/YYYY', 'MM/DD/YYYY')
   * Por defecto usa el formato de la empresa
   */
  displayFormat?: string;
  
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
   * Fecha mínima permitida (formato ISO: YYYY-MM-DD)
   */
  minDate?: string;
  
  /**
   * Fecha máxima permitida (formato ISO: YYYY-MM-DD)
   */
  maxDate?: string;
  
  /**
   * Estilo personalizado para el contenedor
   */
  style?: any;
}
