import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible } from '@/components/ui/collapsible';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Image } from 'expo-image';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

export default function TabTwoScreen() {
  const { colors, spacing } = useTheme();

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <Card variant="elevated" style={styles.heroCard}>
          <View style={styles.heroContent}>
            <IconSymbol
              size={80}
              color={colors.primary}
              name="chevron.left.forwardslash.chevron.right"
              style={styles.heroIcon}
            />
            <ThemedText type="h1" variant="primary" style={styles.heroTitle}>
              Explorar
            </ThemedText>
            <ThemedText type="body1" style={styles.heroDescription}>
              Esta aplicación incluye código de ejemplo para ayudarte a comenzar.
            </ThemedText>
          </View>
        </Card>

        {/* Features Section */}
        <ThemedView style={styles.featuresContainer}>
          <ThemedText type="h2" style={styles.sectionTitle}>Características</ThemedText>
          
          <Card variant="outlined" style={styles.featureCard}>
            <Collapsible title="Enrutamiento basado en archivos">
              <ThemedText type="body1" style={styles.collapsibleContent}>
                Esta aplicación tiene dos pantallas:{' '}
                <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> y{' '}
                <ThemedText type="defaultSemiBold">app/(tabs)/explore.tsx</ThemedText>
              </ThemedText>
              <ThemedText type="body1" style={styles.collapsibleContent}>
                El archivo de diseño en <ThemedText type="defaultSemiBold">app/(tabs)/_layout.tsx</ThemedText>{' '}
                configura el navegador de pestañas.
              </ThemedText>
              <View style={styles.linkContainer}>
                <ExternalLink href="https://docs.expo.dev/router/introduction">
                  <ThemedText type="link">Aprender más</ThemedText>
                </ExternalLink>
              </View>
            </Collapsible>
          </Card>

          <Card variant="outlined" style={styles.featureCard}>
            <Collapsible title="Soporte para Android, iOS y web">
              <ThemedText type="body1" style={styles.collapsibleContent}>
                Puedes abrir este proyecto en Android, iOS y la web. Para abrir la versión web, presiona{' '}
                <ThemedText type="defaultSemiBold" variant="accent">w</ThemedText> en la terminal que ejecuta este proyecto.
              </ThemedText>
            </Collapsible>
          </Card>

          <Card variant="outlined" style={styles.featureCard}>
            <Collapsible title="Imágenes">
              <ThemedText type="body1" style={styles.collapsibleContent}>
                Para imágenes estáticas, puedes usar los sufijos <ThemedText type="defaultSemiBold">@2x</ThemedText> y{' '}
                <ThemedText type="defaultSemiBold">@3x</ThemedText> para proporcionar archivos para
                diferentes densidades de pantalla
              </ThemedText>
              <View style={styles.imageContainer}>
                <Image
                  source={require('@/assets/images/react-logo.png')}
                  style={styles.reactLogo}
                />
              </View>
              <View style={styles.linkContainer}>
                <ExternalLink href="https://reactnative.dev/docs/images">
                  <ThemedText type="link">Aprender más</ThemedText>
                </ExternalLink>
              </View>
            </Collapsible>
          </Card>

          <Card variant="outlined" style={styles.featureCard}>
            <Collapsible title="Componentes de modo claro y oscuro">
              <ThemedText type="body1" style={styles.collapsibleContent}>
                Esta plantilla tiene soporte para modo claro y oscuro. El hook{' '}
                <ThemedText type="defaultSemiBold">useColorScheme()</ThemedText> te permite inspeccionar
                cuál es el esquema de color actual del usuario, y así puedes ajustar los colores de la UI en consecuencia.
              </ThemedText>
              <View style={styles.linkContainer}>
                <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
                  <ThemedText type="link">Aprender más</ThemedText>
                </ExternalLink>
              </View>
            </Collapsible>
          </Card>

          <Card variant="outlined" style={styles.featureCard}>
            <Collapsible title="Animaciones">
              <ThemedText type="body1" style={styles.collapsibleContent}>
                Esta plantilla incluye un ejemplo de componente animado. El componente{' '}
                <ThemedText type="defaultSemiBold">components/HelloWave.tsx</ThemedText> usa
                la poderosa biblioteca{' '}
                <ThemedText type="defaultSemiBold" style={{ fontFamily: Fonts.mono }}>
                  react-native-reanimated
                </ThemedText>{' '}
                para crear una animación de mano saludando.
              </ThemedText>
              {Platform.select({
                ios: (
                  <ThemedText type="body1" style={styles.collapsibleContent}>
                    El componente <ThemedText type="defaultSemiBold">components/ParallaxScrollView.tsx</ThemedText>{' '}
                    proporciona un efecto de paralaje para la imagen del encabezado.
                  </ThemedText>
                ),
              })}
            </Collapsible>
          </Card>
        </ThemedView>

        {/* Action Buttons */}
        <ThemedView style={styles.actionsContainer}>
          <Button
            title="Ver documentación"
            onPress={() => {}}
            variant="primary"
            size="lg"
            style={styles.actionButton}
          />
          <Button
            title="GitHub"
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
  heroContent: {
    alignItems: 'center',
  },
  heroIcon: {
    marginBottom: 16,
  },
  heroTitle: {
    marginBottom: 8,
    textAlign: 'center',
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
  collapsibleContent: {
    marginBottom: 8,
    lineHeight: 24,
  },
  linkContainer: {
    marginTop: 8,
    alignItems: 'flex-start',
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  reactLogo: {
    width: 100,
    height: 100,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    width: '100%',
  },
});
