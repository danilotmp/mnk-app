/**
 * Modal de Auth (Login, Registro, Verificación)
 * Componente unificado para gestionar el acceso de usuarios
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';
import { EmailInput, PasswordInput } from '@/src/domains/shared/components';
import { useMultiCompany } from '@/src/domains/shared/hooks';
import { RegisterForm } from '@/src/features/auth/components/register-form';
import { VerifyEmailForm } from '@/src/features/auth/components/verify-email-form';
import { SUCCESS_STATUS_CODE } from '@/src/infrastructure/api/constants';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { authService } from '@/src/infrastructure/services/auth.service';
import { mapApiUserToMultiCompanyUser } from '@/src/infrastructure/services/user-mapper.service';
import { useSession } from '@/src/infrastructure/session';
import { createLoginModalStyles } from '@/src/styles/components/login-modal.styles';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

/**
 * Componente wrapper para inputs que maneja el estado de focus correctamente
 */
interface InputWithFocusProps {
  children: React.ReactNode;
  containerStyle: any;
  primaryColor: string;
  error?: boolean;
}

function InputWithFocus({ children, containerStyle, primaryColor, error }: InputWithFocusProps) {
  const [isFocused, setIsFocused] = useState(false);
  
  const childrenWithFocus = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === TextInput) {
      return React.cloneElement(child as React.ReactElement<any>, {
        onFocus: (e: any) => {
          setIsFocused(true);
          if (child.props.onFocus) child.props.onFocus(e);
        },
        onBlur: (e: any) => {
          setIsFocused(false);
          if (child.props.onBlur) child.props.onBlur(e);
        },
        style: [
          child.props.style,
          Platform.OS === 'web' && {
            outline: 'none',
            outlineStyle: 'none',
            outlineWidth: 0,
            outlineColor: 'transparent',
          },
        ],
      });
    }
    return child;
  });

  const baseBorderWidth = containerStyle?.borderWidth || 1;
  const baseBorderColor = error 
    ? containerStyle?.borderColor 
    : (isFocused ? primaryColor : containerStyle?.borderColor);

  return (
    <View
      style={[
        containerStyle,
        {
          borderColor: baseBorderColor,
          borderWidth: isFocused && !error ? 2 : baseBorderWidth,
        },
      ]}
    >
      {childrenWithFocus}
    </View>
  );
}

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

type AuthMode = 'login' | 'register' | 'verify';

