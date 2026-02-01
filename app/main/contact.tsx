import { Ionicons } from '@expo/vector-icons';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useTranslation } from '@/src/infrastructure/i18n';

export default function ContactPage() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { isMobile } = useResponsive();

  // URL del mapa de Google Maps para Quito, Ecuador
  // Coordenadas: -0.1807, -78.4678

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Card style={styles.headerCard}>
          <Ionicons name="call" size={48} color={colors.primary} />
          <ThemedText type="h1" variant="primary" style={styles.title}>
            {t.pages.contact.title}
          </ThemedText>
          <ThemedText type="body1" variant="secondary" style={styles.subtitle}>
            {t.pages.contact.subtitle}
          </ThemedText>
        </Card>

        {/* Sección de Contacto Minimalista */}
        <Card style={styles.contactSection}>
          <View style={[
            styles.contactContent,
            isMobile && styles.contactContentMobile
          ]}>
            {/* Columna Izquierda: Información de Contacto */}
            <View style={styles.contactInfo}>
              <View style={styles.contactHeader}>
                <View style={[styles.locationIcon, { backgroundColor: colors.primary }]}>
                  <Ionicons name="location" size={24} color="#FFFFFF" />
                </View>
                <ThemedText type="h2" variant="primary" style={styles.locationName}>
                  Matriz
                </ThemedText>
              </View>

              <View style={styles.contactItem}>
                <Ionicons name="map-outline" size={18} color={colors.textSecondary} />
                <ThemedText type="body2" variant="secondary" style={styles.contactText}>
                  Quito - Ecuador
                </ThemedText>
              </View>

              <View style={styles.contactItem}>
                <Ionicons name="phone-portrait-outline" size={18} color={colors.textSecondary} />
                <ThemedText type="body2" variant="secondary" style={styles.contactText}>
                  0987255382
                </ThemedText>
              </View>
            </View>

            {/* Columna Derecha: Mapa de Google */}
            <View style={styles.mapContainer}>
              {Platform.OS === 'web' ? (
                // @ts-ignore - iframe para web
                <iframe
                  title="Mapa de Quito, Ecuador"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.7855!2d-78.4678!3d-0.1807!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91d59a9b8c8c8c8d%3A0x8c8c8c8c8c8c8c8c!2sQuito%2C%20Ecuador!5e0!3m2!1ses!2sec!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0, borderRadius: 8 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <WebView
                  source={{ uri: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.7855!2d-78.4678!3d-0.1807!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91d59a9b8c8c8c8d%3A0x8c8c8c8c8c8c8c8c!2sQuito%2C%20Ecuador!5e0!3m2!1ses!2sec!4v1234567890' }}
                  style={styles.mapWebView}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                />
              )}
            </View>
          </View>
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 48,
    paddingBottom: 48,
  },
  headerCard: {
    alignItems: 'center',
    padding: 32,
    marginBottom: 24,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
  },
  contactSection: {
    padding: 24,
    marginBottom: 24,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  contactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    justifyContent: 'center',
  },
  contactContentMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 16,
  },
  contactInfo: {
    flex: 1,
    gap: 16,
    paddingRight: 0,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationName: {
    fontSize: 24,
    fontWeight: '600',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    lineHeight: 20,
  },
  mapContainer: {
    flex: 1,
    minHeight: 200,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  mapWebView: {
    flex: 1,
  },
});
