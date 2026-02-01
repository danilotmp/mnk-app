/**
 * Pantalla Pública de Productos/Funcionalidades del Sistema
 * Muestra todos los productos disponibles (Chat IA, etc.) y redirige inteligentemente
 * según el estado del usuario (logueado, empresa, etc.)
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { DynamicIcon } from '@/src/domains/shared/components';
import { useCompany } from '@/src/domains/shared';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface ProductCard {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  enabled: boolean;
  image?: string; // URL o path de imagen
}

export function CapabilitiesScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { isMobile, width } = useResponsive();
  const router = useRouter();
  const alert = useAlert();
  const { company, user, branch } = useCompany();

  // Productos/Funcionalidades disponibles del sistema
  const products: ProductCard[] = [
    {
      id: 'chat-ia',
      title: 'Chat IA',
      description: 'Asistente inteligente que interactúa con tus clientes por WhatsApp. Responde preguntas, brinda información sobre tu negocio, precios, métodos de pago y ayuda con recomendaciones personalizadas.',
      icon: 'chatbubbles-outline',
      enabled: true,
      image: 'https://img.freepik.com/vector-premium/inteligencia-artificial-telefono-inteligente-bot-chat-linea-movil-robot-asistente-correspondencia_178863-2199.jpg?w=360',
    },
    // Futuros productos se agregarán aquí
    // {
    //   id: 'inventory',
    //   title: 'Inventario',
    //   description: 'Gestiona productos, stock y proveedores',
    //   icon: 'cube-outline',
    //   enabled: false,
    // },
  ];

  /**
   * Detecta si la empresa actual es "Perfil de Invitado" o una empresa real
   * Lógica: Si el código o nombre contiene "GUEST", "INVITADO", o es muy genérico
   */
  const isGuestCompany = (): boolean => {
    if (!company) return true;
    
    const code = (company.code || '').toUpperCase();
    const name = (company.name || '').toUpperCase();
    
    return (
      code.includes('GUEST') ||
      code.includes('INVITADO') ||
      name.includes('GUEST') ||
      name.includes('INVITADO') ||
      code === 'DEFAULT' ||
      name === 'EMPRESA POR DEFECTO'
    );
  };

  /**
   * Detecta si el usuario necesita crear empresa/sucursal (Capa 0)
   */
  const needsCompanySetup = (): boolean => {
    // Si no está logueado, necesita crear empresa
    if (!user) return true;
    
    // Si no tiene empresa, necesita crear
    if (!company) return true;
    
    // Si tiene empresa pero es de invitado, necesita crear empresa real
    if (isGuestCompany()) return true;
    
    // Si tiene empresa pero no tiene sucursal, necesita crear sucursal
    if (!branch) return true;
    
    return false;
  };

  /**
   * Maneja el click en un producto
   * Redirige inteligentemente según el estado del usuario
   */
  const handleProductPress = (product: ProductCard) => {
    if (!product.enabled) return;

    // Si no está logueado → Login primero, luego redirigir al wizard
    if (!user) {
      router.push('/auth/login?redirect=' + encodeURIComponent(`/commercial/setup?product=${product.id}`));
      return;
    }

    // Si necesita setup de empresa (Capa 0) → Wizard con Capa 0
    if (needsCompanySetup()) {
      // Redirigir al wizard que iniciará en Capa 0
      router.push(`/commercial/setup?product=${product.id}&layer=0`);
      return;
    }

    // Si tiene empresa real y sucursal → Directo a Capa 1 del wizard
    router.push(`/commercial/setup?product=${product.id}&layer=institutional`);
  };

  /**
   * Calcula el estilo dinámico para el grid de productos
   * Ajusta el número de columnas según el ancho de la pantalla
   */
  const createProductsGridStyle = () => {
    return {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      justifyContent: 'center' as const,
      gap: 16,
    };
  };

  /**
   * Calcula el ancho dinámico de cada tarjeta de producto
   * Mobile: Ancho fijo de 300px centrado
   * Tablet: 2 columnas (48% cada una)
   * Desktop pequeño: 3 columnas (31% cada una)
   * Desktop grande: 4 columnas (23% cada una)
   */
  const createProductCardStyle = (screenWidth: number, isMobileDevice: boolean) => {
    if (isMobileDevice || screenWidth < 600) {
      // Mobile: Ancho fijo de 300px
      return { width: 300, maxWidth: 300 };
    } else if (screenWidth < 900) {
      // Tablet: 2 columnas (48% para dejar espacio al gap)
      return { width: '48%' };
    } else if (screenWidth < 1200) {
      // Desktop pequeño: 3 columnas (31% para dejar espacio al gap)
      return { width: '31%' };
    } else {
      // Desktop grande: 4 columnas (23% para dejar espacio al gap)
      return { width: '23%' };
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, isMobile && styles.scrollContentMobile]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* Header */}
          <View style={[styles.header, isMobile && styles.headerMobile]}>
            <View style={styles.titleRow}>
              <DynamicIcon name="AntDesign:product" size={32} color={colors.primary} style={styles.titleIcon} />
              <ThemedText type="h1" style={styles.title}>
                Productos del Sistema
              </ThemedText>
            </View>
            <ThemedText type="body1" style={[styles.subtitle, { color: colors.textSecondary }]}>
              Activa y configura las funcionalidades disponibles para tu negocio
            </ThemedText>
          </View>

          {/* Cards de Productos */}
          <View style={[styles.productsGrid, isMobile && styles.productsGridMobile, createProductsGridStyle()]}>
          {products.map((product) => (
            <TouchableOpacity
              key={product.id}
              onPress={() => handleProductPress(product)}
              disabled={!product.enabled}
              activeOpacity={0.7}
            >
              <Card 
                variant="elevated" 
                style={[
                  styles.productCard,
                  createProductCardStyle(width, isMobile),
                  isMobile && styles.productCardMobile,
                  !product.enabled && styles.productCardDisabled
                ]}
              >
                {/* Imagen o Icono */}
                <View style={[styles.cardImageContainer, isMobile && styles.cardImageContainerMobile]}>
                  {product.image ? (
                    <Image 
                      source={{ uri: product.image }} 
                      style={styles.cardImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                      <Ionicons 
                        name={product.icon} 
                        size={isMobile ? 40 : 48} 
                        color={product.enabled ? colors.primary : colors.textSecondary} 
                      />
                    </View>
                  )}
                </View>

                {/* Contenido */}
                <View style={styles.cardContent}>
                  <ThemedText type="h4" style={[styles.cardTitle, isMobile && styles.cardTitleMobile]}>
                    {product.title}
                  </ThemedText>
                  <ThemedText 
                    type="body2" 
                    style={[styles.cardDescription, { color: colors.textSecondary }, isMobile && styles.cardDescriptionMobile]}
                  >
                    {product.description}
                  </ThemedText>

                  {/* Badge de Estado */}
                  <View style={styles.cardFooter}>
                    {product.enabled ? (
                      <View style={[styles.badge, { backgroundColor: '#10b981' + '20' }]}>
                        <ThemedText type="caption" style={{ color: '#10b981', fontWeight: '600' }}>
                          Disponible
                        </ThemedText>
                      </View>
                    ) : (
                      <View style={[styles.badge, { backgroundColor: colors.textSecondary + '20' }]}>
                        <ThemedText type="caption" style={{ color: colors.textSecondary, fontWeight: '600' }}>
                          Próximamente
                        </ThemedText>
                      </View>
                    )}
                    
                    <Ionicons 
                      name="chevron-forward" 
                      size={20} 
                      color={product.enabled ? colors.primary : colors.textSecondary} 
                    />
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 40,
    paddingTop: 48,
    paddingBottom: 32,
  },
  scrollContentMobile: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
  },
  contentWrapper: {
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: 24,
    gap: 8,
  },
  headerMobile: {
    marginBottom: 16,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleIcon: {
    flexShrink: 0,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    lineHeight: 20,
  },
  productsGrid: {
    gap: 16,
    marginBottom: 24,
  },
  productsGridMobile: {
    gap: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  productCard: {
    padding: 20,
    gap: 16,
  },
  productCardMobile: {
    padding: 12,
    gap: 10,
  },
  productCardDisabled: {
    opacity: 0.6,
  },
  cardImageContainer: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  cardImageContainerMobile: {
    height: 140,
    borderRadius: 10,
    marginBottom: 6,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  cardContent: {
    gap: 12,
  },
  cardTitle: {
    marginBottom: 4,
  },
  cardTitleMobile: {
    fontSize: 18,
    marginBottom: 4,
  },
  cardDescription: {
    lineHeight: 20,
    marginBottom: 8,
  },
  cardDescriptionMobile: {
    lineHeight: 18,
    fontSize: 14,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
