/**
 * Modal de Login
 * Componente reutilizable que muestra el formulario de login en un modal
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';
import { useMultiCompany } from '@/src/domains/shared/hooks';
import { MultiCompanyService } from '@/src/domains/shared/services';
import { SUCCESS_STATUS_CODE } from '@/src/infrastructure/api/constants';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { authService } from '@/src/infrastructure/services/auth.service';
import { mapApiUserToMultiCompanyUser } from '@/src/infrastructure/services/user-mapper.service';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
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
  
  // Clonar children para agregar props de focus
  const childrenWithFocus = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === TextInput) {
      return React.cloneElement(child as React.ReactElement<any>, {
        onFocus: (e: any) => {
          setIsFocused(true);
          if (child.props.onFocus) {
            child.props.onFocus(e);
          }
        },
        onBlur: (e: any) => {
          setIsFocused(false);
          if (child.props.onBlur) {
            child.props.onBlur(e);
          }
        },
        // Eliminar completamente el outline en web para evitar el cuadrado negro/blanco
        style: [
          child.props.style,
          Platform.OS === 'web' && {
            outline: 'none',
            outlineStyle: 'none',
            outlineWidth: 0,
            outlineColor: 'transparent',
            WebkitAppearance: 'none',
            appearance: 'none',
          },
        ],
      });
    }
    return child;
  });

  // Extraer borderWidth y borderColor del containerStyle para mantener consistencia
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

export function LoginModal({ visible, onClose, onLoginSuccess }: LoginModalProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { setUserContext } = useMultiCompany();
  const alert = useAlert();
  
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
        try {
          const userProfile = await authService.getProfile();
          const userData = userProfile || response.data.user;
          
          let mappedUser = mapApiUserToMultiCompanyUser({
            ...response.data.user,
            ...userData,
            companyId: userData?.companyId || response.data.user.companyId || '',
          });
          
          const multiCompanyService = MultiCompanyService.getInstance();
          const mockUsers = multiCompanyService.getMockUsers();
          
          if (!mappedUser.companyId || !mappedUser.currentBranchId || mappedUser.availableBranches.length === 0) {
            const mockUser = mockUsers.find(u => u.email === mappedUser.email) || mockUsers[0];
            
            if (mockUser) {
              mappedUser = {
                ...mappedUser,
                companyId: mappedUser.companyId || mockUser.companyId,
                currentBranchId: mappedUser.currentBranchId || mockUser.currentBranchId,
                availableBranches: mappedUser.availableBranches.length > 0 
                  ? mappedUser.availableBranches 
                  : mockUser.availableBranches,
                roles: mappedUser.roles.length > 0 ? mappedUser.roles : mockUser.roles,
                permissions: mappedUser.permissions.length > 0 ? mappedUser.permissions : mockUser.permissions,
              };
            }
          }
          
          await setUserContext(mappedUser);
          
          // Cerrar modal y ejecutar callback de éxito
          onClose();
          onLoginSuccess?.();
        } catch (profileError) {
          console.error('⚠️ Error obteniendo perfil:', profileError);
          
          try {
            let mappedUser = mapApiUserToMultiCompanyUser(response.data.user);
            
            if (!mappedUser.companyId || !mappedUser.currentBranchId) {
              const multiCompanyService = MultiCompanyService.getInstance();
              const mockUsers = multiCompanyService.getMockUsers();
              const mockUser = mockUsers.find(u => u.email === mappedUser.email) || mockUsers[0];
              
              if (mockUser) {
                mappedUser = {
                  ...mappedUser,
                  companyId: mappedUser.companyId || mockUser.companyId,
                  currentBranchId: mappedUser.currentBranchId || mockUser.currentBranchId,
                  availableBranches: mappedUser.availableBranches.length > 0 
                    ? mappedUser.availableBranches 
                    : mockUser.availableBranches,
                  roles: mappedUser.roles.length > 0 ? mappedUser.roles : mockUser.roles,
                  permissions: mappedUser.permissions.length > 0 ? mappedUser.permissions : mockUser.permissions,
                };
              }
            }
            
            await setUserContext(mappedUser);
            onClose();
            onLoginSuccess?.();
          } catch (mappingError) {
            console.error('❌ Error mapeando usuario:', mappingError);
            alert.showError(t.api.loginFailed);
          }
        }
      } else {
        const errorMessage = response.result?.description || t.auth.invalidCredentials;
        alert.showError(errorMessage);
        setErrors({ general: errorMessage });
      }
    } catch (error: any) {
      console.error('Error en login:', error);
      
      let errorMessage = t.api.loginFailed;
      if (error?.result?.description) {
        errorMessage = error.result.description;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      alert.showError(errorMessage);
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setEmail('');
      setPassword('');
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContainer}
          >
            <ThemedView style={[styles.modalContent, { backgroundColor: colors.background }]}>
              {/* Header del modal */}
              <View style={styles.modalHeader}>
                <View style={styles.headerContent}>
                  <View style={styles.headerText}>
                    <ThemedText type="h3" style={styles.title}>
                      {t.auth.login}
                    </ThemedText>
                    <ThemedText type="body2" variant="secondary" style={styles.subtitle}>
                      {t.auth.loginSubtitle || 'Ingresa tus credenciales para continuar'}
                    </ThemedText>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.closeButton}
                  disabled={isLoading}
                >
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Card style={styles.card}>
                  {/* Email */}
                  <View style={styles.inputGroup}>
                    <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
                      {t.auth.email}
                    </ThemedText>
                    <InputWithFocus
                      containerStyle={[
                        styles.inputContainer,
                        { 
                          backgroundColor: colors.surface,
                          borderColor: errors.email ? colors.error : colors.border,
                        }
                      ]}
                      primaryColor={colors.primary}
                      error={!!errors.email}
                    >
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
                    </InputWithFocus>
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
                    <InputWithFocus
                      containerStyle={[
                        styles.inputContainer,
                        { 
                          backgroundColor: colors.surface,
                          borderColor: errors.password ? colors.error : colors.border,
                        }
                      ]}
                      primaryColor={colors.primary}
                      error={!!errors.password}
                    >
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
                    </InputWithFocus>
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
              </ScrollView>
            </ThemedView>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
  },
  modalContent: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 40,
    paddingHorizontal: 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerContent: {
    flex: 1,
    paddingRight: 8,
  },
  headerText: {
    flex: 1,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  scrollView: {
    maxHeight: 600,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  card: {
    padding: 20,
    gap: 16,
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
    // Asegurar que no haya outline adicional en web
    ...(Platform.OS === 'web' && {
      outline: 'none',
      outlineStyle: 'none',
      outlineWidth: 0,
      outlineColor: 'transparent',
    }),
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

