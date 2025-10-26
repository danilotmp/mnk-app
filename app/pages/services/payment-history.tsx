import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';

export default function PaymentHistoryPage() {
  const { colors } = useTheme();

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <ThemedText type="h1" variant="primary" style={styles.title}>
            Historial de Pagos
          </ThemedText>
          
          <ThemedText type="body1" variant="secondary" style={styles.description}>
            Revisa todos tus pagos realizados
          </ThemedText>

          {/* Lista de pagos */}
          <View style={styles.paymentsList}>
            <Card variant="outlined" style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <ThemedText type="defaultSemiBold">Factura de Luz</ThemedText>
                <ThemedText type="defaultSemiBold" variant="accent">$120.00</ThemedText>
              </View>
              <ThemedText type="caption" variant="secondary">Pagado el 15/10/2024</ThemedText>
            </Card>

            <Card variant="outlined" style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <ThemedText type="defaultSemiBold">Factura de Agua</ThemedText>
                <ThemedText type="defaultSemiBold" variant="accent">$45.00</ThemedText>
              </View>
              <ThemedText type="caption" variant="secondary">Pagado el 14/10/2024</ThemedText>
            </Card>

            <Card variant="outlined" style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <ThemedText type="defaultSemiBold">Netflix</ThemedText>
                <ThemedText type="defaultSemiBold" variant="accent">$15.99</ThemedText>
              </View>
              <ThemedText type="caption" variant="secondary">Pagado el 12/10/2024</ThemedText>
            </Card>
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
  },
  card: {
    gap: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
  },
  paymentsList: {
    gap: 12,
  },
  paymentCard: {
    padding: 16,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
});

