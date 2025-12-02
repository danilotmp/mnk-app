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
  Modal,
  ScrollView,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useBranches, useCompany, useMultiCompany } from '../../hooks/use-multi-company.hook';
import { Branch, BranchAccess } from '../../types';
import { createUserProfileHeaderStyles } from './user-profile-header.styles';
import { UserProfileHeaderProps } from './user-profile-header.types';

export function UserProfileHeader({
  onLogout,
  onSettings,
  onProfile,
}: UserProfileHeaderProps) {
  const { colors } = useTheme();
  const styles = createUserProfileHeaderStyles();
  const { user, company, branch: currentBranch } = useCompany();
  const { switchBranch } = useBranches();
  
  // Obtener sucursales directamente desde la empresa actual
  // Nueva estructura: branches están anidados dentro de companies[].branches[]
  const [branches, setBranches] = React.useState<BranchAccess[]>([]);
  
  React.useEffect(() => {
    const loadBranches = async () => {
      if (!company || !user) {
        setBranches([]);
        return;
      }
      
      // Obtener branches desde UserResponse usando UserContextService
      const { UserSessionService } = await import('@/src/domains/shared/services/user-session.service');
      const { UserContextService } = await import('@/src/domains/shared/services/user-context.service');
      const userSessionService = UserSessionService.getInstance();
      const userContextService = UserContextService.getInstance();
      
      const userResponse = await userSessionService.getUser();
      if (!userResponse) {
        setBranches([]);
        return;
      }
      
      // Obtener branches directamente desde company.branches[] (nueva estructura)
      const branchInfos = userContextService.getBranchesForCompany(company.id, userResponse);
      
      // Convertir BranchInfo[] a BranchAccess[] usando los branches mapeados de user.branches
      const branchAccesses = branchInfos
        .map(branchInfo => {
          const branchAccess = user.branches?.find(ba => ba.branchId === branchInfo.id);
          return branchAccess;
        })
        .filter((access): access is BranchAccess => access != null && access.branch != null);
      
      setBranches(branchAccesses);
    };
    
    loadBranches();
  }, [company?.id, user]); 
  const { clearContext } = useMultiCompany();
  const { clearSession } = useSession();
  const [modalVisible, setModalVisible] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const { t } = useTranslation();
  const alert = useAlert();
  const router = useRouter();
  
  // Responsive: Detectar tamaño de pantalla
  const { width } = useWindowDimensions();
  const isMobile = isMobileDevice(width);
  const isDesktop = isDesktopDevice(width);


  // Si no hay usuario autenticado, mostrar botón de login
  if (!user || !company || !currentBranch) {
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
    const firstName = user?.firstName?.trim() || '';
    const lastName = user?.lastName?.trim() || '';
    
    // Si hay firstName y lastName, usar sus iniciales
    if (firstName && lastName) {
      return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
    }
    
    // Si solo hay firstName, usar su inicial
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    
    // Si solo hay lastName, usar su inicial
    if (lastName) {
      return lastName.charAt(0).toUpperCase();
    }
    
    // Si no hay nombre, usar la primera letra del email
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    // Fallback final
    return 'U';
  };
  
  // Obtener nombre completo para mostrar
  const getDisplayName = () => {
    const firstName = user?.firstName?.trim() || '';
    const lastName = user?.lastName?.trim() || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    if (firstName) {
      return firstName;
    }
    
    if (lastName) {
      return lastName;
    }
    
    // Si no hay nombre, usar el email como fallback
    return user?.email || 'Usuario';
  };

  const handleBranchSwitch = (newBranch: Branch) => {
    if (currentBranch && newBranch.id === currentBranch.id) {
      return; // Ya está seleccionada
    }
    // Simplemente actualizar el branch seleccionado
    switchBranch(newBranch);
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
                {getDisplayName()}
              </ThemedText>
              {/* Sucursal solo visible en Desktop */}
              {isDesktop && currentBranch && (
                <ThemedText type="caption" variant="secondary" numberOfLines={1}>
                  {currentBranch.name}
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
                    {getDisplayName()}
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
                <View style={styles.section}>
                  <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                    {t.user.changeBranch || 'Sucursales'}
                  </ThemedText>
                  {branches && branches.length > 0 ? (
                    branches
                      .filter((branchAccess) => branchAccess?.branch != null) // Filtrar elementos sin branch válido
                      .map((branchAccess, index) => {
                        const branchItem = branchAccess.branch;
                        if (!branchItem || !branchItem.id) {
                          return null; // No renderizar si no hay branch válido
                        }
                        const isSelected = currentBranch && branchItem.id === currentBranch.id;
                        return (
                          <TouchableOpacity
                            key={branchItem.id || index}
                            style={[
                              styles.branchOption,
                              {
                                backgroundColor: isSelected
                                  ? colors.surface
                                  : 'transparent',
                              },
                            ]}
                            onPress={() => handleBranchSwitch(branchItem)}
                            disabled={isSelected}
                          >
                            <View style={styles.branchOptionInfo}>
                              <ThemedText
                                type="defaultSemiBold"
                                variant={isSelected ? undefined : 'primary'}
                              >
                                {branchItem.name || `OPCIÓN ${index + 1}`}
                              </ThemedText>
                            </View>
                            {isSelected && (
                              <ThemedText style={{ color: colors.text }}>✓</ThemedText>
                            )}
                          </TouchableOpacity>
                        );
                      })
                      .filter((item) => item !== null) // Eliminar nulls del array
                  ) : (
                    <ThemedText type="body2" variant="secondary">
                      No hay sucursales disponibles
                    </ThemedText>
                  )}
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

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

