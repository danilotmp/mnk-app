import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { isDesktopDevice, isMobileDevice } from '@/constants/breakpoints';
import { useTheme } from '@/hooks/use-theme';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useBranches, useCompany, useMultiCompany } from '../hooks/use-multi-company.hook';
import { Branch } from '../types';

interface UserProfileHeaderProps {
  onLogout?: () => void;
  onSettings?: () => void;
  onProfile?: () => void;
}

export function UserProfileHeader({
  onLogout,
  onSettings,
  onProfile,
}: UserProfileHeaderProps) {
  const { colors } = useTheme();
  const { user, company, branch } = useCompany();
  const { branches, switchBranch } = useBranches();
  const { clearContext } = useMultiCompany();
  const [modalVisible, setModalVisible] = useState(false);
  const [switching, setSwitching] = useState(false);
  
  // Responsive: Detectar tamaño de pantalla
  const { width } = useWindowDimensions();
  const isMobile = isMobileDevice(width);
  const isDesktop = isDesktopDevice(width);

  if (!user || !company || !branch) {
    return null;
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
      console.error('Error al cambiar sucursal:', error);
    } finally {
      setSwitching(false);
    }
  };

  const handleLogout = () => {
    setModalVisible(false);
    clearContext();
    onLogout?.();
  };

  return (
    <>
      {/* Contenedor del perfil y toggle de tema */}
      <View style={styles.profileContainer}>
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
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <ThemedText style={[styles.avatarText, { color: '#FFFFFF' }]}>
            {getInitials()}
          </ThemedText>
        </View>

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

        {/* Icono de dropdown - Solo visible en Tablet y Desktop */}
        {!isMobile && (
          <ThemedText style={styles.dropdownIcon}>▼</ThemedText>
        )}
      </TouchableOpacity>

        {/* Toggle de tema - Al lado del perfil */}
        <ThemeToggle />
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
                        Cambiar Sucursal
                      </ThemedText>
                      {switching ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="small" color={colors.primary} />
                          <ThemedText type="caption" style={{ marginLeft: 8 }}>
                            Cambiando...
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
                                  {branchItem.address.city}
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
                    <ThemedText type="defaultSemiBold">Mi Perfil</ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => {
                      setModalVisible(false);
                      onSettings?.();
                    }}
                  >
                    <ThemedText style={styles.menuIcon}>⚙️</ThemedText>
                    <ThemedText type="defaultSemiBold">Configuración</ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.menuOption} onPress={handleLogout}>
                    <ThemedText style={styles.menuIcon}>🚪</ThemedText>
                    <ThemedText type="defaultSemiBold" variant="error">
                      Cerrar Sesión
                    </ThemedText>
                  </TouchableOpacity>
                </View>

                {/* Botón cerrar */}
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: colors.surface }]}
                  onPress={() => setModalVisible(false)}
                >
                  <ThemedText type="defaultSemiBold">Cerrar</ThemedText>
                </TouchableOpacity>
              </ScrollView>
            </ThemedView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Contenedor del perfil y toggle de tema
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Botón de perfil
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 8,
  },
  // Mobile: Solo avatar, más compacto
  profileButtonMobile: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 18,
    gap: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginRight: 4,
    minWidth: 100, // Evitar que se comprima demasiado
  },
  userName: {
    fontSize: 14,
  },
  dropdownIcon: {
    fontSize: 10,
    opacity: 0.6,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarTextLarge: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  modalUserName: {
    marginBottom: 4,
  },
  badge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },

  // Secciones
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  branchOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  branchOptionInfo: {
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },

  // Menú de opciones
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  menuIcon: {
    fontSize: 20,
  },

  // Botón cerrar
  closeButton: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
});