export function LoginModal({ visible, onClose, onLoginSuccess }: LoginModalProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { setUserContext } = useMultiCompany();
  const { saveSession } = useSession();
  const alert = useAlert();
  const styles = createLoginModalStyles();
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
    if (!validateForm()) return;
    setIsLoading(true);
    setErrors({});

    try {
      const response = await authService.login({ email: email.trim(), password });
      if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data?.user) {
        const userProfile = await authService.getProfile();
        const userData = userProfile || response.data.user;
        const mappedUser = mapApiUserToMultiCompanyUser({
          ...response.data.user,
          ...userData,
          companyIdDefault: userData?.companyIdDefault || response.data.user.companyIdDefault || userData?.companyId || response.data.user.companyId || '',
          companies: userData?.companies || response.data.user.companies || undefined,
          currentBranchId: userData?.currentBranchId || response.data.user.currentBranchId || '',
          branches: userData?.branches || response.data.user.branches || [],
        });
        
        await setUserContext(mappedUser);
        await saveSession(mappedUser);
        alert.showSuccess(response.result?.description || t.api.loginSuccess || 'Login exitoso');
        onClose();
        onLoginSuccess?.();
      } else {
        const errorMessage = response.result?.description || t.auth.invalidCredentials;
        alert.showError(errorMessage, false, undefined, (response as any)?.result?.details || '');
        setErrors({ general: errorMessage });
      }
    } catch (error: any) {
      const errorMessage = error?.message || t.api.loginFailed;
      alert.showError(errorMessage, false, undefined, error?.details || error?.result?.details || '');
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSuccess = (email: string, verificationRequired: boolean) => {
    setRegisteredEmail(email);
    
    // Usar el flag retornado por el servidor
    if (verificationRequired) {
      setMode('verify');
    } else {
      alert.showSuccess('Cuenta creada exitosamente. Ahora puedes iniciar sesión.');
      setMode('login');
      setEmail(email);
    }
  };

  const handleVerifySuccess = () => {
    alert.showSuccess('Cuenta verificada exitosamente. Ahora puedes iniciar sesión.');
    setMode('login');
    setEmail(registeredEmail);
  };

  const handleClose = () => {
    if (!isLoading) {
      setEmail('');
      setPassword('');
      setErrors({});
      setMode('login');
      onClose();
    }
  };

  const getHeaderText = () => {
    switch (mode) {
      case 'register': return { title: t.auth.register || 'Crear Cuenta', subtitle: t.auth.registerSubtitle || 'Regístrate para empezar' };
      case 'verify': return { title: 'Verificar Cuenta', subtitle: 'Ingresa el código que enviamos a tu correo' };
      default: return { title: t.auth.login, subtitle: t.auth.loginSubtitle || 'Ingresa tus credenciales para continuar' };
    }
  };

  const header = getHeaderText();

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={styles.modalContainer}>
            <ThemedView style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <View style={styles.headerContent}>
                  <View style={styles.logoContainer}>
                    <Image
                      source={require('@/assets/images/icon.png')}
                      style={styles.logoImage}
                      contentFit="contain"
                    />
                  </View>
                  <View style={styles.headerText}>
                    <ThemedText type="h3" style={styles.title}>{header.title}</ThemedText>
                    <ThemedText type="body2" variant="secondary" style={styles.subtitle}>{header.subtitle}</ThemedText>
                  </View>
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton} disabled={isLoading}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Card style={styles.card}>
                  {mode === 'login' && (
                    <>
                      <View style={styles.inputGroup}>
                        <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>{t.auth.email}</ThemedText>
                        <EmailInput
                          value={email}
                          onChangeText={(val) => {
                            setEmail(val);
                            if (errors.email) {
                              setErrors({ ...errors, email: undefined });
                            }
                          }}
                          placeholder={t.auth.email}
                          error={!!errors.email}
                          errorMessage={errors.email}
                          disabled={isLoading}
                        />
                      </View>

                      <View style={styles.inputGroup}>
                        <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>{t.auth.password}</ThemedText>
                        <PasswordInput
                          value={password}
                          onChangeText={(val) => {
                            setPassword(val);
                            if (errors.password) {
                              setErrors({ ...errors, password: undefined });
                            }
                          }}
                          placeholder={t.auth.password}
                          error={!!errors.password}
                          errorMessage={errors.password}
                          disabled={isLoading}
                        />
                      </View>

                      <View style={styles.optionsRow}>
                        <TouchableOpacity style={styles.rememberMe} onPress={() => setRememberMe(!rememberMe)} disabled={isLoading}>
                          <View style={[styles.checkbox, { borderColor: rememberMe ? colors.primary : colors.border, backgroundColor: rememberMe ? colors.primary : 'transparent' }]}>
                            {rememberMe && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                          </View>
                          <ThemedText type="body2" style={styles.rememberMeText}>{t.auth.rememberMe}</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity disabled={isLoading}>
                          <ThemedText type="body2" variant="primary" style={styles.forgotPassword}>{t.auth.forgotPassword}</ThemedText>
                        </TouchableOpacity>
                      </View>

                      {errors.general && <ThemedText type="body2" variant="error" style={styles.generalError}>{errors.general}</ThemedText>}

                      <Button title={isLoading ? t.common.loading : t.auth.signIn} onPress={handleLogin} variant="primary" size="lg" disabled={isLoading} style={styles.loginButton}>
                        {isLoading && <ActivityIndicator size="small" color="#FFFFFF" style={styles.loader} />}
                      </Button>

                      <View style={styles.registerContainer}>
                        <ThemedText type="body2" variant="secondary">{t.auth.dontHaveAccount} </ThemedText>
                        <TouchableOpacity disabled={isLoading} onPress={() => setMode('register')}>
                          <ThemedText type="body2" variant="primary" style={styles.registerLink}>{t.auth.signUp}</ThemedText>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}

                  {mode === 'register' && (
                    <RegisterForm 
                      onSuccess={handleRegisterSuccess} 
                      onLoginLink={() => setMode('login')} 
                      isLoading={isLoading}
                    />
                  )}

                  {mode === 'verify' && (
                    <VerifyEmailForm 
                      email={registeredEmail} 
                      onSuccess={handleVerifySuccess} 
                      onBack={() => setMode('register')} 
                    />
                  )}
                </Card>
              </ScrollView>
            </ThemedView>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}
