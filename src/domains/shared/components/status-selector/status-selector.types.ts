/**
 * Tipos para el componente StatusSelector
 */

import { ViewStyle } from 'react-native';

export interface StatusOption {
  value: number;
  label: string;
  color: string; // Color de fondo cuando está seleccionado
}

export interface StatusSelectorProps {
  /**
   * Valor actual seleccionado
   */
  value: number;

  /**
   * Callback cuando cambia el valor
   */
  onChange: (value: number) => void;

  /**
   * Opciones de estado disponibles
   * Por defecto incluye Activo (1), Inactivo (0), Pendiente (2), Suspendido (3)
   */
  options?: StatusOption[];

  /**
   * Si se muestra solo Activo e Inactivo (para roles)
   */
  simple?: boolean;

  /**
   * Label del campo (opcional)
   */
  label?: string;

  /**
   * Si el campo es requerido
   */
  required?: boolean;

  /**
   * Si el selector está deshabilitado
   */
  disabled?: boolean;

  /**
   * Estilo personalizado para el contenedor
   */
  containerStyle?: ViewStyle | ViewStyle[];

  /**
   * Estilo personalizado para el grupo de opciones
   */
  optionsContainerStyle?: ViewStyle | ViewStyle[];
}
