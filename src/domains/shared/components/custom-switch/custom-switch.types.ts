/**
 * Tipos del componente CustomSwitch
 */

export interface CustomSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
}
