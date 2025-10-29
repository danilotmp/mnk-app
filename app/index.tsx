import { HelloWave } from '@/components/hello-wave';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';
import { useCompany, useMultiCompany } from '@/src/domains/shared/hooks';
import { MultiCompanyService } from '@/src/domains/shared/services';
import { useTranslation } from '@/src/infrastructure/i18n';
import { Link } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, View } from 'react-native';

export default function HomeScreen() {
  const { colors, spacing } = useTheme();
  const { company, branch, user } = useCompany();
  const { setUserContext, isLoading } = useMultiCompany();
  const { t, interpolate } = useTranslation();

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
          <ThemedText style={{ marginTop: 16 }}>{t.common.loading}</ThemedText>
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
          <ThemedView style={styles.titleContainer} variant="transparent">
            <ThemedText type="h1" variant="primary">{t.pages.home.welcomeMessage}</ThemedText>
            <HelloWave />
          </ThemedView>
          <ThemedText type="body1" style={styles.heroDescription}>
            {t.pages.home.description}
          </ThemedText>
        </Card>

        {/* Features Section */}
        <ThemedView style={styles.featuresContainer}>
          <ThemedText type="h2" style={styles.sectionTitle}>{t.pages.home.features}</ThemedText>
          
          <Card variant="outlined" style={styles.featureCard}>
            <ThemedText type="h4" variant="secondary">{t.pages.home.step1}</ThemedText>
            <ThemedText type="body1" style={styles.featureDescription}>
              {interpolate(t.pages.home.step1Description, {
                platform: Platform.select({
                  ios: 'cmd + d',
                  android: 'cmd + m',
                  web: 'F12',
                }) || 'F12',
              })}
            </ThemedText>
          </Card>

          <Card variant="outlined" style={styles.featureCard}>
            <ThemedText type="h4" variant="secondary">{t.pages.home.step2}</ThemedText>
            <ThemedText type="body1" style={styles.featureDescription}>
              {t.pages.home.step2Description}
            </ThemedText>
            <View style={styles.buttonContainer}>
              <Link href="/modal" asChild>
                <Button
                  title={t.common.actions}
                  onPress={() => {}}
                  variant="primary"
                  size="md"
                />
              </Link>
            </View>
          </Card>

          <Card variant="outlined" style={styles.featureCard}>
            <ThemedText type="h4" variant="secondary">{t.pages.home.step3}</ThemedText>
            <ThemedText type="body1" style={styles.featureDescription}>
              {t.pages.home.step3Description}
            </ThemedText>
          </Card>
        </ThemedView>

        {/* Action Buttons */}
        <ThemedView style={styles.actionsContainer}>
          <Button
            title={t.pages.home.exploreMore}
            onPress={() => {}}
            variant="primary"
            size="lg"
            style={styles.actionButton}
          />
          <Button
            title={t.pages.home.configuration}
            onPress={() => {}}
            variant="outlined"
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
