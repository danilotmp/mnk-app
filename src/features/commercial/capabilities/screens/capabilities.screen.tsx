/**
 * Pantalla Pública de Productos/Funcionalidades del Sistema
 * Muestra todos los productos disponibles (Chat IA, etc.) y redirige inteligentemente
 * según el estado del usuario (logueado, empresa, etc.)
 */

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Card } from "@/components/ui/card";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/hooks/use-theme";
import { useCompany } from "@/src/domains/shared";
import { DynamicIcon } from "@/src/domains/shared/components";
import { useTranslation } from "@/src/infrastructure/i18n";
import { useAlert } from "@/src/infrastructure/messages/alert.service";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

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
      id: "chat-ia",
      title: "Chat IA",
      description:
        "Asistente inteligente que interactúa con tus clientes por WhatsApp. Responde preguntas, brinda información sobre tu negocio, precios, métodos de pago y ayuda con recomendaciones personalizadas.",
      icon: "chatbubbles-outline",
      enabled: true,
      image:
        "https://img.freepik.com/vector-premium/inteligencia-artificial-telefono-inteligente-bot-chat-linea-movil-robot-asistente-correspondencia_178863-2199.jpg?w=360",
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

    const code = (company.code || "").toUpperCase();
    const name = (company.name || "").toUpperCase();

    return (
      code.includes("GUEST") ||
      code.includes("INVITADO") ||
      name.includes("GUEST") ||
      name.includes("INVITADO") ||
      code === "DEFAULT" ||
      name === "EMPRESA POR DEFECTO"
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
      router.push(
        "/auth/login?redirect=" +
          encodeURIComponent(`/commercial/setup?product=${product.id}`),
      );
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
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      justifyContent: "center" as const,
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
  const createProductCardStyle = (
    screenWidth: number,
    isMobileDevice: boolean,
  ) => {
    if (isMobileDevice || screenWidth < 600) {
      // Mobile: Ancho fijo de 300px
      return { width: 300, maxWidth: 300 };
    } else if (screenWidth < 900) {
      // Tablet: 2 columnas (48% para dejar espacio al gap)
      return { width: "48%" };
    } else if (screenWidth < 1200) {
      // Desktop pequeño: 3 columnas (31% para dejar espacio al gap)
      return { width: "31%" };
    } else {
      // Desktop grande: 4 columnas (23% para dejar espacio al gap)
      return { width: "23%" };
    }
  };

  // Animaciones para la sección inferior: Flujos, Flexibilidad, Acoplamiento
  const flowAnim = useRef(new Animated.Value(0)).current;
  const flexAnim = useRef(new Animated.Value(0)).current;
  const coupleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const processDuration = 2400;
    const flowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flowAnim, {
          toValue: 1,
          duration: processDuration,
          useNativeDriver: true,
        }),
        Animated.timing(flowAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    const flexLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flexAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(flexAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    const coupleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(coupleAnim, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(coupleAnim, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ]),
    );
    flowLoop.start();
    flexLoop.start();
    coupleLoop.start();
    return () => {
      flowLoop.stop();
      flexLoop.stop();
      coupleLoop.stop();
    };
  }, [flowAnim, flexAnim, coupleAnim]);

  const processStep0 = flowAnim.interpolate({
    inputRange: [0, 0.15, 0.25, 0.45],
    outputRange: [0.4, 1, 1, 0.4],
  });
  const processStep1 = flowAnim.interpolate({
    inputRange: [0.25, 0.4, 0.5, 0.7],
    outputRange: [0.4, 1, 1, 0.4],
  });
  const processStep2 = flowAnim.interpolate({
    inputRange: [0.5, 0.65, 0.75, 0.95],
    outputRange: [0.4, 1, 1, 0.4],
  });
  const processStep3 = flowAnim.interpolate({
    inputRange: [0, 0.75, 0.9, 0.95, 1],
    outputRange: [0.4, 0.4, 1, 1, 0.4],
  });
  // Flexibilidad: onda que recorre 4 barras verticales
  const flexBar0 = flexAnim.interpolate({
    inputRange: [0, 0.15, 0.25, 0.45],
    outputRange: [0.7, 1.25, 1.25, 0.7],
  });
  const flexBar1 = flexAnim.interpolate({
    inputRange: [0.25, 0.4, 0.5, 0.7],
    outputRange: [0.7, 1.25, 1.25, 0.7],
  });
  const flexBar2 = flexAnim.interpolate({
    inputRange: [0.5, 0.65, 0.75, 0.95],
    outputRange: [0.7, 1.25, 1.25, 0.7],
  });
  const flexBar3 = flexAnim.interpolate({
    inputRange: [0, 0.75, 0.9, 1],
    outputRange: [0.7, 0.7, 1.25, 0.7],
  });
  // Acoplamiento: línea que se activa y dos nodos que pulsan al unísono
  const coupleLineGlow = coupleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.35, 1, 0.35],
  });
  const coupleNodeScale = coupleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.15, 1],
  });

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isMobile && styles.scrollContentMobile,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* Header */}
          <View style={[styles.header, isMobile && styles.headerMobile]}>
            <View style={styles.titleRow}>
              <DynamicIcon
                name="AntDesign:product"
                size={32}
                color={colors.primary}
                style={styles.titleIcon}
              />
              <ThemedText type="h1" style={[styles.title, isMobile && styles.titleMobile]}>
                Productos del Sistema
              </ThemedText>
            </View>
            <ThemedText
              type="body1"
              style={[styles.subtitle, { color: colors.textSecondary }]}
            >
              Activa y configura las funcionalidades disponibles para tu negocio
            </ThemedText>
          </View>

          {/* Cards de Productos */}
          <View
            style={[
              styles.productsGrid,
              isMobile && styles.productsGridMobile,
              createProductsGridStyle(),
            ]}
          >
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
                    !product.enabled && styles.productCardDisabled,
                  ]}
                >
                  {/* Imagen o Icono */}
                  <View
                    style={[
                      styles.cardImageContainer,
                      isMobile && styles.cardImageContainerMobile,
                    ]}
                  >
                    {product.image ? (
                      <Image
                        source={{ uri: product.image }}
                        style={styles.cardImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={[
                          styles.iconContainer,
                          { backgroundColor: colors.primary + "20" },
                        ]}
                      >
                        <Ionicons
                          name={product.icon}
                          size={isMobile ? 40 : 48}
                          color={
                            product.enabled
                              ? colors.primary
                              : colors.textSecondary
                          }
                        />
                      </View>
                    )}
                  </View>

                  {/* Contenido */}
                  <View style={styles.cardContent}>
                    <ThemedText
                      type="h4"
                      style={[
                        styles.cardTitle,
                        isMobile && styles.cardTitleMobile,
                      ]}
                    >
                      {product.title}
                    </ThemedText>
                    <ThemedText
                      type="body2"
                      style={[
                        styles.cardDescription,
                        { color: colors.textSecondary },
                        isMobile && styles.cardDescriptionMobile,
                      ]}
                    >
                      {product.description}
                    </ThemedText>

                    {/* Badge de Estado */}
                    <View style={styles.cardFooter}>
                      {product.enabled ? (
                        <View
                          style={[
                            styles.badge,
                            { backgroundColor: "#10b981" + "20" },
                          ]}
                        >
                          <ThemedText
                            type="caption"
                            style={{ color: "#10b981", fontWeight: "600" }}
                          >
                            Disponible
                          </ThemedText>
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.badge,
                            { backgroundColor: colors.textSecondary + "20" },
                          ]}
                        >
                          <ThemedText
                            type="caption"
                            style={{
                              color: colors.textSecondary,
                              fontWeight: "600",
                            }}
                          >
                            Próximamente
                          </ThemedText>
                        </View>
                      )}

                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={
                          product.enabled
                            ? colors.primary
                            : colors.textSecondary
                        }
                      />
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sección inferior animada: Flexibilidad, Acoplamiento, Procesos (flex wrap: web 1 fila, móvil 2+1) */}
          <View
            style={[
              styles.conceptsSection,
              isMobile && styles.conceptsSectionMobile,
              { borderTopColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.conceptsGrid,
                isMobile && styles.conceptsGridMobile,
              ]}
            >
              {/* Flexibilidad: onda que recorre barras verticales */}
              <View
                style={[
                  styles.conceptCard,
                  isMobile && styles.conceptCardMobile,
                  { borderColor: colors.border },
                ]}
              >
                <View style={styles.conceptVisual}>
                  <View style={styles.flexWaveRow}>
                    <Animated.View
                      style={[
                        styles.flexWaveBar,
                        { backgroundColor: colors.primary },
                        { transform: [{ scaleY: flexBar0 }] },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.flexWaveBar,
                        { backgroundColor: colors.primary },
                        { transform: [{ scaleY: flexBar1 }] },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.flexWaveBar,
                        { backgroundColor: colors.primary },
                        { transform: [{ scaleY: flexBar2 }] },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.flexWaveBar,
                        { backgroundColor: colors.primary },
                        { transform: [{ scaleY: flexBar3 }] },
                      ]}
                    />
                  </View>
                </View>
                <ThemedText
                  type="h5"
                  style={[styles.conceptTitle, { color: colors.text }]}
                >
                  Flexibilidad
                </ThemedText>
                <ThemedText
                  type="body2"
                  style={[
                    styles.conceptDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  Se adapta a tu negocio sin rigideces
                </ThemedText>
              </View>

              {/* Acoplamiento: dos nodos unidos por una línea que se activa */}
              <View
                style={[styles.conceptCard, { borderColor: colors.border }]}
              >
                <View style={styles.conceptVisual}>
                  <View style={styles.coupleRow}>
                    <Animated.View
                      style={[
                        styles.coupleNode,
                        { backgroundColor: colors.primary },
                        { transform: [{ scale: coupleNodeScale }] },
                      ]}
                    />
                    <View style={styles.coupleLineWrap}>
                      <View
                        style={[
                          styles.coupleLineBase,
                          { backgroundColor: colors.primary + "40" },
                        ]}
                      />
                      <Animated.View
                        style={[
                          styles.coupleLineGlow,
                          { backgroundColor: colors.primary },
                          { opacity: coupleLineGlow },
                        ]}
                      />
                    </View>
                    <Animated.View
                      style={[
                        styles.coupleNode,
                        { backgroundColor: colors.primary },
                        { transform: [{ scale: coupleNodeScale }] },
                      ]}
                    />
                  </View>
                </View>
                <ThemedText
                  type="h5"
                  style={[styles.conceptTitle, { color: colors.text }]}
                >
                  Acoplamiento
                </ThemedText>
                <ThemedText
                  type="body2"
                  style={[
                    styles.conceptDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  Módulos integrados que trabajan en conjunto
                </ThemedText>
              </View>

              {/* Procesos: pasos que se iluminan en secuencia */}
              <View
                style={[
                  styles.conceptCard,
                  isMobile && styles.conceptCardMobile,
                  { borderColor: colors.border },
                ]}
              >
                <View style={styles.conceptVisual}>
                  <View style={styles.processStepsRow}>
                    <Animated.View
                      style={[
                        styles.processStepNode,
                        { backgroundColor: colors.primary },
                        { opacity: processStep0 },
                      ]}
                    />
                    <View
                      style={[
                        styles.processStepLine,
                        { backgroundColor: colors.primary + "50" },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.processStepNode,
                        { backgroundColor: colors.primary },
                        { opacity: processStep1 },
                      ]}
                    />
                    <View
                      style={[
                        styles.processStepLine,
                        { backgroundColor: colors.primary + "50" },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.processStepNode,
                        { backgroundColor: colors.primary },
                        { opacity: processStep2 },
                      ]}
                    />
                    <View
                      style={[
                        styles.processStepLine,
                        { backgroundColor: colors.primary + "50" },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.processStepNode,
                        { backgroundColor: colors.primary },
                        { opacity: processStep3 },
                      ]}
                    />
                  </View>
                </View>
                <ThemedText
                  type="h5"
                  style={[styles.conceptTitle, { color: colors.text }]}
                >
                  Procesos
                </ThemedText>
                <ThemedText
                  type="body2"
                  style={[
                    styles.conceptDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  Procesos claros y continuos que guían cada interacción
                </ThemedText>
              </View>
            </View>
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
    alignSelf: "center",
    width: "100%",
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
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  titleIcon: {
    flexShrink: 0,
  },
  title: {
    marginBottom: 4,
  },
  titleMobile: {
    fontSize: 27,
    lineHeight: 32,
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
    alignItems: "center",
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
    width: "100%",
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 8,
  },
  cardImageContainerMobile: {
    height: 140,
    borderRadius: 10,
    marginBottom: 6,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  iconContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  // Sección inferior: Flujos, Flexibilidad, Acoplamiento (animada)
  conceptsSection: {
    maxWidth: 1400,
    alignSelf: "center",
    width: "100%",
    marginTop: 48,
    paddingTop: 32,
    borderTopWidth: 1,
  },
  conceptsSectionMobile: {
    marginTop: 32,
    paddingTop: 24,
  },
  conceptsGrid: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 16,
  },
  conceptsGridMobile: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    width: "100%",
  },
  conceptCard: {
    flex: 1,
    minWidth: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  conceptCardMobile: {
    flex: 1,
    minWidth: "47%",
  },
  conceptVisual: {
    width: "100%",
    height: 56,
    marginBottom: 12,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  processStepsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  processStepNode: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  processStepLine: {
    width: 20,
    height: 3,
    borderRadius: 2,
  },
  flexWaveRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 10,
    height: 40,
  },
  flexWaveBar: {
    width: 10,
    height: 24,
    borderRadius: 5,
  },
  coupleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  coupleNode: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  coupleLineWrap: {
    width: 36,
    height: 4,
    position: "relative",
    justifyContent: "center",
  },
  coupleLineBase: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
  },
  coupleLineGlow: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
  },
  conceptTitle: {
    marginBottom: 6,
    fontWeight: "600",
    textAlign: "center",
  },
  conceptDescription: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
});
