import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { InlineAlert } from '@/components/ui/inline-alert';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/src/infrastructure/i18n';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { RegistrationService } from '../../../domains/auth/registration.service';

interface VerifyEmailFormProps {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
}

export function VerifyEmailForm({ email, onSuccess, onBack }: VerifyEmailFormProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [generalError, setGeneralError] = useState<{ message: string; detail?: string } | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let timer: any;
    if (resendTimer > 0) {
      timer = setInterval(() => setResendTimer(t => t - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleVerify = async () => {
    if (code.length !== 6) return;

    setIsLoading(true);
    setGeneralError(null);
    try {
      await RegistrationService.verifyEmail({ email, code });
      onSuccess();
    } catch (error: any) {
      setGeneralError({
        message: error?.message || 'Error al verificar código',
        detail: typeof error?.details === 'object' 
          ? JSON.stringify(error.details) 
          : error?.details || error?.result?.description
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || resending) return;

    setResending(true);
    setGeneralError(null);
    try {
      await RegistrationService.resendCode({ email });
      setResendTimer(60); // 1 minuto de espera
    } catch (error: any) {
      setGeneralError({
        message: error?.message || 'Error al reenviar código',
        detail: typeof error?.details === 'object' 
          ? JSON.stringify(error.details) 
          : error?.details || error?.result?.description
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <ThemedText type="body2" variant="secondary" style={styles.description}>
        {t.auth?.verifyEmailSubtitle || 'Ingresa el código de 6 dígitos que enviamos a'}
        <ThemedText type="body2" style={{ fontWeight: '700' }}> {email}</ThemedText>
      </ThemedText>

      {generalError && (
        <InlineAlert
          type="error"
          message={generalError.message}
          detail={generalError.detail}
          style={styles.alert}
          autoClose={false}
        />
      )}

      <View style={styles.inputGroup}>
        <NumericInput
          value={code}
          onChangeText={(val) => setCode(val)}
          placeholder="000000"
          maxLength={6}
          disabled={isLoading}
          letterSpacing={8}
        />
      </View>

      <Button
        title={isLoading ? t.common.loading : t.auth?.verify || 'Verificar Cuenta'}
        onPress={handleVerify}
        variant="primary"
        size="lg"
        disabled={isLoading || code.length !== 6}
        style={styles.submitButton}
      >
        {isLoading && <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />}
      </Button>

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0 || resending || isLoading}>
          <ThemedText type="body2" variant={resendTimer > 0 ? 'secondary' : 'primary'} style={{ fontWeight: '600' }}>
            {resending ? 'Reenviando...' : resendTimer > 0 ? `Reenviar en ${resendTimer}s` : t.auth?.resendCode || 'Reenviar código'}
          </ThemedText>
        </TouchableOpacity>
        
        <View style={{ width: 1, height: 16, backgroundColor: colors.border, marginHorizontal: 16 }} />

        <TouchableOpacity onPress={onBack} disabled={isLoading}>
          <ThemedText type="body2" variant="secondary">{t.common?.back || 'Volver'}</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 24 },
  description: { textAlign: 'center', lineHeight: 20 },
  alert: { marginBottom: 8 },
  inputGroup: { alignItems: 'center' },
  inputContainer: {
    width: 240,
    height: 60,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
  },
  input: { 
    fontSize: 28, 
    fontWeight: '700', 
    textAlign: 'center', 
    width: '100%',
    paddingHorizontal: 0,
    paddingLeft: 8, // Compensar el letterSpacing para que el centro sea real
  },
  submitButton: { marginTop: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 },
});
