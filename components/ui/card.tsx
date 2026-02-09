import { useTheme } from '@/hooks/use-theme';
import React from 'react';
import { View, ViewStyle } from 'react-native';

type CardVariant = 'elevated' | 'outlined' | 'filled' | 'flat';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
}

export function Card({ 
  children, 
  variant = 'elevated', 
  style
}: CardProps) {
  const { colors, isDark } = useTheme();

  // Determinar colores según el tema y variante
  const getCardStyles = () => {
    const baseStyle = {
      padding: 16,
      borderRadius: 12,
    };

    switch (variant) {
      case 'elevated':
        // Transparente en ambos modos
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
      
      case 'outlined':
        // En modo oscuro: fondo más claro rgba(188,197,239,.2), en modo claro: fondo claro
        return {
          ...baseStyle,
          backgroundColor: isDark ? 'rgba(188,197,239,.2)' : '#f8f9fa', // rgb(248, 249, 250)
          borderWidth: 1,
          borderColor: isDark ? colors.border : colors.border,
        };
      
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: colors.surface,
          borderWidth: 0,
        };
      
      case 'flat':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
      
      default:
        return baseStyle;
    }
  };

  return (
    <View style={[getCardStyles(), style]}>
      {children}
    </View>
  );
}