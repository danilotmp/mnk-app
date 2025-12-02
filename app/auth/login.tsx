/**
 * Página de Login
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';
import { useMultiCompany } from '@/src/domains/shared/hooks';
import { UserSessionService, UserContextService } from '@/src/domains/shared/services';
import { SUCCESS_STATUS_CODE } from '@/src/infrastructure/api/constants';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { extractErrorMessage, extractErrorDetail } from '@/src/infrastructure/messages/error-utils';
import { authService } from '@/src/infrastructure/services/auth.service';
import { mapUserResponseToMultiCompanyUser } from '@/src/infrastructure/services/user-mapper.service';
import { useSession } from '@/src/infrastructure/session';
import { UserResponse } from '@/src/domains/shared/types/api/user-response.types';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function LoginPage() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { setUserContext } = useMultiCompany();
  const { saveSession } = useSession();
  const alert = useAlert();
  const userSessionService = UserSessionService.getInstance();
  const userContextService = UserContextService.getInstance();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!email.trim()) {
      newErrors.email = t.auth.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!password.trim()) {
      newErrors.password = t.auth.passwordRequired;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await authService.login({
        email: email.trim(),
        password: password,
      });

      const isSuccess = response.result?.statusCode === SUCCESS_STATUS_CODE;
      if (isSuccess && response.data && response.data.user) {
        alert.showSuccess(t.api.loginSuccess || 'Inicio de sesión exitoso');
        
        try {
          // Verificar que el token esté guardado después del login
          const { apiClient } = await import('@/src/infrastructure/api/api.client');
          let tokens = await apiClient.getTokens();
          
          // Si no hay token, esperar un momento y verificar de nuevo (puede ser un problema de timing)
          if (!tokens || !tokens.accessToken) {
            await new Promise(resolve => setTimeout(resolve, 200));
            tokens = await apiClient.getTokens();
            if (!tokens || !tokens.accessToken) {
              throw new Error('Token de autenticación no disponible después del login');
            }
          }
          
          const userProfile = await authService.getProfile() as UserResponse;
          
          if (!userProfile || !userProfile.id) {
            throw new Error('No se pudo obtener el perfil del usuario');
          }
          
          if (!userProfile.companies || !Array.isArray(userProfile.companies) || userProfile.companies.length === 0) {
            throw new Error('El usuario no tiene empresas asignadas');
          }
          
          if (!userProfile.companyIdDefault) {
            throw new Error('El usuario no tiene una empresa por defecto');
          }
          
          await userSessionService.saveUser(userProfile);
          
          await userSessionService.setCurrentCompany(userProfile.companyIdDefault, true);
          
          if (userProfile.branchIdDefault) {
            await userSessionService.setCurrentBranch(userProfile.branchIdDefault, true);
          }
          
          // Verificar nuevamente el token antes de inicializar contexto (que llama al menú)
          tokens = await apiClient.getTokens();
          if (!tokens || !tokens.accessToken) {
            throw new Error('Token de autenticación no disponible para obtener el menú');
          }
          
          // Inicializar contexto después de asegurar que el token está disponible
          await userContextService.initializeContext();
          
          const mappedUser = mapUserResponseToMultiCompanyUser(userProfile);
          await setUserContext(mappedUser);
          
          setIsLoading(false);
          router.replace('/');
        } catch (profileError: any) {
          console.error('Error al obtener perfil:', profileError);
          alert.showError(profileError?.message || t.api.loginFailed || 'Error al procesar la información del usuario');
          setIsLoading(false);
        }
      } else {
        // Usar extractErrorMessage para manejar correctamente si description es array o string
        const errorMessage = extractErrorMessage(response) || t.auth.invalidCredentials;
        const errorDetail = extractErrorDetail(response) || '';
        
        alert.showError(errorMessage, false, undefined, errorDetail);
        setErrors({ general: errorMessage });
        setIsLoading(false);
      }
    } catch (error: any) {
      let errorMessage = t.api.loginFailed;
      let errorDetail = '';
      if (error?.message) {
        errorMessage = error.message;
      }
      if (error?.details) {
        errorDetail = error.details;
      } else if (error?.result?.details) {
        errorDetail = error.result.details;
      }
      alert.showError(errorMessage, false, undefined, errorDetail);
      setErrors({ general: errorMessage });
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: t.auth.login,
          headerShown: false,
        }} 
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedView style={styles.content}>
            {/* Logo/Header */}
            <View style={styles.header}>
              <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
                <ThemedText type="h1" style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                  MNK
                </ThemedText>
              </View>
              <ThemedText type="h2" style={styles.title}>
                {t.auth.login}
              </ThemedText>
              <ThemedText type="body2" variant="secondary" style={styles.subtitle}>
                Ingresa tus credenciales para continuar
              </ThemedText>
            </View>

            {/* Formulario */}
            <Card style={styles.card}>
              {/* Email */}
              <View style={styles.inputGroup}>
                <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
                  {t.auth.email}
                </ThemedText>
                <View style={[
                  styles.inputContainer,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: errors.email ? colors.error : colors.border,
                  }
                ]}>
                  <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t.auth.email}
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errors.email) {
                        setErrors({ ...errors, email: undefined });
                      }
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    editable={!isLoading}
                  />
                </View>
                {errors.email && (
                  <ThemedText type="caption" variant="error" style={styles.errorText}>
                    {errors.email}
                  </ThemedText>
                )}
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
                  {t.auth.password}
                </ThemedText>
                <View style={[
                  styles.inputContainer,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: errors.password ? colors.error : colors.border,
                  }
                ]}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text, flex: 1 }]}
                    placeholder={t.auth.password}
                    placeholderTextColor={colors.textSecondary}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) {
                        setErrors({ ...errors, password: undefined });
                      }
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                    textContentType="password"
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <ThemedText type="caption" variant="error" style={styles.errorText}>
                    {errors.password}
                  </ThemedText>
                )}
              </View>

              {/* Remember Me & Forgot Password */}
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.rememberMe}
                  onPress={() => setRememberMe(!rememberMe)}
                  disabled={isLoading}
                >
                  <View style={[
                    styles.checkbox,
                    { 
                      borderColor: rememberMe ? colors.primary : colors.border,
                      backgroundColor: rememberMe ? colors.primary : 'transparent',
                    }
                  ]}>
                    {rememberMe && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                  <ThemedText type="body2" style={styles.rememberMeText}>
                    {t.auth.rememberMe}
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity disabled={isLoading}>
                  <ThemedText type="body2" variant="primary" style={styles.forgotPassword}>
                    {t.auth.forgotPassword}
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {/* Error general */}
              {errors.general && (
                <ThemedText type="body2" variant="error" style={styles.generalError}>
                  {errors.general}
                </ThemedText>
              )}

              {/* Botón de Login */}
              <Button
                title={isLoading ? t.common.loading : t.auth.signIn}
                onPress={handleLogin}
                variant="primary"
                size="lg"
                disabled={isLoading}
                style={styles.loginButton}
              >
                {isLoading && (
                  <ActivityIndicator size="small" color="#FFFFFF" style={styles.loader} />
                )}
              </Button>

              {/* Register Link */}
              <View style={styles.registerContainer}>
                <ThemedText type="body2" variant="secondary">
                  {t.auth.dontHaveAccount}{' '}
                </ThemedText>
                <TouchableOpacity disabled={isLoading}>
                  <ThemedText type="body2" variant="primary" style={styles.registerLink}>
                    {t.auth.signUp}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </Card>
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
  },
  card: {
    padding: 24,
    gap: 20,
  },
  inputGroup: {
    marginBottom: 4,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  inputIcon: {
    marginRight: 0,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberMeText: {
    fontSize: 14,
  },
  forgotPassword: {
    fontSize: 14,
  },
  generalError: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  loginButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loader: {
    marginRight: 8,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  registerLink: {
    fontWeight: '600',
  },
});

