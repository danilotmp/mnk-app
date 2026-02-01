import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { VideoPlayer } from '@/components/video-player';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import React from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

export default function HomeScreen() {
  const { colors, spacing } = useTheme();
  const { isMobile, isDesktop } = useResponsive();

  // Ruta del video - usar require para todas las plataformas
  // En web, Metro bundler procesará el require y generará la URL correcta
  const videoSource = require('@/assets/videos/grammarly-189393-docs_module_animation-624x480-2X-WHITEBG_V1__2_.mp4');

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section - Two Column Layout */}
        <View style={[
          styles.heroContainer,
          isMobile && styles.heroContainerMobile,
          { gap: spacing.lg }
        ]}>
          {/* Left Column - Text Content */}
          <View style={[
            styles.textColumn,
            isMobile && styles.textColumnMobile,
            isDesktop && styles.textColumnDesktop
          ]}>
            <ThemedText 
              type="h1" 
              style={[
                styles.mainTitle,
                isMobile && styles.mainTitleMobile,
                { color: colors.text }
              ]}
            >
              Soluciones empresariales con Inteligencia Artificial
            </ThemedText>
            
            <ThemedText 
              type="body1" 
              style={[
                styles.description,
                isMobile && styles.descriptionMobile,
                { color: colors.textSecondary }
              ]}
            >
              AIBox es una plataforma multi-empresa diseñada para crecer según tus necesidades. 
              Integra diferentes módulos y funcionalidades empresariales en una sola solución escalable.
            </ThemedText>

            {/* Features List */}
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <ThemedText type="h5" style={[styles.featureTitle, { color: colors.text, marginBottom: spacing.xs }]}>
                  WhatsApp con ChatIA
                </ThemedText>
                <ThemedText type="body2" style={[styles.featureDescription, { color: colors.textSecondary }]}>
                  Conecta tu WhatsApp con inteligencia artificial para automatizar conversaciones 
                  y mejorar la atención al cliente con respuestas inteligentes y contextuales.
                </ThemedText>
              </View>

              <View style={styles.featureItem}>
                <ThemedText type="h5" style={[styles.featureTitle, { color: colors.text, marginBottom: spacing.xs }]}>
                  Módulo de Facturación
                </ThemedText>
                <ThemedText type="body2" style={[styles.featureDescription, { color: colors.textSecondary }]}>
                  Sistema completo de facturación electrónica con gestión de clientes, 
                  productos y reportes financieros integrados.
                </ThemedText>
              </View>

              <View style={styles.featureItem}>
                <ThemedText type="h5" style={[styles.featureTitle, { color: colors.text, marginBottom: spacing.xs }]}>
                  Módulo ERP
                </ThemedText>
                <ThemedText type="body2" style={[styles.featureDescription, { color: colors.textSecondary }]}>
                  Planificación de recursos empresariales para gestionar inventarios, 
                  compras, ventas y procesos operativos de tu negocio.
                </ThemedText>
              </View>
            </View>

            {/* Key Points */}
            <View style={styles.keyPoints}>
              <ThemedText type="body2" style={[styles.keyPoint, { color: colors.textSecondary }]}>
                ✓ Arquitectura multi-empresa
              </ThemedText>
              <ThemedText type="body2" style={[styles.keyPoint, { color: colors.textSecondary }]}>
                ✓ Escalable y modular
              </ThemedText>
              <ThemedText type="body2" style={[styles.keyPoint, { color: colors.textSecondary }]}>
                ✓ Integración con WhatsApp
              </ThemedText>
            </View>
          </View>

          {/* Right Column - Video */}
          <View style={[
            styles.videoColumn,
            isMobile && styles.videoColumnMobile,
            isDesktop && styles.videoColumnDesktop
          ]}>
            <View style={styles.videoContainer}>
              <VideoPlayer
                source={videoSource}
                style={Platform.OS === 'web' ? styles.videoWeb : styles.videoNative}
                autoPlay
                loop
                muted
              />
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
    padding: 24,
    paddingTop: 48,
    paddingBottom: 48,
  },
  heroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  heroContainerMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  textColumn: {
    flex: 1,
    paddingRight: 24,
  },
  textColumnMobile: {
    paddingRight: 0,
    marginBottom: 32,
  },
  textColumnDesktop: {
    maxWidth: 600,
  },
  mainTitle: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 56,
    marginBottom: 24,
    textAlign: 'justify',
  },
  mainTitleMobile: {
    fontSize: 32,
    lineHeight: 40,
    marginBottom: 16,
    textAlign: 'justify',
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'justify',
  },
  descriptionMobile: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'justify',
  },
  featuresList: {
    marginBottom: 32,
  },
  featureItem: {
    marginBottom: 24,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'justify',
  },
  keyPoints: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  keyPoint: {
    fontSize: 13,
  },
  videoColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoColumnMobile: {
    width: '100%',
  },
  videoColumnDesktop: {
    maxWidth: 600,
  },
  videoContainer: {
    width: '100%',
    maxWidth: 624,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  videoWeb: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  videoNative: {
    width: '100%',
    aspectRatio: 624 / 480,
  },
});
