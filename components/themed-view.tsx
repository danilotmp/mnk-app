import { useTheme } from '@/hooks/use-theme';
import { View, type ViewProps } from 'react-native';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'background' | 'surface' | 'surfaceVariant' | 'primary' | 'secondary' | 'accent' | 'transparent';
};

export function ThemedView({ 
  style, 
  lightColor, 
  darkColor, 
  variant = 'background',
  ...otherProps 
}: ThemedViewProps) {
  const { colors } = useTheme();
  
  // Determinar el color de fondo basado en la variante
  const getBackgroundColor = () => {
    if (lightColor || darkColor) {
      return lightColor || darkColor;
    }
    
    switch (variant) {
      case 'surface':
        return colors.surface;
      case 'surfaceVariant':
        return colors.surfaceVariant;
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'accent':
        return colors.accent;
      case 'transparent':
        return 'transparent';
      default:
        return colors.background;
    }
  };

  const backgroundColor = getBackgroundColor();

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
