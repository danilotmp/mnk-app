import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { InlineAlert } from '@/components/ui/inline-alert';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { useTheme } from '@/hooks/use-theme';
import { EmailInput, PasswordInput } from '@/src/domains/shared/components';
import { useTranslation } from '@/src/infrastructure/i18n';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { RegistrationService } from '../../../domains/auth/registration.service';

interface RegisterFormProps {
  onSuccess: (email: string, verificationRequired: boolean) => void;
  onLoginLink: () => void;
  isLoading?: boolean;
}

export function RegisterForm({ onSuccess, onLoginLink, isLoading: externalLoading }: RegisterFormProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<{ message: string; detail?: string } | null>(null);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'El nombre es requerido';
    if (!formData.lastName.trim()) newErrors.lastName = 'El apellido es requerido';
    if (!formData.email.trim()) {
      newErrors.email = t.auth.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    if (!formData.password.trim()) {
      newErrors.password = t.auth.passwordRequired;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setIsLoading(true);
    setGeneralError(null);
    try {
      const response = await RegistrationService.register({
        ...formData,
        email: formData.email.trim(),
      });
      
      const verificationRequired = response.data?.verificationRequired ?? true; // Default to true for safety
      onSuccess(formData.email.trim(), verificationRequired);
    } catch (error: any) {
      setGeneralError({
        message: error?.message || 'Error al registrar',
        detail: typeof error?.details === 'object' 
          ? JSON.stringify(error.details) 
          : error?.details || error?.result?.description
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <View style={styles.container}>
      {generalError && (
        <InlineAlert
          type="error"
          message={generalError.message}
          detail={generalError.detail}
          style={styles.alert}
          autoClose={false}
        />
      )}

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <ThemedText type="body2" style={styles.label}>{t.security?.users?.name || 'Nombre'} *</ThemedText>
          <InputWithFocus 
            containerStyle={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: errors.firstName ? colors.error : colors.border }]}
            primaryColor={colors.primary}
            error={!!errors.firstName}
          >
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Nombre"
              placeholderTextColor={colors.textSecondary}
              value={formData.firstName}
              onChangeText={val => handleChange('firstName', val)}
              editable={!isLoading}
            />
          </InputWithFocus>
        </View>

        <View style={[styles.inputGroup, { flex: 1 }]}>
          <ThemedText type="body2" style={styles.label}>{t.security?.users?.lastName || 'Apellido'} *</ThemedText>
          <InputWithFocus 
            containerStyle={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: errors.lastName ? colors.error : colors.border }]}
            primaryColor={colors.primary}
            error={!!errors.lastName}
          >
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Apellido"
              placeholderTextColor={colors.textSecondary}
              value={formData.lastName}
              onChangeText={val => handleChange('lastName', val)}
              editable={!isLoading}
            />
          </InputWithFocus>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <ThemedText type="body2" style={styles.label}>{t.auth.email} *</ThemedText>
        <EmailInput
          value={formData.email}
          onChangeText={(val) => handleChange('email', val)}
          placeholder={t.auth.email}
          required
          error={!!errors.email}
          errorMessage={errors.email}
          disabled={isLoading}
        />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText type="body2" style={styles.label}>{t.auth.password} *</ThemedText>
        <PasswordInput
          value={formData.password}
          onChangeText={(val) => handleChange('password', val)}
          placeholder={t.auth.password}
          required
          error={!!errors.password}
          errorMessage={errors.password}
          disabled={isLoading}
        />
      </View>

      <Button
        title={isLoading ? t.common.loading : t.auth.signUp}
        onPress={handleRegister}
        variant="primary"
        size="lg"
        disabled={isLoading || externalLoading}
        style={styles.submitButton}
      >
        {isLoading && <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />}
      </Button>

      <View style={styles.footer}>
        <ThemedText type="body2" variant="secondary">{t.auth.alreadyHaveAccount} </ThemedText>
        <TouchableOpacity onPress={onLoginLink} disabled={isLoading}>
          <ThemedText type="body2" variant="primary" style={{ fontWeight: '600' }}>{t.auth.signIn}</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  alert: { marginBottom: 8 },
  row: { flexDirection: 'row', gap: 12 },
  inputGroup: { gap: 8 },
  label: { fontWeight: '600' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  input: { flex: 1, fontSize: 16 },
  submitButton: { marginTop: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
});
