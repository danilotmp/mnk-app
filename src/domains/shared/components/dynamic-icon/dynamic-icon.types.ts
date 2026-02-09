/**
 * Tipos para el componente DynamicIcon
 */

import { StyleProp, TextStyle } from 'react-native';

export interface DynamicIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}
