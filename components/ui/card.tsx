import { Size } from '@/src/domains/shared/types';
import { useTheme } from '@/src/hooks/use-theme.hook';
import { getCardStyle } from '@/src/styles/components/card.styles';
import React from 'react';
import { View, ViewStyle } from 'react-native';

type CardVariant = 'elevated' | 'outlined' | 'filled' | 'flat';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
  padding?: Size;
  borderRadius?: Size;
}

export function Card({ 
  children, 
  variant = 'elevated', 
  style, 
  padding = 'md',
  borderRadius = 'lg'
}: CardProps) {
  const { theme } = useTheme();

  const cardStyle = getCardStyle(theme, variant, padding, borderRadius);

  return (
    <View style={[cardStyle, style]}>
      {children}
    </View>
  );
}
