import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';

export default function InsurancePage() {
  const { colors } = useTheme();

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <ThemedText type="h1" variant="primary" style={styles.title}>
            Seguros
          </ThemedText>
          
          <ThemedText type="body1" variant="secondary" style={styles.description}>
            Protege lo que más importa con nuestros seguros
          </ThemedText>

          {/* Tipos de seguros */}
          <View style={styles.insuranceTypes}>
            <Card variant="outlined" style={styles.insuranceCard}>
              <ThemedText type="h4" variant="primary">Seguro de Vida</ThemedText>
              <ThemedText type="body2" variant="secondary" style={styles.cardDescription}>
                Protección para tu familia
              </ThemedText>
            </Card>

            <Card variant="outlined" style={styles.insuranceCard}>
              <ThemedText type="h4" variant="primary">Seguro de Salud</ThemedText>
              <ThemedText type="body2" variant="secondary" style={styles.cardDescription}>
                Cobertura médica completa
              </ThemedText>
            </Card>

            <Card variant="outlined" style={styles.insuranceCard}>
              <ThemedText type="h4" variant="primary">Seguro Vehicular</ThemedText>
              <ThemedText type="body2" variant="secondary" style={styles.cardDescription}>
                Protección para tu vehículo
              </ThemedText>
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
  insuranceTypes: {
    gap: 16,
  },
  insuranceCard: {
    padding: 16,
  },
  cardDescription: {
    marginTop: 8,
    opacity: 0.7,
  },
});

