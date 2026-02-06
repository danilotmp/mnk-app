/**
 * Página de Login
 */

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/hooks/use-theme";
import { EmailInput, PasswordInput } from "@/src/domains/shared/components";
import { useMultiCompany } from "@/src/domains/shared/hooks";
import {
    UserContextService,
    UserSessionService,
} from "@/src/domains/shared/services";
import { UserResponse } from "@/src/domains/shared/types/api/user-response.types";
import { RegisterForm } from "@/src/features/auth/components/register-form";
import { VerifyEmailForm } from "@/src/features/auth/components/verify-email-form";
import { SUCCESS_STATUS_CODE } from "@/src/infrastructure/api/constants";
import { useTranslation } from "@/src/infrastructure/i18n";
import { useAlert } from "@/src/infrastructure/messages/alert.service";
import {
    extractErrorDetail,
    extractErrorMessage,
} from "@/src/infrastructure/messages/error-utils";
import { authService } from "@/src/infrastructure/services/auth.service";
import { mapUserResponseToMultiCompanyUser } from "@/src/infrastructure/services/user-mapper.service";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

export default function LoginPage() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { isDesktop, isMobile } = useResponsive();
  const router = useRouter();
  const { setUserContext } = useMultiCompany();
  const alert = useAlert();
  const userSessionService = UserSessionService.getInstance();
  const userContextService = UserContextService.getInstance();

  type AuthMode = "login" | "register" | "verify";

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = t.auth.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Email inválido";
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
        alert.showSuccess(t.api.loginSuccess || "Inicio de sesión exitoso");

        try {
          // Verificar que el token esté guardado después del login
          const { apiClient } =
            await import("@/src/infrastructure/api/api.client");
          let tokens = await apiClient.getTokens();

          // Si no hay token, esperar un momento y verificar de nuevo (puede ser un problema de timing)
          if (!tokens || !tokens.accessToken) {
            await new Promise((resolve) => setTimeout(resolve, 200));
            tokens = await apiClient.getTokens();
            if (!tokens || !tokens.accessToken) {
              throw new Error(
                "Token de autenticación no disponible después del login",
              );
            }
          }

          const userProfile = (await authService.getProfile()) as UserResponse;

          if (!userProfile || !userProfile.id) {
            throw new Error("No se pudo obtener el perfil del usuario");
          }

          if (
            !userProfile.companies ||
            !Array.isArray(userProfile.companies) ||
            userProfile.companies.length === 0
          ) {
            throw new Error("El usuario no tiene empresas asignadas");
          }

          if (!userProfile.companyIdDefault) {
            throw new Error("El usuario no tiene una empresa por defecto");
          }

          await userSessionService.saveUser(userProfile);

          await userSessionService.setCurrentCompany(
            userProfile.companyIdDefault,
            true,
          );

          if (userProfile.branchIdDefault) {
            await userSessionService.setCurrentBranch(
              userProfile.branchIdDefault,
              true,
            );
          }

          // Verificar nuevamente el token antes de inicializar contexto (que llama al menú)
          tokens = await apiClient.getTokens();
          if (!tokens || !tokens.accessToken) {
            throw new Error(
              "Token de autenticación no disponible para obtener el menú",
            );
          }

          // Inicializar contexto después de asegurar que el token está disponible
          await userContextService.initializeContext();

          const mappedUser = mapUserResponseToMultiCompanyUser(userProfile);
          await setUserContext(mappedUser);

          setIsLoading(false);
          router.replace("/");
        } catch (profileError: any) {
          console.error("Error al obtener perfil:", profileError);
          alert.showError(
            profileError?.message ||
              t.api.loginFailed ||
              "Error al procesar la información del usuario",
          );
          setIsLoading(false);
        }
      } else {
        // Usar extractErrorMessage para manejar correctamente si description es array o string
        const errorMessage =
          extractErrorMessage(response) || t.auth.invalidCredentials;
        const errorDetail = extractErrorDetail(response) || "";

        alert.showError(errorMessage, false, undefined, errorDetail);
        setErrors({ general: errorMessage });
        setIsLoading(false);
      }
    } catch (error: any) {
      const errorMessage = error?.message
        ? String(error.message)
        : t.api.loginFailed;
      const errorDetail = extractErrorDetail(error) ?? "";
      alert.showError(errorMessage, false, undefined, errorDetail);
      setErrors({ general: errorMessage });
      setIsLoading(false);
    }
  };

  const handleRegisterSuccess = (
    email: string,
    verificationRequired: boolean,
  ) => {
    setRegisteredEmail(email);
    if (verificationRequired) {
      setMode("verify");
    } else {
      alert.showSuccess(
        t.auth?.registerSuccess ?? "Cuenta creada. Ya puedes iniciar sesión.",
      );
      setMode("login");
      setEmail(email);
    }
  };

  const handleVerifySuccess = () => {
    alert.showSuccess(
      t.auth?.verifySuccess ?? "Cuenta verificada. Ya puedes iniciar sesión.",
    );
    setMode("login");
    setEmail(registeredEmail);
  };

  const getHeaderText = () => {
    switch (mode) {
      case "register":
        return {
          title: t.auth.register ?? "Crear Cuenta",
          subtitle: t.auth.registerSubtitle ?? "Regístrate para empezar",
        };
      case "verify":
        return {
          title: "Verificar Cuenta",
          subtitle: "Ingresa el código que enviamos a tu correo",
        };
      default:
        return {
          title: t.auth.login,
          subtitle:
            t.auth.loginSubtitle ?? "Ingresa tus credenciales para continuar",
        };
    }
  };

  const headerText = getHeaderText();

  return (
    <>
      <Stack.Screen
        options={{
          title: t.auth.login,
          headerShown: false,
        }}
      />
      <View style={styles.container}>
        {/* Layout de dos columnas en desktop, apilado en mobile */}
        <View
          style={[
            styles.layoutContainer,
            isMobile && styles.layoutContainerMobile,
          ]}
        >
          {/* Columna Izquierda: Formulario */}
          <View
            style={[
              styles.leftColumn,
              { backgroundColor: colors.background },
              isMobile && styles.leftColumnMobile,
            ]}
          >
            {/* Botón de regresar */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (mode === "verify") {
                  setMode("register");
                } else if (mode === "register") {
                  setMode("login");
                } else {
                  router.back();
                }
              }}
              disabled={isLoading}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                isMobile && styles.scrollContentMobile,
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={isMobile ? styles.scrollViewMobile : undefined}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={[
                  styles.formContainer,
                  isMobile && styles.formContainerMobile,
                ]}
              >
                {/* Logo/Header */}
                <View style={styles.header}>
                  <View
                    style={[
                      styles.headerContent,
                      isMobile && styles.headerContentMobile,
                    ]}
                  >
                    <View style={styles.logoContainer}>
                      <Image
                        source={require("@/assets/images/icon.png")}
                        style={styles.logoImage}
                        contentFit="contain"
                      />
                    </View>
                    <View style={styles.headerText}>
                      <ThemedText type="h2" style={styles.title}>
                        {headerText.title}
                      </ThemedText>
                      <ThemedText
                        type="body2"
                        variant="secondary"
                        style={styles.subtitle}
                      >
                        {headerText.subtitle}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {/* Formulario */}
                <Card style={[styles.card, isMobile && styles.cardMobile]}>
                  {mode === "login" && (
                    <>
                      {/* Email */}
                      <View style={styles.inputGroup}>
                        <ThemedText
                          type="body2"
                          style={[styles.label, { color: colors.text }]}
                        >
                          {t.auth.email}
                        </ThemedText>
                        <EmailInput
                          value={email}
                          onChangeText={(text) => {
                            setEmail(text);
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

                      {/* Password */}
                      <View style={styles.inputGroup}>
                        <ThemedText
                          type="body2"
                          style={[styles.label, { color: colors.text }]}
                        >
                          {t.auth.password}
                        </ThemedText>
                        <PasswordInput
                          value={password}
                          onChangeText={(text) => {
                            setPassword(text);
                            if (errors.password) {
                              setErrors({ ...errors, password: undefined });
                            }
                          }}
                          placeholder={t.auth.password}
                          error={!!errors.password}
                          errorMessage={errors.password}
                          disabled={isLoading}
                          returnKeyType="done"
                          onSubmitEditing={handleLogin}
                        />
                      </View>

                      {/* Remember Me & Forgot Password */}
                      <View style={styles.optionsRow}>
                        <TouchableOpacity
                          style={styles.rememberMe}
                          onPress={() => setRememberMe(!rememberMe)}
                          disabled={isLoading}
                        >
                          <View
                            style={[
                              styles.checkbox,
                              {
                                borderColor: rememberMe
                                  ? colors.primary
                                  : colors.border,
                                backgroundColor: rememberMe
                                  ? colors.primary
                                  : "transparent",
                              },
                            ]}
                          >
                            {rememberMe && (
                              <Ionicons
                                name="checkmark"
                                size={16}
                                color="#FFFFFF"
                              />
                            )}
                          </View>
                          <ThemedText
                            type="body2"
                            style={styles.rememberMeText}
                          >
                            {t.auth.rememberMe}
                          </ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity disabled={isLoading}>
                          <ThemedText
                            type="body2"
                            variant="primary"
                            style={styles.forgotPassword}
                          >
                            {t.auth.forgotPassword}
                          </ThemedText>
                        </TouchableOpacity>
                      </View>

                      {/* Error general */}
                      {errors.general && (
                        <ThemedText
                          type="body2"
                          variant="error"
                          style={styles.generalError}
                        >
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
                          <ActivityIndicator
                            size="small"
                            color="#FFFFFF"
                            style={styles.loader}
                          />
                        )}
                      </Button>

                      {/* Register Link */}
                      <View style={styles.registerContainer}>
                        <ThemedText type="body2" variant="secondary">
                          {t.auth.dontHaveAccount}{" "}
                        </ThemedText>
                        <TouchableOpacity
                          disabled={isLoading}
                          onPress={() => setMode("register")}
                        >
                          <ThemedText
                            type="body2"
                            variant="primary"
                            style={styles.registerLink}
                          >
                            {t.auth.signUp}
                          </ThemedText>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}

                  {mode === "register" && (
                    <RegisterForm
                      onSuccess={handleRegisterSuccess}
                      onLoginLink={() => setMode("login")}
                      isLoading={isLoading}
                    />
                  )}

                  {mode === "verify" && (
                    <VerifyEmailForm
                      email={registeredEmail}
                      onSuccess={handleVerifySuccess}
                      onBack={() => setMode("register")}
                    />
                  )}
                </Card>
              </KeyboardAvoidingView>
            </ScrollView>
          </View>

          {/* Columna Derecha: Imagen de Fondo */}
          {isDesktop && (
            <View style={styles.rightColumn}>
              <Image
                source={require("@/assets/images/backgroud.jpg")}
                style={styles.backgroundImage}
                contentFit="cover"
              />
              {/* Overlay con texto opcional */}
              <View style={styles.overlay}>
                <View style={styles.overlayContent}>
                  <View style={styles.overlayTitleRow}>
                    <Image
                      source={require("@/assets/images/icon-white.png")}
                      style={styles.overlayIcon}
                      contentFit="contain"
                    />
                    <ThemedText type="h1" style={styles.overlayTitle}>
                      AIBox
                    </ThemedText>
                  </View>
                  <ThemedText type="body1" style={styles.overlaySubtitle}>
                    Una nueva generación de soluciones empresariales, diseñada
                    para evolucionar, conectar y transformar.
                  </ThemedText>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: "100%",
  },
  layoutContainer: {
    flex: 1,
    flexDirection: "row",
    maxWidth: "100%",
  },
  layoutContainerMobile: {
    maxWidth: "100%",
    overflow: "hidden",
  },
  leftColumn: {
    flex: 1,
    ...(Platform.OS === "web"
      ? {
          maxWidth: "50%",
          minWidth: 500,
        }
      : {}),
  },
  leftColumnMobile: {
    maxWidth: "100%",
    minWidth: 0,
  },
  rightColumn: {
    flex: 1,
    position: "relative",
    ...(Platform.OS === "web"
      ? {
          maxWidth: "50%",
        }
      : {}),
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 40,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  overlayContent: {
    gap: 16,
  },
  overlayTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 8,
  },
  overlayIcon: {
    width: 56,
    height: 56,
  },
  overlayTitle: {
    color: "#FFFFFF",
    fontSize: 48,
    fontWeight: "bold",
    marginBottom: 0,
  },
  overlaySubtitle: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 28,
    opacity: 0.95,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  scrollContentMobile: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    paddingTop: 72,
    paddingBottom: 40,
    flexGrow: 1,
  },
  scrollViewMobile: {
    maxWidth: "100%",
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "web" ? 20 : 40,
    left: 20,
    zIndex: 10,
    padding: 8,
    borderRadius: 8,
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
  },
  formContainerMobile: {
    maxWidth: "100%",
    width: "100%",
    justifyContent: "flex-start",
  },
  header: {
    marginBottom: 32,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginLeft: 20,
  },
  headerContentMobile: {
    marginLeft: 0,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    marginBottom: 0,
    textAlign: "left",
  },
  subtitle: {
    textAlign: "left",
    opacity: 0.8,
  },
  card: {
    padding: 24,
    gap: 20,
  },
  cardMobile: {
    padding: 20,
    gap: 16,
  },
  inputGroup: {
    marginBottom: 4,
  },
  label: {
    marginBottom: 8,
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    overflow: "hidden", // Prevenir que el borde interno se muestre
  },
  inputIcon: {
    marginRight: 0,
  },
  input: {
    flex: 1,
    fontSize: 16,
    ...(Platform.OS === "web"
      ? ({
          outline: "none",
          outlineStyle: "none",
          outlineWidth: 0,
          outlineColor: "transparent",
          borderWidth: 0,
          WebkitAppearance: "none",
          appearance: "none",
          backgroundColor: "transparent",
        } as any)
      : {
          borderWidth: 0,
          padding: 0,
        }),
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 4,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  rememberMe: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  rememberMeText: {
    fontSize: 14,
  },
  forgotPassword: {
    fontSize: 14,
  },
  generalError: {
    textAlign: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  loginButton: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loader: {
    marginRight: 8,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  registerLink: {
    fontWeight: "600",
  },
});
