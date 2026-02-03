/**
 * Pantalla de Contacto (Contact).
 * Usa tokens globales: typography.pageTitle/pageSubtitle/pageBody, pageLayout, spacing, colors, borderRadius.
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Platform, ScrollView, View } from "react-native";
import { WebView } from "react-native-webview";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Card } from "@/components/ui/card";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/hooks/use-theme";
import { DynamicIcon } from "@/src/domains/shared/components";
import { useTranslation } from "@/src/infrastructure/i18n";
import { createContactScreenStyles } from "./contact.screen.styles";

export function ContactScreen() {
  const { colors, typography, pageLayout, spacing, borderRadius } = useTheme();

  const { isMobile } = useResponsive();
  const styles = useMemo(
    () =>
      createContactScreenStyles(
        {
          colors,
          typography,
          pageLayout,
          spacing,
          borderRadius,
        },
        isMobile,
      ),
    [colors, typography, pageLayout, spacing, borderRadius, isMobile],
  );
  const { t } = useTranslation();

  // URL del mapa: obtener una actual desde Google Maps (Compartir > Insertar mapa)
  const googleMapsEmbedUrl =
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.7855!2d-78.4678!3d-0.1807!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91d59a9b8c8c8c8d%3A0x8c8c8c8c8c8c8c8c!2sQuito%2C%20Ecuador!5e0!3m2!1ses!2sec!4v1234567890";

  // Animaciones Comunicación: Llamadas, Email, Mapa
  const llamadasAnim = useRef(new Animated.Value(0)).current;
  const emailAnim = useRef(new Animated.Value(0)).current;
  const mapaAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const llamadasLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(llamadasAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(llamadasAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    const emailLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(emailAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(emailAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    );
    const mapaLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(mapaAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(mapaAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    );
    llamadasLoop.start();
    emailLoop.start();
    mapaLoop.start();
    return () => {
      llamadasLoop.stop();
      emailLoop.stop();
      mapaLoop.stop();
    };
  }, [llamadasAnim, emailAnim, mapaAnim]);

  const llamadasWave1 = llamadasAnim.interpolate({
    inputRange: [0, 0.4, 0.6, 1],
    outputRange: [1, 1.35, 1.35, 1],
  });
  const llamadasWave2 = llamadasAnim.interpolate({
    inputRange: [0.3, 0.6, 0.9, 1],
    outputRange: [1, 1.35, 1.35, 1],
  });
  const emailLetterY = emailAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 8, 0],
  });
  const mapaPinScale = mapaAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.2, 1],
  });

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isMobile && styles.scrollContentMobile,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.contactSection}>
          <View
            style={[styles.twoColumns, isMobile && styles.twoColumnsMobile]}
          >
            {/* Columna Izquierda: Header + Información de Matriz */}
            <View style={styles.leftColumn}>
              {/* Header con Icono, Título y Subtítulo (mismo estilo que página de Inicio) */}
              <View style={styles.headerSection}>
                <View style={styles.headerRow}>
                  <DynamicIcon
                    name="MaterialCommunityIcons:contacts"
                    size={
                      isMobile
                        ? pageLayout.iconTitleMobile
                        : pageLayout.iconTitle
                    }
                    color={colors.primary}
                    style={styles.headerIcon}
                  />
                  <ThemedText
                    type="h1"
                    style={[
                      styles.title,
                      { color: colors.text },
                      isMobile && typography.pageTitleMobile,
                    ]}
                  >
                    {t.pages.contact.title}
                  </ThemedText>
                </View>
                <ThemedText
                  type="body1"
                  style={[
                    styles.subtitle,
                    isMobile
                      ? typography.pageSubtitleMobile
                      : typography.pageSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  {t.pages.contact.subtitle}
                </ThemedText>
              </View>

              {/* Información de Matriz - Card con icono superpuesto */}
              <View
                style={[
                  styles.matrixCardWrapper,
                  isMobile && styles.matrixCardWrapperMobile,
                  { backgroundColor: colors.surface },
                ]}
              >
                <View
                  style={[
                    styles.matrixIconBlock,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Ionicons
                    name="location"
                    size={pageLayout.iconTitle}
                    color={colors.contrastText}
                  />
                </View>
                <View style={styles.matrixCardContent}>
                  <View style={styles.matrixTitleRow}>
                    <View style={styles.matrixTitleSpacer} />
                    <ThemedText
                      type="h2"
                      variant="primary"
                      style={[styles.locationName, typography.h4]}
                    >
                      Matriz
                    </ThemedText>
                  </View>
                  <View style={[styles.matrixRow, styles.matrixRowFirst]}>
                    <Ionicons
                      name="map-outline"
                      size={
                        isMobile
                          ? pageLayout.iconSubtitleMobile
                          : pageLayout.iconSubtitle
                      }
                      color={colors.textSecondary}
                    />
                    <ThemedText
                      type="body2"
                      variant="secondary"
                      style={[
                        styles.contactText,
                        isMobile
                          ? typography.pageBodyMobile
                          : typography.pageBody,
                      ]}
                    >
                      Jun Murillo y San Gregorio - 170129
                    </ThemedText>
                  </View>
                  <View style={styles.matrixRow}>
                    <Ionicons
                      name="location-outline"
                      size={
                        isMobile
                          ? pageLayout.iconSubtitleMobile
                          : pageLayout.iconSubtitle
                      }
                      color={colors.textSecondary}
                    />
                    <ThemedText
                      type="body2"
                      variant="secondary"
                      style={styles.contactText}
                    >
                      Sector la Mariscal
                    </ThemedText>
                  </View>
                  <View style={styles.matrixRow}>
                    <Ionicons
                      name="phone-portrait-outline"
                      size={
                        isMobile
                          ? pageLayout.iconSubtitleMobile
                          : pageLayout.iconSubtitle
                      }
                      color={colors.textSecondary}
                    />
                    <ThemedText
                      type="body2"
                      variant="secondary"
                      style={[
                        styles.contactText,
                        isMobile
                          ? typography.pageBodyMobile
                          : typography.pageBody,
                      ]}
                    >
                      0987255382
                    </ThemedText>
                  </View>
                  <View style={[styles.matrixRow, styles.matrixRowRight]}>
                    <ThemedText
                      type="body2"
                      variant="secondary"
                      style={[
                        styles.contactText,
                        styles.contactTextRight,
                        isMobile
                          ? typography.pageBodyMobile
                          : typography.pageBody,
                      ]}
                    >
                      Quito - Ecuador
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>

            {/* Columna Derecha: Mapa dentro de contenedor tipo card */}
            <View
              style={[
                styles.mapCardWrapper,
                isMobile && styles.mapCardWrapperMobile,
                {
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <View
                style={[
                  styles.mapContainer,
                  isMobile && styles.mapContainerMobile,
                ]}
              >
                {Platform.OS === "web" ? (
                  // @ts-ignore - iframe para web
                  <iframe
                    title="Mapa de Quito, Ecuador"
                    src={googleMapsEmbedUrl}
                    width="100%"
                    height="100%"
                    style={{
                      border: 0,
                      borderRadius: 24,
                      display: "block",
                      minHeight: 400,
                    }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <WebView
                    source={{ uri: googleMapsEmbedUrl }}
                    style={styles.mapWebView}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                  />
                )}
              </View>
            </View>
          </View>
        </Card>

        {/* Sección inferior: Comunicación - Llamadas, Email, Mapa (animado) */}
        <View
          style={[styles.commSection, isMobile && styles.commSectionMobile]}
        >
          <ThemedText
            type="h4"
            style={[styles.commSectionTitle, { color: colors.text }]}
          >
            Comunicación
          </ThemedText>
          <View style={[styles.commGrid, isMobile && styles.commGridMobile]}>
            {/* Llamadas: ondas de sonido */}
            <View style={styles.commCard}>
              <View style={styles.commVisual}>
                <View style={styles.llamadasRow}>
                  <Animated.View
                    style={[
                      styles.llamadasWave,
                      { backgroundColor: colors.primary },
                      { transform: [{ scale: llamadasWave1 }] },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.llamadasWave,
                      { backgroundColor: colors.primary },
                      { transform: [{ scale: llamadasWave2 }] },
                    ]}
                  />
                </View>
              </View>
              <ThemedText
                type="h5"
                style={[styles.commCardTitle, { color: colors.text }]}
              >
                Llamadas
              </ThemedText>
              <ThemedText
                type="body2"
                style={[
                  styles.commCardDesc,
                  isMobile ? typography.pageBodyMobile : typography.pageBody,
                  { color: colors.textSecondary },
                ]}
              >
                Contáctanos por teléfono
              </ThemedText>
            </View>

            {/* Email: carta que entra al sobre */}
            <View style={styles.commCard}>
              <View style={styles.commVisual}>
                <View
                  style={[
                    styles.emailEnvelope,
                    { borderColor: colors.primary + "60" },
                  ]}
                >
                  <View
                    style={[
                      styles.emailFlap,
                      { borderBottomColor: colors.primary + "50" },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.emailLetter,
                      { backgroundColor: colors.primary + "40" },
                      { transform: [{ translateY: emailLetterY }] },
                    ]}
                  />
                </View>
              </View>
              <ThemedText
                type="h5"
                style={[styles.commCardTitle, { color: colors.text }]}
              >
                Email
              </ThemedText>
              <ThemedText
                type="body2"
                style={[
                  styles.commCardDesc,
                  isMobile ? typography.pageBodyMobile : typography.pageBody,
                  { color: colors.textSecondary },
                ]}
              >
                Escríbenos por correo
              </ThemedText>
            </View>

            {/* Mapa: pin que pulsa */}
            <View style={styles.commCard}>
              <View style={styles.commVisual}>
                <Animated.View
                  style={[
                    styles.mapaPin,
                    { transform: [{ scale: mapaPinScale }] },
                  ]}
                >
                  <View
                    style={[
                      styles.mapaPinHead,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                  <View
                    style={[
                      styles.mapaPinPoint,
                      { borderTopColor: colors.primary },
                    ]}
                  />
                </Animated.View>
              </View>
              <ThemedText
                type="h5"
                style={[styles.commCardTitle, { color: colors.text }]}
              >
                Mapa
              </ThemedText>
              <ThemedText
                type="body2"
                style={[
                  styles.commCardDesc,
                  isMobile ? typography.pageBodyMobile : typography.pageBody,
                  { color: colors.textSecondary },
                ]}
              >
                Ubicación y cómo llegar
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}
