import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/src/infrastructure/i18n';

export default function NotFoundScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleContactUs = () => {
    router.push('main/contact' as any);
  };

  return (
    <>
      <Stack.Screen options={{ title: t.pages.notFound.title, headerShown: false }} />
      <ThemedView style={styles.container}>
        {/* Icono de archivos apilados */}
        <View style={styles.iconContainer}>
          <View style={styles.iconStack}>
            {/* Documentos de fondo */}
            <View style={[styles.documentBack, styles.documentLeft, { backgroundColor: colors.surfaceVariant }]} />
            <View style={[styles.documentBack, styles.documentRight, { backgroundColor: colors.surfaceVariant }]} />
            {/* Documento principal */}
            <View style={[styles.documentFront, { backgroundColor: colors.surface }]}>
              <ThemedText style={styles.questionMark}>?</ThemedText>
            </View>
          </View>
        </View>

        {/* Título */}
        <ThemedText style={[styles.title, { color: colors.text }]}>
          {t.pages.notFound.title.toUpperCase()}
        </ThemedText>

        {/* Mensaje */}
        <ThemedText style={[styles.message, { color: colors.text }]}>
          {t.pages.notFound.message}
        </ThemedText>

        {/* Links con Go Back a la izquierda y Go Home centrado */}
        <View style={styles.linksContainer}>
          {/* Sección izquierda - Go Back */}
          <View style={styles.leftSection}>
            <TouchableOpacity onPress={handleGoBack} style={styles.linkButton}>
              <Ionicons name="arrow-back" size={18} color={colors.primary} />
              <ThemedText type="defaultSemiBold" style={[styles.linkText, { color: colors.primary }]}>
                {t.pages.notFound.goBack}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Sección central - Go Home */}
          <View style={styles.centerSection}>
            <TouchableOpacity onPress={handleGoHome} style={styles.linkButton}>
              <Ionicons name="home" size={18} color={colors.primary} />
              <ThemedText type="defaultSemiBold" style={[styles.linkText, { color: colors.primary }]}>
                {t.pages.notFound.goHome}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Sección derecha - Contact Us */}
          <View style={styles.rightSection}>
            <TouchableOpacity onPress={handleContactUs} style={styles.linkButton}>
              <Ionicons name="mail" size={18} color={colors.primary} />
              <ThemedText type="defaultSemiBold" style={[styles.linkText, { color: colors.primary }]}>
                {t.pages.notFound.contactUs}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconStack: {
    width: 140,
    height: 160,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentBack: {
    position: 'absolute',
    width: 100,
    height: 120,
    borderRadius: 8,
    opacity: 0.6,
  },
  documentLeft: {
    left: 0,
    top: 15,
    transform: [{ rotate: '-8deg' }],
  },
  documentRight: {
    right: 0,
    top: 15,
    transform: [{ rotate: '8deg' }],
  },
  documentFront: {
    width: 100,
    height: 120,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    zIndex: 3,
  },
  questionMark: {
    fontSize: 120,
    fontWeight: 'bold',
    opacity: 0.9,
  },
  title: {
    fontSize: 64,
    fontWeight: 'bold',
    letterSpacing: 0,
    marginBottom: 32,
  },
  message: {
    textAlign: 'center',
    marginBottom: 40,
    fontSize: 14,
    opacity: 0.8,
  },
  linksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 600,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

