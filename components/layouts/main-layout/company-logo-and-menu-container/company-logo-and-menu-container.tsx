/**
 * Componente para el contenedor de logo/nombre y menú (solo Web Desktop)
 */

import { Logo } from '@/components/logo';
import { HorizontalMenu } from '@/components/navigation';
import { ThemedText } from '@/components/themed-text';
import { AppConfig } from '@/src/config';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, TouchableOpacity, View } from 'react-native';
import { createCompanyLogoAndMenuContainerStyles } from './company-logo-and-menu-container.styles';
import { CompanyLogoAndMenuContainerProps } from './company-logo-and-menu-container.types';

export function CompanyLogoAndMenuContainer({
  companyName,
  companySubtitle,
  companyNameClickable,
  onCompanyNamePress,
  menuItems,
  onMenuItemPress,
  titleWidth,
  onTitleLayout,
  showCompanyDropdown,
  canSwitchCompany,
  availableCompanies,
  onCompanySelect,
  colors,
}: CompanyLogoAndMenuContainerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const companyNameAnim = useRef(new Animated.Value(1)).current; // Inicia expandido (1)
  const styles = createCompanyLogoAndMenuContainerStyles(colors);

  // Usar las mismas variables de configuración del menú vertical
  const expandedWidth = AppConfig.navigation.verticalMenuExpandedWidth; // 280px
  const collapsedWidth = AppConfig.navigation.verticalMenuCollapsedWidth; // 48px
  const iconWidth = collapsedWidth - 16; // 32px
  const companyNameWidth = expandedWidth - iconWidth; // 248px

  useEffect(() => {
    Animated.timing(companyNameAnim, {
      toValue: isHovered ? 1 : 1, // Siempre expandido, pero mantenemos la animación por si acaso
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isHovered, companyNameAnim]);

  const handleLogoMouseEnter = () => {
    if (Platform.OS === 'web') {
      setIsHovered(true);
    }
  };

  const handleLogoMouseLeave = () => {
    if (Platform.OS === 'web') {
      setIsHovered(false);
    }
  };

  return (
    <>
      <View style={styles.container}>
        {/* Contenedor separado para Logo y Nombre de empresa - Alineado a la izquierda */}
        <View
          style={styles.logoAndNameContainer}
          // @ts-ignore - onMouseEnter/onMouseLeave solo existen en web
          onMouseEnter={handleLogoMouseEnter}
          // @ts-ignore
          onMouseLeave={handleLogoMouseLeave}
        >
          <View style={styles.iconContainer}>
            <Logo size="small" style={{ marginRight: 0 }} />
          </View>
          <Animated.View
            style={[
              styles.companyNameContainer,
              {
                opacity: companyNameAnim,
                marginLeft: companyNameAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0], // Sin margin adicional ya que está en el contenedor
                }),
              },
            ]}
          >
            {companyNameClickable ? (
              <TouchableOpacity
                onPress={onCompanyNamePress}
                activeOpacity={0.7}
                style={styles.companyNameClickable}
              >
                <ThemedText
                  type="subtitle"
                  style={[styles.companyNameText, { color: colors.text }]}
                  numberOfLines={1}
                  onLayout={(event) => {
                    const { width } = event.nativeEvent.layout;
                    onTitleLayout(width);
                  }}
                >
                  AIBox
                </ThemedText>
                {companySubtitle && (
                  <ThemedText
                    type="caption"
                    variant="secondary"
                    style={{ color: colors.textSecondary }}
                    numberOfLines={1}
                  >
                    {companySubtitle}
                  </ThemedText>
                )}
              </TouchableOpacity>
            ) : (
              <View>
                <ThemedText
                  type="subtitle"
                  style={[styles.companyNameText, { color: colors.text }]}
                  numberOfLines={1}
                  onLayout={(event) => {
                    const { width } = event.nativeEvent.layout;
                    onTitleLayout(width);
                  }}
                >
                  AIBox
                </ThemedText>
                {companySubtitle && (
                  <ThemedText
                    type="caption"
                    variant="secondary"
                    style={{ color: colors.textSecondary }}
                    numberOfLines={1}
                  >
                    {companySubtitle}
                  </ThemedText>
                )}
              </View>
            )}
          </Animated.View>
        </View>

        {/* Contenedor separado para el Menú Horizontal - Centrado */}
        <View style={styles.menuContainer}>
          <HorizontalMenu items={menuItems} onItemPress={onMenuItemPress} />
        </View>
      </View>

      {/* Dropdown de empresas (si aplica) - Posicionado debajo del header completo */}
      {showCompanyDropdown && canSwitchCompany && (
        <View style={[styles.dropdown, { backgroundColor: colors.background, borderColor: colors.border }]}>
          {/* Flecha superior del dropdown */}
          <View style={[styles.dropdownArrowOuter, { borderBottomColor: colors.border }]} />
          <View style={[styles.dropdownArrowInner, { borderBottomColor: colors.background }]} />
          {availableCompanies.map((companyInfo) => {
            return (
              <TouchableOpacity
                key={companyInfo.id}
                onPress={() => onCompanySelect(companyInfo)}
                style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
              >
                <ThemedText type="defaultSemiBold">{companyInfo.name}</ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </>
  );
}
