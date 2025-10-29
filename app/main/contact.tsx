import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/src/infrastructure/i18n';

interface OfficeInfo {
  name: string;
  address: string;
  phone: string;
  mobile?: string;
  email?: string;
  schedule: string;
  color: string;
}

export default function ContactPage() {
  const { colors, spacing } = useTheme();
  const { t } = useTranslation();

  const offices: OfficeInfo[] = [
    {
      name: 'Quito',
      address: 'Av. República de El Salvador N36-84 y Naciones Unidas. Edificio Quilate.',
      phone: '(593) 2 6020-920',
      mobile: '099 037 6254',
      email: 'info@mnk-demo.com',
      schedule: 'Lunes a Viernes de 08:30 a 17:30',
      color: colors.primary,
    },
    {
      name: 'Guayaquil',
      address: 'Av. Carlos Julio Arosemena KM3, junto al Colegio 28 de Mayo.',
      phone: '(593) 4 6020-920',
      mobile: '099 037 6254',
      email: 'info@mnk-demo.com',
      schedule: 'Lunes a Viernes de 08:30 a 17:30',
      color: colors.secondary,
    },
    {
      name: 'Cuenca',
      address: 'Av. Remigio Crespo Toral #3-32 y calle Agustín Cueva, junto al local de Keramicos.',
      phone: '099 949 4825',
      email: 'info@mnk-demo.com',
      schedule: 'Lunes a Viernes: 08:30 a 13:00, 14:00 a 17:30',
      color: colors.accent,
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Card style={styles.headerCard}>
          <Ionicons name="call" size={64} color={colors.primary} />
          <ThemedText type="h1" variant="primary" style={styles.title}>
            {t.pages.contact.title}
          </ThemedText>
          <ThemedText type="body1" variant="secondary" style={styles.subtitle}>
            {t.pages.contact.subtitle}
          </ThemedText>
        </Card>

        {/* Número Principal de Atención */}
        <Card style={styles.mainContactCard}>
          <View style={styles.mainContact}>
            <Ionicons name="call-circle" size={48} color={colors.primary} />
            <ThemedText type="h2" variant="primary" style={styles.mainPhoneTitle}>
              {t.pages.contact.needHelp}
            </ThemedText>
            <ThemedText type="h2" variant="primary">
              6020-920
            </ThemedText>
            <ThemedText type="body2" variant="secondary" style={styles.mainPhoneSubtitle}>
              {t.pages.contact.customerService}
            </ThemedText>
            <ThemedText type="body2" variant="secondary">
              Lunes a Viernes: 08:30 a 17:30
            </ThemedText>
          </View>
        </Card>

        {/* Nuestras Oficinas */}
        <Card style={styles.officesCard}>
          <ThemedText type="h2" variant="primary" style={styles.sectionTitle}>
            {t.pages.contact.offices}
          </ThemedText>
          <ThemedText type="body2" variant="secondary" style={styles.sectionSubtitle}>
            {t.pages.contact.officesSubtitle}
          </ThemedText>

          {offices.map((office, index) => (
            <Card key={office.name} style={[styles.officeCard, { borderLeftColor: office.color }]}>
              <View style={styles.officeHeader}>
                <View style={[styles.officeIconContainer, { backgroundColor: office.color }]}>
                  <Ionicons name="location" size={24} color="#FFFFFF" />
                </View>
                <ThemedText type="h3" variant="primary">
                  {office.name}
                </ThemedText>
              </View>

              <View style={styles.officeContent}>
                <View style={styles.officeItem}>
                  <Ionicons name="map-outline" size={20} color={colors.textSecondary} />
                  <ThemedText type="body2" variant="secondary" style={styles.officeText}>
                    {office.address}
                  </ThemedText>
                </View>

                <View style={styles.officeItem}>
                  <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
                  <ThemedText type="body2" variant="secondary" style={styles.officeText}>
                    {office.phone}
                  </ThemedText>
                </View>

                {office.mobile && (
                  <View style={styles.officeItem}>
                    <Ionicons name="phone-portrait-outline" size={20} color={colors.textSecondary} />
                    <ThemedText type="body2" variant="secondary" style={styles.officeText}>
                      {office.mobile}
                    </ThemedText>
                  </View>
                )}

                <View style={styles.officeItem}>
                  <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                  <ThemedText type="body2" variant="secondary" style={styles.officeText}>
                    {office.schedule}
                  </ThemedText>
                </View>
              </View>
            </Card>
          ))}
        </Card>

        {/* Asistencia 24/7 */}
        <Card style={styles.assistanceCard}>
          <View style={styles.assistanceHeader}>
            <Ionicons name="medical" size={48} color={colors.error} />
            <View style={styles.assistanceContent}>
              <ThemedText type="h3" variant="primary">
                Asistencia 24/7
              </ThemedText>
              <ThemedText type="body2" variant="secondary" style={styles.assistanceSubtitle}>
                (02) 6020-920 - Opción 1
              </ThemedText>
              <ThemedText type="caption" variant="secondary">
                Atención médica de emergencia
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Oficina Virtual */}
        <Card style={styles.virtualCard}>
          <View style={styles.virtualHeader}>
            <Ionicons name="laptop" size={48} color={colors.primary} />
            <View style={styles.virtualContent}>
              <ThemedText type="h3" variant="primary">
                Oficina Virtual
              </ThemedText>
              <ThemedText type="body2" variant="secondary" style={styles.virtualSubtitle}>
                Realiza tus trámites en línea, sin salir de casa
              </ThemedText>
              <TouchableOpacity style={[styles.virtualButton, { backgroundColor: colors.primary }]}>
                <ThemedText type="defaultSemiBold" style={{ color: '#FFFFFF' }}>
                  Acceder
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Mapa de Ubicación */}
        <Card style={styles.mapCard}>
          <ThemedText type="h3" variant="primary" style={styles.sectionTitle}>
            Ubicación
          </ThemedText>
          
          <View style={[styles.mapPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="map" size={64} color={colors.textSecondary} />
            <ThemedText type="body2" variant="secondary" style={styles.mapText}>
              Mapa interactivo - Coming Soon
            </ThemedText>
            <ThemedText type="caption" variant="secondary" style={styles.mapInfo}>
              Av. República de El Salvador N36-84, Quito, Ecuador
            </ThemedText>
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
    padding: 20,
    paddingBottom: 40,
  },
  headerCard: {
    alignItems: 'center',
    padding: 32,
    marginBottom: 24,
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
  mainContactCard: {
    marginBottom: 24,
    padding: 24,
  },
  mainContact: {
    alignItems: 'center',
  },
  mainPhoneTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  mainPhoneSubtitle: {
    marginTop: 8,
    opacity: 0.8,
  },
  officesCard: {
    marginBottom: 24,
    padding: 24,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  sectionSubtitle: {
    marginBottom: 20,
    opacity: 0.8,
  },
  officeCard: {
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderRadius: 8,
  },
  officeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  officeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  officeContent: {
    gap: 12,
  },
  officeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  officeText: {
    flex: 1,
    lineHeight: 20,
  },
  assistanceCard: {
    marginBottom: 24,
    padding: 24,
  },
  assistanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  assistanceContent: {
    flex: 1,
  },
  assistanceSubtitle: {
    marginTop: 8,
    fontWeight: '600',
  },
  virtualCard: {
    marginBottom: 24,
    padding: 24,
  },
  virtualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  virtualContent: {
    flex: 1,
  },
  virtualSubtitle: {
    marginTop: 8,
    marginBottom: 16,
    opacity: 0.8,
  },
  virtualButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  mapCard: {
    marginBottom: 24,
    padding: 24,
  },
  mapPlaceholder: {
    height: 300,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  mapText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  mapInfo: {
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.7,
  },
});
