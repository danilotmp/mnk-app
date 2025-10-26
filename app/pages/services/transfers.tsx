import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';

export default function TransfersPage() {
  const { colors } = useTheme();

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <ThemedText type="h1" variant="primary" style={styles.title}>
            Transferencias
          </ThemedText>
          
          <ThemedText type="body1" variant="secondary" style={styles.description}>
            Realiza transferencias entre cuentas de forma rápida y segura
          </ThemedText>

          {/* Formulario de transferencia */}
          <View style={styles.form}>
            <Card variant="outlined" style={styles.formCard}>
              <ThemedText type="h3" variant="secondary" style={styles.formTitle}>
                Nueva Transferencia
              </ThemedText>
              
              <ThemedText type="body2" variant="secondary" style={styles.info}>
                Ejemplo de formulario de transferencia
              </ThemedText>
            </Card>
          </View>

          {/* Historial */}
          <View style={styles.history}>
            <ThemedText type="h3" variant="secondary" style={styles.historyTitle}>
              Transferencias Recientes
            </ThemedText>
            
            <Card variant="outlined" style={styles.historyCard}>
              <ThemedText type="body2" variant="secondary">
                Aquí se mostraría el historial de transferencias
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
  form: {
    marginBottom: 24,
  },
  formCard: {
    padding: 16,
  },
  formTitle: {
    marginBottom: 12,
  },
  info: {
    opacity: 0.7,
  },
  history: {
    marginTop: 8,
  },
  historyTitle: {
    marginBottom: 12,
  },
  historyCard: {
    padding: 16,
  },
});

