import { useTheme } from '@/hooks/use-theme';
import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export function Logo({ size = 'medium', style }: LogoProps) {
  const { spacing } = useTheme();

  const logoSize = useMemo(() => {
    switch (size) {
      case 'small':
        return { width: 32, height: 32 }; // Reducido de 40x40 a 32x32 para mejor presentación en header
      case 'large':
        return { width: 80, height: 80 };
      default:
        return { width: 60, height: 60 };
    }
  }, [size]);

  return (
    <View style={[styles.container, { marginRight: spacing.md }, style]}>
      <Image
        source={require('@/assets/images/icon.png')}
        style={[styles.logo, logoSize]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    borderRadius: 8,
  },
});
