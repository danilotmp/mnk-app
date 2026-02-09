/**
 * Pantalla de inicio (Home).
 * Usa tokens globales: typography.pageTitle/pageTitleMobile, pageLayout.titleSubtitleGap.
 */

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { VideoPlayer } from "@/components/video-player";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/hooks/use-theme";
import { DynamicIcon } from "@/src/domains/shared/components";
import { useTranslation } from "@/src/infrastructure/i18n";
import React, { useMemo } from "react";
import { Platform, ScrollView, View } from "react-native";
import { createHomeScreenStyles } from "./home.screen.styles";

const videoSource = require("@/assets/videos/grammarly-189393-docs_module_animation-624x480-2X-WHITEBG_V1__2_.mp4");

const STRENGTH_IDS = [
  { id: "scale", icon: "MaterialCommunityIcons:chart-line" },
  { id: "multi", icon: "Entypo:network" },
  { id: "ai", icon: "Ionicons:sparkles" },
  { id: "security", icon: "Ionicons:shield-checkmark" },
  { id: "integrated", icon: "MaterialCommunityIcons:connection" },
] as const;

export function HomeScreen() {
  const { t } = useTranslation();
  const { colors, spacing, typography, pageLayout, borderRadius } = useTheme();
  const { isMobile, isDesktop } = useResponsive();

  const home = t.pages?.home;
  const strengths = useMemo(() => {
    if (!home?.strengths) return [];
    const s = home.strengths;
    return STRENGTH_IDS.map(({ id, icon }) => ({
      id,
      icon,
      title: s[id as keyof typeof s]?.title ?? "",
      description: s[id as keyof typeof s]?.description ?? "",
    }));
  }, [home?.strengths]);

  const styles = useMemo(
    () =>
      createHomeScreenStyles({
        colors,
        spacing,
        typography,
        pageLayout,
        borderRadius,
      }),
    [colors, spacing, typography, pageLayout, borderRadius],
  );

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
        <View
          style={[styles.heroContainer, isMobile && styles.heroContainerMobile]}
        >
          <View
            style={[
              styles.textColumn,
              isMobile && styles.textColumnMobile,
              isDesktop && styles.textColumnDesktop,
            ]}
          >
            <View
              style={[
                styles.mainTitleRow,
                isMobile && styles.mainTitleRowMobile,
              ]}
            >
              <View style={styles.mainTitleIconContainer}>
                <DynamicIcon
                  name="Entypo:network"
                  size={isMobile ? 28 : 36}
                  color={colors.primary}
                  style={styles.mainTitleIcon}
                />
              </View>
              <ThemedText
                type="h1"
                style={[
                  styles.mainTitle,
                  isMobile && styles.mainTitleMobile,
                  { color: colors.pageTitleColor ?? colors.text },
                ]}
              >
                {home?.mainTitle ??
                  "Soluciones empresariales con Inteligencia Artificial"}
              </ThemedText>
            </View>

            <ThemedText
              type="body1"
              style={[
                styles.description,
                isMobile && styles.descriptionMobile,
                { color: colors.textSecondary },
              ]}
            >
              {home?.mainDescription ??
                "AIBox es una plataforma multi-empresa diseñada para crecer según tus necesidades. Integra diferentes módulos y funcionalidades empresariales en una sola solución escalable."}
            </ThemedText>

            {isMobile && (
              <View style={[styles.videoColumn, styles.videoColumnMobile]}>
                <View style={styles.videoContainer}>
                  <VideoPlayer
                    source={videoSource}
                    style={
                      Platform.OS === "web"
                        ? styles.videoWeb
                        : styles.videoNative
                    }
                    autoPlay
                    loop
                    muted
                  />
                </View>
              </View>
            )}

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <ThemedText
                  type="h5"
                  style={[
                    styles.featureTitle,
                    { color: colors.text, marginBottom: spacing.xs },
                  ]}
                >
                  {home?.feature1Title ?? "WhatsApp con ChatIA"}
                </ThemedText>
                <ThemedText
                  type="body2"
                  style={[
                    styles.featureDescription,
                    isMobile && styles.featureDescriptionMobile,
                    { color: colors.textSecondary },
                  ]}
                >
                  {home?.feature1Description ??
                    "Conecta tu WhatsApp con inteligencia artificial para automatizar conversaciones y mejorar la atención al cliente con respuestas inteligentes y contextuales."}
                </ThemedText>
              </View>

              <View style={styles.featureItem}>
                <ThemedText
                  type="h5"
                  style={[
                    styles.featureTitle,
                    { color: colors.text, marginBottom: spacing.xs },
                  ]}
                >
                  {home?.feature2Title ?? "Módulo de Facturación"}
                </ThemedText>
                <ThemedText
                  type="body2"
                  style={[
                    styles.featureDescription,
                    isMobile && styles.featureDescriptionMobile,
                    { color: colors.textSecondary },
                  ]}
                >
                  {home?.feature2Description ??
                    "Sistema completo de facturación electrónica con gestión de clientes, productos y reportes financieros integrados."}
                </ThemedText>
              </View>

              <View style={styles.featureItem}>
                <ThemedText
                  type="h5"
                  style={[
                    styles.featureTitle,
                    { color: colors.text, marginBottom: spacing.xs },
                  ]}
                >
                  {home?.feature3Title ?? "Módulo ERP"}
                </ThemedText>
                <ThemedText
                  type="body2"
                  style={[
                    styles.featureDescription,
                    isMobile && styles.featureDescriptionMobile,
                    { color: colors.textSecondary },
                  ]}
                >
                  {home?.feature3Description ??
                    "Planificación de recursos empresariales para gestionar inventarios, compras, ventas y procesos operativos de tu negocio."}
                </ThemedText>
              </View>
            </View>

            <View style={styles.keyPoints}>
              <ThemedText
                type="body2"
                style={[
                  styles.keyPoint,
                  isMobile && styles.keyPointMobile,
                  { color: colors.textSecondary },
                ]}
              >
                {home?.keyPoint1 ?? "✓ Arquitectura multi-empresa"}
              </ThemedText>
              <ThemedText
                type="body2"
                style={[
                  styles.keyPoint,
                  isMobile && styles.keyPointMobile,
                  { color: colors.textSecondary },
                ]}
              >
                {home?.keyPoint2 ?? "✓ Escalable y modular"}
              </ThemedText>
              <ThemedText
                type="body2"
                style={[
                  styles.keyPoint,
                  isMobile && styles.keyPointMobile,
                  { color: colors.textSecondary },
                ]}
              >
                {home?.keyPoint3 ?? "✓ Integración con WhatsApp"}
              </ThemedText>
            </View>
          </View>

          {!isMobile && (
            <View
              style={[
                styles.videoColumn,
                isDesktop && styles.videoColumnDesktop,
              ]}
            >
              <View style={styles.videoContainer}>
                <VideoPlayer
                  source={videoSource}
                  style={
                    Platform.OS === "web" ? styles.videoWeb : styles.videoNative
                  }
                  autoPlay
                  loop
                  muted
                />
              </View>
            </View>
          )}
        </View>

        <View
          style={[
            styles.strengthsSection,
            isMobile && styles.strengthsSectionMobile,
          ]}
        >
          {isMobile ? (
            <View style={styles.strengthsGridMobile}>
              {strengths.map((item) => (
                <View
                  key={item.id}
                  style={[styles.strengthCard, styles.strengthCardMobile]}
                >
                  <View
                    style={[
                      styles.strengthIconWrap,
                      { backgroundColor: colors.primary + "18" },
                    ]}
                  >
                    <DynamicIcon
                      name={item.icon}
                      size={pageLayout.iconTitleMobile}
                      color={colors.primary}
                    />
                  </View>
                  <ThemedText
                    type="h5"
                    style={[styles.strengthCardTitle, { color: colors.text }]}
                  >
                    {item.title}
                  </ThemedText>
                  <ThemedText
                    type="body2"
                    style={[
                      styles.strengthCardDescription,
                      isMobile && styles.strengthCardDescriptionMobile,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {item.description}
                  </ThemedText>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.strengthsGrid}>
              {strengths.map((item) => (
                <View key={item.id} style={styles.strengthCard}>
                  <View
                    style={[
                      styles.strengthIconWrap,
                      { backgroundColor: colors.primary + "18" },
                    ]}
                  >
                    <DynamicIcon
                      name={item.icon}
                      size={pageLayout.iconTitle}
                      color={colors.primary}
                    />
                  </View>
                  <ThemedText
                    type="h5"
                    style={[styles.strengthCardTitle, { color: colors.text }]}
                  >
                    {item.title}
                  </ThemedText>
                  <ThemedText
                    type="body2"
                    style={[
                      styles.strengthCardDescription,
                      isMobile && styles.strengthCardDescriptionMobile,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {item.description}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}
