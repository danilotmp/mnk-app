import { useTheme } from '@/hooks/use-theme';
import React from 'react';
import { SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from './logo';
import { ThemedText } from './themed-text';

interface HeaderProps {
  title?: string;
  showLogo?: boolean;
  children?: React.ReactNode;
  inline?: boolean; // Nuevo: para usar en header unificado
  logoSize?: 'small' | 'medium' | 'large'; // Nuevo: tamaño del logo
  onTitlePress?: () => void; // Callback cuando se hace click en el título
  titleClickable?: boolean; // Si el título es clickeable
  onTitleLayout?: (width: number, x: number) => void; // Callback para obtener el ancho y posición X del título
  renderDropdown?: React.ReactNode; // Dropdown a renderizar dentro del contenedor del título
}

export function Header({ title, showLogo = true, children, inline = false, logoSize = 'medium', onTitlePress, titleClickable = false, onTitleLayout, renderDropdown }: HeaderProps) {
  const { colors, spacing, shadows } = useTheme();

  // Versión inline: sin SafeAreaView, sin padding, sin borde (para header unificado)
  if (inline) {
    return (
      <View style={styles.inlineContent}>
        {showLogo && <Logo size={logoSize} />}
        {title && (
          <View style={{ position: 'relative' }}>
            {titleClickable && onTitlePress ? (
              <TouchableOpacity 
                onPress={onTitlePress} 
                activeOpacity={0.7}
                style={styles.clickableTitleContainer}
                onLayout={(event) => {
                  const { width, x } = event.nativeEvent.layout;
                  onTitleLayout?.(width, x);
                }}
              >
                <ThemedText 
                  type={logoSize === 'small' ? 'body1' : 'subtitle'} 
                  style={[styles.inlineTitle, { color: colors.text }]}
                >
                  {title}
                </ThemedText>
                <Ionicons 
                  name="chevron-down" 
                  size={16} 
                  color={colors.text} 
                  style={styles.dropdownIcon}
                />
              </TouchableOpacity>
            ) : (
              <ThemedText 
                type={logoSize === 'small' ? 'body1' : 'subtitle'} 
                style={[styles.inlineTitle, { color: colors.text }]}
              >
                {title}
              </ThemedText>
            )}
            {renderDropdown}
          </View>
        )}
      </View>
    );
  }

  // Versión completa: con SafeAreaView, padding y borde (original)
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
  // Estilos para versión inline
  inlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineTitle: {
    marginLeft: 4,
  },
  clickableTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dropdownIcon: {
    marginLeft: 2,
  },
});
