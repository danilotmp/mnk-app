/**
 * Pantalla de Descargas: Android, iOS y otros instaladores.
 */

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/hooks/use-theme";
import { DynamicIcon } from "@/src/domains/shared/components";
import { useTranslation } from "@/src/infrastructure/i18n";
import React, { useMemo } from "react";
import {
  Linking,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { createDownloadsScreenStyles } from "./downloads.screen.styles";

// URLs de descarga: configurar cuando tengas los instaladores publicados
const DOWNLOAD_URLS = {
  android: "", // ej: "https://tu-dominio.com/builds/app-release.apk"
  ios: "", // ej: "https://apps.apple.com/app/tu-app/idXXXXX" o TestFlight
};

export function DownloadsScreen() {
  const { colors, typography, pageLayout, spacing, borderRadius } = useTheme();
  const { t } = useTranslation();
  const { isMobile } = useResponsive();
  const styles = useMemo(
    () =>
      createDownloadsScreenStyles(
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

  const d = t.pages?.downloads;

  const handleDownload = (url: string) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {});
  };

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
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.headerIconContainer}>
                <DynamicIcon
                  name="Ionicons:cloud-download-outline"
                  size={isMobile ? pageLayout.iconTitleMobile : pageLayout.iconTitle}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="h2" style={isMobile ? styles.titleMobile : styles.title}>
                  {d?.title ?? "Descargas"}
                </ThemedText>
                <ThemedText type="body1" style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {d?.subtitle ??
                    "Descarga la aplicación AIBox para tu dispositivo. Aquí encontrarás todos los instaladores disponibles."}
                </ThemedText>
              </View>
            </View>
          </View>

          <ThemedText type="h5" style={[styles.sectionTitle, { color: colors.text }]}>
            {d?.installers ?? "Instaladores"}
          </ThemedText>

          <View style={[styles.cardsGrid, isMobile && styles.cardsGridMobile]}>
            {/* Android */}
            <View
              style={[
                styles.downloadCard,
                isMobile && styles.downloadCardMobile,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <DynamicIcon
                name="Ionicons:logo-android"
                size={40}
                color={colors.primary}
                style={{ marginBottom: spacing.sm }}
              />
              <ThemedText type="h5" style={styles.downloadCardTitle}>
                {d?.android ?? "Android"}
              </ThemedText>
              <ThemedText
                type="body2"
                style={[
                  styles.downloadCardDescription,
                  isMobile && styles.downloadCardDescriptionMobile,
                  { color: colors.textSecondary },
                ]}
              >
                Descarga el APK e instálalo en tu dispositivo Android.
              </ThemedText>
              <TouchableOpacity
                style={[
                  styles.downloadButton,
                  !DOWNLOAD_URLS.android && styles.downloadButtonDisabled,
                ]}
                onPress={() => handleDownload(DOWNLOAD_URLS.android)}
                disabled={!DOWNLOAD_URLS.android}
                activeOpacity={0.7}
              >
                <ThemedText style={styles.downloadButtonText}>
                  {DOWNLOAD_URLS.android
                    ? (d?.downloadButton ?? "Descargar")
                    : (d?.comingSoon ?? "Próximamente")}
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* iOS */}
            <View
              style={[
                styles.downloadCard,
                isMobile && styles.downloadCardMobile,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <DynamicIcon
                name="Ionicons:logo-apple"
                size={40}
                color={colors.text}
                style={{ marginBottom: spacing.sm }}
              />
              <ThemedText type="h5" style={styles.downloadCardTitle}>
                {d?.ios ?? "iOS"}
              </ThemedText>
              <ThemedText
                type="body2"
                style={[
                  styles.downloadCardDescription,
                  isMobile && styles.downloadCardDescriptionMobile,
                  { color: colors.textSecondary },
                ]}
              >
                {Platform.OS === "web"
                  ? "Enlace a App Store o TestFlight cuando esté disponible."
                  : "Descarga desde App Store o TestFlight."}
              </ThemedText>
              <TouchableOpacity
                style={[
                  styles.downloadButton,
                  !DOWNLOAD_URLS.ios && styles.downloadButtonDisabled,
                ]}
                onPress={() => handleDownload(DOWNLOAD_URLS.ios)}
                disabled={!DOWNLOAD_URLS.ios}
                activeOpacity={0.7}
              >
                <ThemedText style={styles.downloadButtonText}>
                  {DOWNLOAD_URLS.ios
                    ? (d?.downloadButton ?? "Descargar")
                    : (d?.comingSoon ?? "Próximamente")}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          <ThemedText
            type="body2"
            style={[styles.installersNote, { color: colors.textSecondary }]}
          >
            Puedes añadir más enlaces de instaladores (otras versiones, betas, etc.) en esta misma página cuando los tengas disponibles.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}
