/**
 * Componente para mostrar el perfil del usuario en el header
 */

import { LoginModal } from '@/components/auth/login-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { isDesktopDevice, isMobileDevice } from '@/constants/breakpoints';
import { useTheme } from '@/hooks/use-theme';
import { LanguageSelector, useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { useSession } from '@/src/infrastructure/session';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useBranches, useCompany, useMultiCompany } from '../../hooks/use-multi-company.hook';
import { Branch } from '../../types';
import { createUserProfileHeaderStyles } from './user-profile-header.styles';
import { UserProfileHeaderProps } from './user-profile-header.types';

export function UserProfileHeader({
  onLogout,
  onSettings,
  onProfile,
}: UserProfileHeaderProps) {
  const { colors } = useTheme();
  const styles = createUserProfileHeaderStyles();
  const { user, company, branch } = useCompany();
  const { branches, switchBranch } = useBranches();
  const { clearContext } = useMultiCompany();
  const { clearSession } = useSession();
  const [modalVisible, setModalVisible] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [switching, setSwitching] = useState(false);
  const { t } = useTranslation();
  const alert = useAlert();
  const router = useRouter();
  
  // Responsive: Detectar tamaño de pantalla
  const { width } = useWindowDimensions();
  const isMobile = isMobileDevice(width);
  const isDesktop = isDesktopDevice(width);

  // Si no hay usuario autenticado, mostrar botón de login
  if (!user || !company || !branch) {
    return (
      <>
        <View style={styles.profileContainer}>
          {/* Toggle de tema - Al lado izquierdo del botón de login */}
          <View style={[
            styles.themeToggleWrapper,
            isMobile && styles.themeToggleWrapperMobile
          ]}>
            <ThemeToggle />
          </View>

          <TouchableOpacity
            style={[
              styles.loginButton,
              { backgroundColor: colors.surface },
              isMobile && styles.loginButtonMobile
            ]}
            onPress={() => setLoginModalVisible(true)}
            activeOpacity={0.7}
          >
            {!isMobile && (
              <ThemedText type="defaultSemiBold" style={[styles.loginButtonText, { color: colors.text }]}>
                {t.auth.login}
              </ThemedText>
            )}
            <View style={[styles.loginIconContainer, { backgroundColor: colors.primary }]}>
              <Ionicons name="person-outline" size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* Selector de idioma - Junto al botón de login */}
          <View style={[
            styles.languageSelectorWrapper,
            isMobile && styles.languageSelectorWrapperMobile
          ]}>
            <LanguageSelector />
          </View>
        </View>

        {/* Modal de Login */}
        <LoginModal
          visible={loginModalVisible}
          onClose={() => setLoginModalVisible(false)}
          onLoginSuccess={() => {
            setLoginModalVisible(false);
          }}
        />
      </>
    );
  }

  // Obtener iniciales del nombre para el avatar
  const getInitials = () => {
    const firstInitial = user.firstName.charAt(0).toUpperCase();
    const lastInitial = user.lastName.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  };

  const handleBranchSwitch = async (newBranch: Branch) => {
    if (newBranch.id === branch.id) {
      return; // Ya está en esta sucursal
    }

    try {
      setSwitching(true);
      await switchBranch(newBranch.id);
    } catch (error) {
      // console.error('Error al cambiar sucursal:', error);
    } finally {
      setSwitching(false);
    }
  };

  const handleLogout = async () => {
    setModalVisible(false);
    
    // Limpiar tokens de autenticación primero
    try {
      const { authService } = await import('@/src/infrastructure/services/auth.service');
      await authService.logout();
    } catch (error) {
      // console.error('Error al hacer logout:', error);
    }
    
    // Limpiar sesión completa (tokens, usuario, etc.)
    await clearSession();
    
    // Limpiar contexto multi-company después de limpiar la sesión
    // Esto actualiza el estado del contexto, lo que causará un re-render
    clearContext();
    
    // Llamar al callback si existe
    onLogout?.();
    
    // Toast de confirmación multilenguaje
    alert.showSuccess('auth.logoutSuccess');
    
    // Usar requestAnimationFrame para asegurar que React procese el cambio de estado
    // del contexto antes de redirigir, permitiendo que el componente se re-renderice
    requestAnimationFrame(() => {
      // Dar un pequeño delay para asegurar que el re-render se complete
      // y que el componente muestre el botón de login en lugar del avatar
      setTimeout(() => {
        // Redirigir al Home usando replace para reemplazar la ruta actual
        // Esto evita que el usuario pueda volver atrás a la página anterior
        router.replace('/');
      }, 150);
    });
  };

  return (
    <>
      {/* Contenedor del perfil */}
      <View style={styles.profileContainer}>
        {/* Toggle de tema - Al lado izquierdo del avatar */}
        <View style={[
          styles.themeToggleWrapper,
          isMobile && styles.themeToggleWrapperMobile
        ]}>
          <ThemeToggle />
        </View>

        {/* Botón de perfil - RESPONSIVE */}
        <TouchableOpacity
          style={[
            styles.profileButton, 
            { backgroundColor: colors.surface },
            isMobile && styles.profileButtonMobile
          ]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          {/* Info del usuario - Solo visible en Tablet y Desktop */}
          {!isMobile && (
            <View style={styles.userInfo}>
              <ThemedText type="defaultSemiBold" style={styles.userName} numberOfLines={1}>
                {user.firstName} {isDesktop ? user.lastName : ''}
              </ThemedText>
              {/* Sucursal solo visible en Desktop */}
              {isDesktop && (
                <ThemedText type="caption" variant="secondary" numberOfLines={1}>
                  {branch.name}
                </ThemedText>
              )}
            </View>
          )}

          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <ThemedText style={[styles.avatarText, { color: '#FFFFFF' }]}>
              {getInitials()}
            </ThemedText>
          </View>
        </TouchableOpacity>

        {/* Selector de idioma - Junto al perfil */}
        <View style={[
          styles.languageSelectorWrapper,
          isMobile && styles.languageSelectorWrapperMobile
        ]}>
          <LanguageSelector />
        </View>
      </View>

      {/* Modal con opciones */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContainer}
          >
            <ThemedView style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Encabezado del modal */}
                <View style={styles.modalHeader}>
                  <View style={[styles.avatarLarge, { backgroundColor: colors.primary }]}>
                    <ThemedText style={[styles.avatarTextLarge, { color: '#FFFFFF' }]}>
                      {getInitials()}
                    </ThemedText>
                  </View>
                  <ThemedText type="h3" style={styles.modalUserName}>
                    {user.firstName} {user.lastName}
                  </ThemedText>
                  <ThemedText type="body2" variant="secondary">
                    {user.email}
                  </ThemedText>
                  <View style={[styles.badge, { backgroundColor: 'transparent' }]}>
                    <ThemedText type="caption" variant="primary">
                      {company.name}
                    </ThemedText>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* Selector de sucursales */}
                {branches.length > 1 && (
                  <>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.section}>
                      <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                        {t.user.changeBranch}
                      </ThemedText>
                      {switching ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="small" color={colors.primary} />
                          <ThemedText type="caption" style={{ marginLeft: 8 }}>
                            {t.user.changing}
                          </ThemedText>
                        </View>
                      ) : (
                        <>
                          {branches.map((branchItem) => (
                            <TouchableOpacity
                              key={branchItem.id}
                              style={[
                                styles.branchOption,
                                {
                                  backgroundColor:
                                    branchItem.id === branch.id
                                      ? colors.surface  // Activa usa estilo de inactiva
                                      : 'transparent',  // Inactiva usa fondo transparente
                                },
                              ]}
                              onPress={() => handleBranchSwitch(branchItem)}
                              disabled={branchItem.id === branch.id}
                            >
                              <View style={styles.branchOptionInfo}>
                                <ThemedText
                                  type="defaultSemiBold"
                                  variant={branchItem.id === branch.id ? undefined : 'primary'}  // Invertido
                                >
                                  {branchItem.name}
                                </ThemedText>
                                <ThemedText type="caption" variant="secondary">
                                  {branchItem.address?.city || branchItem.code || ''}
                                </ThemedText>
                              </View>
                              {branchItem.id === branch.id && (
                                <ThemedText style={{ color: colors.text }}>✓</ThemedText>  // Usar color normal
                              )}
                            </TouchableOpacity>
                          ))}
                        </>
                      )}
                    </View>
                  </>
                )}

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* Opciones del menú */}
                <View style={styles.section}>
                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => {
                      setModalVisible(false);
                      onProfile?.();
                    }}
                  >
                    <ThemedText style={styles.menuIcon}>👤</ThemedText>
                    <ThemedText type="defaultSemiBold">{t.user.myProfile}</ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => {
                      setModalVisible(false);
                      onSettings?.();
                    }}
                  >
                    <ThemedText style={styles.menuIcon}>⚙️</ThemedText>
                    <ThemedText type="defaultSemiBold">{t.user.configuration}</ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.menuOption} onPress={handleLogout}>
                    <ThemedText style={styles.menuIcon}>🚪</ThemedText>
                    <ThemedText type="defaultSemiBold" variant="error">
                      {t.user.logout}
                    </ThemedText>
                  </TouchableOpacity>
                </View>

                {/* Botón cerrar */}
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: colors.surface }]}
                  onPress={() => setModalVisible(false)}
                >
                  <ThemedText type="defaultSemiBold">{t.common.close}</ThemedText>
                </TouchableOpacity>
              </ScrollView>
            </ThemedView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal de Login */}
      <LoginModal
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
        onLoginSuccess={() => {
          setLoginModalVisible(false);
        }}
      />
    </>
  );
}

