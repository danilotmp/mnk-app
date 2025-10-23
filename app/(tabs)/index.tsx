import { HelloWave } from '@/components/hello-wave';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';
import {
    MultiCompanyService,
    useCompany,
    useMultiCompany
} from '@/src/domains/shared';
import { Link } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, View } from 'react-native';

export default function HomeScreen() {
  const { colors, spacing } = useTheme();
  const { company, branch, user } = useCompany();
  const { setUserContext, isLoading } = useMultiCompany();

  // Simular login automático del usuario "danilo" para demostración
  useEffect(() => {
    const initUser = async () => {
      if (!user) {
        const service = MultiCompanyService.getInstance();
        const mockUsers = service.getMockUsers();
        // Usar el primer usuario (Danilo - Administrador)
        await setUserContext(mockUsers[0]);
      }
    };
    initUser();
  }, []);

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={{ marginTop: 16 }}>Cargando información...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <Card variant="elevated" style={styles.heroCard}>
          <ThemedView style={styles.titleContainer}>
            <ThemedText type="h1" variant="primary">¡Bienvenido!</ThemedText>
            <HelloWave />
          </ThemedView>
          <ThemedText type="body1" style={styles.heroDescription}>
            Descubre una experiencia única con nuestra aplicación diseñada especialmente para ti.
          </ThemedText>
        </Card>

        {/* Features Section */}
        <ThemedView style={styles.featuresContainer}>
          <ThemedText type="h2" style={styles.sectionTitle}>Características</ThemedText>
          
          <Card variant="outlined" style={styles.featureCard}>
            <ThemedText type="h4" variant="secondary">Paso 1: Pruébalo</ThemedText>
            <ThemedText type="body1" style={styles.featureDescription}>
              Edita <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> para ver los cambios.
              Presiona{' '}
              <ThemedText type="defaultSemiBold" variant="accent">
                {Platform.select({
                  ios: 'cmd + d',
                  android: 'cmd + m',
                  web: 'F12',
                })}
              </ThemedText>{' '}
              para abrir las herramientas de desarrollador.
            </ThemedText>
          </Card>

          <Card variant="outlined" style={styles.featureCard}>
            <ThemedText type="h4" variant="secondary">Paso 2: Explora</ThemedText>
            <ThemedText type="body1" style={styles.featureDescription}>
              Toca la pestaña Explorar para aprender más sobre lo que incluye esta aplicación.
            </ThemedText>
            <View style={styles.buttonContainer}>
              <Link href="/modal" asChild>
                <Button
                  title="Abrir Modal"
                  onPress={() => {}}
                  variant="primary"
                  size="md"
                />
              </Link>
            </View>
          </Card>

          <Card variant="outlined" style={styles.featureCard}>
            <ThemedText type="h4" variant="secondary">Paso 3: Comienza de nuevo</ThemedText>
            <ThemedText type="body1" style={styles.featureDescription}>
              Cuando estés listo, ejecuta{' '}
              <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> para obtener un directorio{' '}
              <ThemedText type="defaultSemiBold">app</ThemedText> fresco.
            </ThemedText>
          </Card>
        </ThemedView>

        {/* Action Buttons */}
        <ThemedView style={styles.actionsContainer}>
          <Button
            title="Explorar más"
            onPress={() => {}}
            variant="primary"
            size="lg"
            style={styles.actionButton}
          />
          <Button
            title="Configuración"
            onPress={() => {}}
            variant="outline"
            size="lg"
            style={styles.actionButton}
          />
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  heroCard: {
    marginBottom: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  heroDescription: {
    textAlign: 'center',
    opacity: 0.8,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  featureCard: {
    marginBottom: 16,
  },
  featureDescription: {
    marginTop: 8,
    lineHeight: 24,
  },
  buttonContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    width: '100%',
  },
});
