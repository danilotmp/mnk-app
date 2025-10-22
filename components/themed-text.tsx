import { useTheme } from '@/hooks/use-theme';
import { StyleSheet, Text, type TextProps } from 'react-native';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption' | 'button';
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'info';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  variant,
  ...rest
}: ThemedTextProps) {
  const { colors, typography } = useTheme();
  
  // Determinar el color basado en la variante
  const getColor = () => {
    if (lightColor || darkColor) {
      return lightColor || darkColor;
    }
    
    if (variant) {
      switch (variant) {
        case 'primary':
          return colors.primary;
        case 'secondary':
          return colors.secondary;
        case 'accent':
          return colors.accent;
        case 'success':
          return colors.success;
        case 'warning':
          return colors.warning;
        case 'error':
          return colors.error;
        case 'info':
          return colors.info;
        default:
          return colors.text;
      }
    }
    
    return colors.text;
  };

  const color = getColor();

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'h1' ? typography.h1 : undefined,
        type === 'h2' ? typography.h2 : undefined,
        type === 'h3' ? typography.h3 : undefined,
        type === 'h4' ? typography.h4 : undefined,
        type === 'h5' ? typography.h5 : undefined,
        type === 'h6' ? typography.h6 : undefined,
        type === 'body1' ? typography.body1 : undefined,
        type === 'body2' ? typography.body2 : undefined,
        type === 'caption' ? typography.caption : undefined,
        type === 'button' ? typography.button : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
