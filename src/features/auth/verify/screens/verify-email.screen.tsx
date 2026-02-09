import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { VerifyEmailForm } from '../../components/verify-email-form';

export function VerifyEmailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const handleSuccess = () => {
    router.replace('/auth/login');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <ThemedText type="h2" style={styles.title}>Verificar correo</ThemedText>
          <VerifyEmailForm 
            email={email || ''} 
            onSuccess={handleSuccess} 
            onBack={() => router.back()} 
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: {
    width: '100%',
    maxWidth: 450,
    alignSelf: 'center',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    gap: 24,
  },
  title: { textAlign: 'center' },
});
