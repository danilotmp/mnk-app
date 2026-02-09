import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

// Fix import path - they are both in src/features/auth/components
import { RegisterForm as AuthRegisterForm, VerifyEmailForm as AuthVerifyForm } from '../../components';

export function RegisterScreen() {
  const { t } = useTranslation();
  const { isMobile } = useResponsive();
  const { colors } = useTheme();
  const router = useRouter();
  
  const [mode, setMode] = useState<'register' | 'verify'>('register');
  const [email, setEmail] = useState('');

  const handleRegisterSuccess = (regEmail: string, verificationRequired: boolean) => {
    setEmail(regEmail);
    // Usar el flag retornado por el servidor
    if (verificationRequired) {
      setMode('verify');
    } else {
      router.replace('/auth/login');
    }
  };

  const handleVerifySuccess = () => {
    router.replace('/auth/login');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <ThemedText type="h2" style={styles.title}>
            {mode === 'register' ? t.auth?.register || 'Registro' : 'Verifica tu cuenta'}
          </ThemedText>
          
          {mode === 'register' ? (
            <AuthRegisterForm 
              onSuccess={handleRegisterSuccess} 
              onLoginLink={() => router.push('/auth/login')} 
            />
          ) : (
            <AuthVerifyForm 
              email={email} 
              onSuccess={handleVerifySuccess} 
              onBack={() => setMode('register')} 
            />
          )}
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
    maxWidth: 500,
    alignSelf: 'center',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    gap: 24,
  },
  title: { textAlign: 'center' },
});
