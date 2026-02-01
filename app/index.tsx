import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { VideoPlayer } from '@/components/video-player';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { DynamicIcon } from '@/src/domains/shared/components';
import React from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

export default function HomeScreen() {
  const { colors, spacing } = useTheme();
  const { isMobile, isDesktop } = useResponsive();

  // Ruta del video - usar require para todas las plataformas
  // En web, Metro bundler procesará el require y generará la URL correcta
  const videoSource = require('@/assets/videos/grammarly-189393-docs_module_animation-624x480-2X-WHITEBG_V1__2_.mp4');

  // Fortalezas del sistema para la sección de iconos
  const strengths = [
    {
      id: 'scale',
      icon: 'MaterialCommunityIcons:chart-line',
      title: 'Escalable',
      description: 'Crece con tu negocio. Desde una sucursal hasta múltiples empresas y ubicaciones.',
    },
    {
      id: 'multi',
      icon: 'Entypo:network',
      title: 'Multi-empresa',
      description: 'Gestiona varias empresas y sucursales desde una sola plataforma.',
    },
    {
      id: 'ai',
      icon: 'Ionicons:sparkles',
      title: 'IA integrada',
      description: 'Inteligencia artificial en ChatIA para respuestas automáticas e inteligentes.',
    },
    {
      id: 'security',
      icon: 'Ionicons:shield-checkmark',
      title: 'Seguro',
      description: 'Arquitectura segura, datos protegidos y control de acceso por roles.',
    },
    {
      id: 'integrated',
      icon: 'MaterialCommunityIcons:connection',
      title: 'Integrado',
      description: 'WhatsApp, facturación y ERP conectados en un solo ecosistema.',
    },
  ];

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
            <View style={[styles.mainTitleRow, isMobile && styles.mainTitleRowMobile]}>
              <DynamicIcon
                name="Entypo:network"
                size={isMobile ? 28 : 36}
                color={colors.primary}
                style={styles.mainTitleIcon}
              />
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
            </View>
            
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

        {/* Fortalezas de nuestro sistema - Iconos con descripciones (una sola fila) */}
        <View style={[styles.strengthsSection, isMobile && styles.strengthsSectionMobile]}>
          {isMobile ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.strengthsGridMobileScroll}
            >
              {strengths.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.strengthCard,
                    styles.strengthCardMobile,
                    { borderColor: colors.border },
                  ]}
                >
                  <View style={[styles.strengthIconWrap, { backgroundColor: colors.primary + '18' }]}>
                    <DynamicIcon
                      name={item.icon}
                      size={28}
                      color={colors.primary}
                    />
                  </View>
                  <ThemedText type="h5" style={[styles.strengthCardTitle, { color: colors.text }]}>
                    {item.title}
                  </ThemedText>
                  <ThemedText type="body2" style={[styles.strengthCardDescription, { color: colors.textSecondary }]}>
                    {item.description}
                  </ThemedText>
                </View>
              ))}
            </ScrollView>
          ) : (
          <View style={styles.strengthsGrid}>
            {strengths.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.strengthCard,
                  isMobile && styles.strengthCardMobile,
                  { borderColor: colors.border },
                ]}
              >
                <View style={[styles.strengthIconWrap, { backgroundColor: colors.primary + '18' }]}>
                  <DynamicIcon
                    name={item.icon}
                    size={isMobile ? 28 : 32}
                    color={colors.primary}
                  />
                </View>
                <ThemedText type="h5" style={[styles.strengthCardTitle, { color: colors.text }]}>
                  {item.title}
                </ThemedText>
                <ThemedText type="body2" style={[styles.strengthCardDescription, { color: colors.textSecondary }]}>
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
  mainTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
  },
  mainTitleIcon: {
    flexShrink: 0,
  },
  mainTitleRowMobile: {
    marginBottom: 16,
  },
  mainTitle: {
    marginBottom: 0,
    textAlign: 'justify',
    flex: 1,
  },
  mainTitleMobile: {
    marginBottom: 0,
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
  // Fortalezas del sistema
  strengthsSection: {
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
    marginTop: 48,
    paddingTop: 32,
    borderTopWidth: 1,
  },
  strengthsSectionMobile: {
    marginTop: 32,
    paddingTop: 24,
  },
  strengthsGrid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 16,
  },
  strengthsGridMobile: {
    gap: 12,
  },
  strengthsGridMobileScroll: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  strengthCard: {
    flex: 1,
    minWidth: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  strengthCardMobile: {
    flex: 0,
    width: 160,
  },
  strengthIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  strengthCardTitle: {
    marginBottom: 6,
    fontWeight: '600',
  },
  strengthCardDescription: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'left',
  },
});
