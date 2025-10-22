import { useTheme } from '@/hooks/use-theme';
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { Logo } from './logo';
import { ThemedText } from './themed-text';

interface HeaderProps {
  title?: string;
  showLogo?: boolean;
  children?: React.ReactNode;
}

export function Header({ title, showLogo = true, children }: HeaderProps) {
  const { colors, spacing, shadows } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background, ...shadows.sm }]}>
        <View style={styles.content}>
          {showLogo && <Logo size="medium" />}
          {title && (
            <ThemedText type="title" style={[styles.title, { color: colors.text }]}>
              {title}
            </ThemedText>
          )}
          {children && <View style={styles.children}>{children}</View>}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    zIndex: 1000,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    marginLeft: 12,
  },
  children: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
