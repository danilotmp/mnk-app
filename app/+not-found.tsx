import { Stack, useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

export default function NotFoundScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Página no encontrada', headerShown: false }} />
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
          NOT FOUND
        </ThemedText>

        {/* Mensaje */}
        <ThemedText style={[styles.message, { color: colors.text }]}>
          Sorry, but you are looking for something that isn't here.
        </ThemedText>

        {/* Link */}
        <TouchableOpacity onPress={handleGoHome} style={styles.linkContainer}>
          <ThemedText type="defaultSemiBold" style={[styles.linkText, { color: colors.primary }]}>
            Go back
          </ThemedText>
        </TouchableOpacity>
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
  linkContainer: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

