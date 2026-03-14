/**
 * Tipos para el componente AttributesEditor
 * Editor genérico de pares clave-valor (atributos flexibles)
 */

export interface AttributesEditorProps {
  /** Valor actual: objeto de atributos o null */
  value: Record<string, unknown> | null;

  /** Callback cuando cambia el valor */
  onChange: (value: Record<string, unknown> | null) => void;

  /** Etiqueta del campo */
  label?: string;

  /** Placeholder cuando no hay atributos */
  placeholder?: string;

  /** Texto del botón agregar */
  addButtonLabel?: string;

  /** Placeholder para el input de clave */
  keyPlaceholder?: string;

  /** Placeholder para el input de valor */
  valuePlaceholder?: string;

  /** Si el control está deshabilitado */
  disabled?: boolean;

  /** Si hay error de validación */
  error?: boolean;
}

/** Tema para los estilos del AttributesEditor */
export interface AttributesEditorTheme {
  colors: {
    text: string;
    textSecondary: string;
    border: string;
    background: string;
    filterInputBackground: string;
    primary: string;
    error?: string;
  };
}
