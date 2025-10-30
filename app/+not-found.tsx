import { createNotFoundStyles } from '@/src/styles/components/not-found.styles';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, View, useWindowDimensions } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/src/infrastructure/i18n';

export default function NotFoundScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const styles = createNotFoundStyles(width);

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

// estilos movidos a src/styles/components/not-found.styles.ts

