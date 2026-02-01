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

  // URL del mapa: obtener una actual desde Google Maps (Compartir > Insertar mapa)
  const googleMapsEmbedUrl =
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.7855!2d-78.4678!3d-0.1807!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91d59a9b8c8c8c8d%3A0x8c8c8c8c8c8c8c8c!2sQuito%2C%20Ecuador!5e0!3m2!1ses!2sec!4v1234567890';

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.contactSection}>
          <View style={[
            styles.twoColumns,
            isMobile && styles.twoColumnsMobile
          ]}>
            {/* Columna Izquierda: Header + Información de Matriz */}
            <View style={styles.leftColumn}>
              {/* Header con Icono, Título y Subtítulo (mismo estilo que Capabilities) */}
              <View style={styles.headerSection}>
                <View style={styles.headerRow}>
                  <Ionicons name="call" size={48} color={colors.text} />
                  <ThemedText type="h1" style={[styles.title, { color: colors.text }]}>
                    {t.pages.contact.title}
                  </ThemedText>
                </View>
                <ThemedText type="body1" style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {t.pages.contact.subtitle}
                </ThemedText>
              </View>

              {/* Información de Matriz - Card con icono superpuesto */}
              <View style={[styles.matrixCardWrapper, { backgroundColor: colors.surface }]}>
                <View style={[styles.matrixIconBlock, { backgroundColor: colors.primary }]}>
                  <Ionicons name="location" size={35} color="#FFFFFF" />
                </View>
                <View style={styles.matrixCardContent}>
                  <ThemedText type="h2" variant="primary" style={styles.locationName}>
                    Matriz
                  </ThemedText>
                  <View style={styles.matrixRow}>
                    <Ionicons name="map-outline" size={18} color={colors.textSecondary} />
                    <ThemedText type="body2" variant="secondary" style={styles.contactText}>
                      Quito - Ecuador
                    </ThemedText>
                  </View>
                  <View style={styles.matrixRow}>
                    <Ionicons name="phone-portrait-outline" size={18} color={colors.textSecondary} />
                    <ThemedText type="body2" variant="secondary" style={styles.contactText}>
                      0987255382
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
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={[styles.mapContainer, isMobile && styles.mapContainerMobile]}>
                {Platform.OS === 'web' ? (
                  // @ts-ignore - iframe para web
                  <iframe
                    title="Mapa de Quito, Ecuador"
                    src={googleMapsEmbedUrl}
                    width="100%"
                    height="100%"
                    style={{
                      border: 0,
                      borderRadius: 24,
                      display: 'block',
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
  contactSection: {
    padding: 24,
    marginBottom: 24,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'flex-start',
  },
  twoColumnsMobile: {
    flexDirection: 'column',
    gap: 24,
  },
  leftColumn: {
    flex: 1,
  },
  headerSection: {
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'nowrap',
  },
  title: {
    marginTop: 0,
    marginBottom: 0,
    textAlign: 'left',
    flexShrink: 0,
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'left',
  },
  matrixCardWrapper: {
    marginTop: 45,
    borderRadius: 20,
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 24,
    minHeight: 140,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  matrixIconBlock: {
    position: 'absolute',
    top: -14,
    left: 24,
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  matrixCardContent: {
    gap: 12,
  },
  locationName: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 4,
  },
  matrixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  mapCardWrapper: {
    width: 624,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  mapCardWrapperMobile: {
    width: '100%',
  },
  mapContainer: {
    width: '100%',
    height: 400,
    minHeight: 400,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#e8eaed',
  },
  mapContainerMobile: {
    height: 280,
    minHeight: 280,
  },
  mapWebView: {
    width: '100%',
    height: '100%',
  },
});
