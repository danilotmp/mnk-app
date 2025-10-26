import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';

export default function PaymentsPage() {
  const { colors } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Pagos', headerShown: false }} />
      <ThemedView style={styles.container}>
        <Card style={styles.card}>
          <ThemedText type="h1" variant="primary" style={styles.title}>
            Pagos con Tarjeta
          </ThemedText>

          <ThemedText type="body1" variant="secondary" style={styles.description}>
            Realiza pagos de forma segura y rápida con tu tarjeta
          </ThemedText>

          {/* Tarjeta de ejemplo */}
          <View style={[styles.cardExample, { backgroundColor: colors.primary }]}>
            <View style={styles.cardHeader}>
              <ThemedText style={styles.cardChip}>💳</ThemedText>
              <ThemedText style={styles.cardBrand}>VISA</ThemedText>
            </View>
            
            <View style={styles.cardNumberContainer}>
              <ThemedText style={styles.cardNumber}>•••• •••• •••• 1234</ThemedText>
            </View>

            <View style={styles.cardFooter}>
              <View>
                <ThemedText style={styles.cardLabel}>TITULAR</ThemedText>
                <ThemedText style={styles.cardValue}>JUAN PEREZ</ThemedText>
              </View>
              <View>
                <ThemedText style={styles.cardLabel}>EXPIRA</ThemedText>
                <ThemedText style={styles.cardValue}>12/25</ThemedText>
              </View>
            </View>
          </View>

          <ThemedText type="body2" variant="secondary" style={styles.info}>
            Esta es una tarjeta de ejemplo. En producción, aquí se mostrarían tus tarjetas reales.
          </ThemedText>
        </Card>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    marginTop: 20,
    gap: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
  },
  cardExample: {
    borderRadius: 16,
    padding: 24,
    minHeight: 200,
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  cardChip: {
    fontSize: 32,
  },
  cardBrand: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  cardNumberContainer: {
    marginBottom: 32,
  },
  cardNumber: {
    fontSize: 24,
    color: '#FFFFFF',
    letterSpacing: 4,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.7,
    marginBottom: 4,
    letterSpacing: 1,
  },
  cardValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 1,
  },
  info: {
    textAlign: 'center',
    marginTop: 16,
    opacity: 0.7,
  },
});

