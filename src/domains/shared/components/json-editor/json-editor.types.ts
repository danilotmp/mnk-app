/**
 * Tipos para el componente JsonEditor
 */

export interface JsonEditorProps {
  /** Etiqueta del campo */
  label?: string;
  /** Valor actual (objeto o null) */
  value: Record<string, unknown> | null | undefined;
  /** Callback cuando cambia el valor */
  onChange: (value: Record<string, unknown> | null) => void;
  /** Altura mínima del editor */
  minHeight?: number;
  /** Si el control está deshabilitado */
  disabled?: boolean;
  /** Placeholder cuando está vacío */
  placeholder?: string;
}
