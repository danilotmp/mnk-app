/**
 * Componente para Capa de Conexión WhatsApp
 * Gestiona las instancias de WhatsApp con tabla CRUD
 */

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { SideModal } from '@/components/ui/side-modal';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tooltip } from '@/components/ui/tooltip';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { CommercialService } from '@/src/domains/commercial';
import type { WhatsAppInstance } from '@/src/domains/commercial/types';
import { DataTable } from '@/src/domains/shared/components/data-table/data-table';
import type { TableColumn } from '@/src/domains/shared/components/data-table/data-table.types';
import { useCompany } from '@/src/domains/shared';
import { PhoneInput } from '@/src/domains/shared/components';
import { CustomSwitch } from '@/src/domains/shared/components/custom-switch/custom-switch';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { formatCode } from '@/src/infrastructure/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface WhatsAppConnectionLayerProps {
  onProgressUpdate?: (progress: number) => void;
  onDataChange?: (hasData: boolean) => void;
  onComplete?: () => void;
}

export interface WhatsAppConnectionLayerRef {
  handleCreate: () => void;
}

interface WhatsAppInstanceFormData {
  whatsapp: string;
  isActive?: boolean;
}

export const WhatsAppConnectionLayer = forwardRef<WhatsAppConnectionLayerRef, WhatsAppConnectionLayerProps>(
  ({ onProgressUpdate, onDataChange }, ref) => {
    const { colors, isDark } = useTheme();
    const { isMobile } = useResponsive();
    const alert = useAlert();
    const { company } = useCompany();
    const actionIconColor = isDark ? colors.primaryDark : colors.primary;

    const [loading, setLoading] = useState(true);
    const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view-qr' | null>(null);
    const [selectedInstance, setSelectedInstance] = useState<WhatsAppInstance | null>(null);
    const [generatingQR, setGeneratingQR] = useState(false);
    const [formData, setFormData] = useState<WhatsAppInstanceFormData>({ whatsapp: '', isActive: true });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [generatedQR, setGeneratedQR] = useState<string | null>(null);

    // Cargar instancias al montar
    useEffect(() => {
      if (!company?.id) {
        setLoading(false);
        return;
      }
      loadInstances();
    }, [company?.id]);

      const loadInstances = async () => {
      if (!company?.id) return;
      try {
        setLoading(true);
        const profile = await CommercialService.getProfile(company.id);
        const loadedInstances = profile.whatsappInstances || [];
        setInstances(loadedInstances);
        
        // Actualizar progreso basado en si hay instancias activas
        const hasActiveInstances = loadedInstances.some(inst => inst.isActive);
        onProgressUpdate?.(hasActiveInstances ? 100 : 0);
        onDataChange?.(hasActiveInstances);
      } catch (error: any) {
        console.error('Error al cargar instancias de WhatsApp:', error);
        alert.showError('Error al cargar instancias de WhatsApp');
      } finally {
        setLoading(false);
      }
    };

    const handleCreate = () => {
      setFormData({ whatsapp: '', isActive: true });
      setFormErrors({});
      setSelectedInstance(null);
      setModalMode('create');
      setIsModalVisible(true);
    };

    // Exponer handleCreate a través de la ref
    useImperativeHandle(ref, () => ({
      handleCreate,
    }));

    const handleEdit = (instance: WhatsAppInstance) => {
      setFormData({ whatsapp: instance.whatsapp, isActive: instance.isActive });
      setFormErrors({});
      setSelectedInstance(instance);
      setModalMode('edit');
      setIsModalVisible(true);
    };

    const handleViewQR = (instance: WhatsAppInstance) => {
      setSelectedInstance(instance);
      setModalMode('view-qr');
      setIsModalVisible(true);
    };

    const handleCloseModal = () => {
      setIsModalVisible(false);
      setModalMode(null);
      setSelectedInstance(null);
      setFormData({ whatsapp: '' });
      setFormErrors({});
      setGeneratedQR(null);
    };

    const validateForm = (): boolean => {
      const errors: Record<string, string> = {};
      if (!formData.whatsapp.trim()) {
        errors.whatsapp = 'El número de WhatsApp es requerido';
      }
      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    };

    const handleGenerateQR = async () => {
      if (!company?.id || !selectedInstance) return;
      
      setGeneratingQR(true);
      try {
        // Regenerar QR para la instancia seleccionada
        const updatedInstance = await CommercialService.regenerateWhatsAppQR(company.id, selectedInstance.id);
        
        // Actualizar en la lista local
        const updatedInstances = instances.map(inst => 
          inst.id === updatedInstance.id ? updatedInstance : inst
        );
        setInstances(updatedInstances);
        
        // Actualizar instancia seleccionada para mostrar nuevo QR
        setSelectedInstance(updatedInstance);
        
        alert.showSuccess('Código QR regenerado correctamente');
      } catch (error: any) {
        const errorMessage = error?.message || 'Error al regenerar el código QR';
        alert.showError(errorMessage);
      } finally {
        setGeneratingQR(false);
      }
    };

    const handleGenerateFromInput = async () => {
      if (!company?.id) return;
      
      if (!formData.whatsapp.trim()) {
        setFormErrors({ whatsapp: 'El número de WhatsApp es requerido' });
        return;
      }
      
      setGeneratingQR(true);
      try {
        const whatsappValue = formatCode(formData.whatsapp.trim());
        
        // Paso 1: Crear instancia de WhatsApp
        const createResponse = await CommercialService.createWhatsAppInstance(whatsappValue);
        
        if (!createResponse.success) {
          alert.showError('Error al crear la instancia de WhatsApp');
          return;
        }

        // Paso 2: Obtener QR code
        const qrResponse = await CommercialService.getWhatsAppQRCode(whatsappValue);
        
        if (!qrResponse.qrcode) {
          alert.showError('Error al obtener el código QR');
          return;
        }

        // Guardar el QR generado en el estado
        setGeneratedQR(qrResponse.qrcode);
        
        alert.showSuccess('Código QR generado correctamente');
      } catch (error: any) {
        const errorMessage = error?.message || 'Error al generar el código QR';
        alert.showError(errorMessage);
      } finally {
        setGeneratingQR(false);
      }
    };

    const handleSave = async () => {
      if (!company?.id) return;
      
      if (!validateForm()) return;
      
      setSaving(true);
      try {
        const whatsappValue = formatCode(formData.whatsapp.trim());
        
        if (modalMode === 'create') {
          // Crear nueva instancia con el QR generado si existe
          const newInstance = await CommercialService.createWhatsAppInstanceInProfile(company.id, {
            whatsapp: whatsappValue,
            whatsappQR: generatedQR,
            isActive: true,
          });
          
          setInstances(prev => [...prev, newInstance]);
          
          // Actualizar progreso con la nueva lista
          const updatedInstances = [...instances, newInstance];
          const hasActiveInstances = updatedInstances.some(inst => inst.isActive);
          onProgressUpdate?.(hasActiveInstances ? 100 : 0);
          onDataChange?.(hasActiveInstances);
          
          // Si la instancia tiene QR, mostrar el modal de QR automáticamente
          if (newInstance.whatsappQR) {
            setSelectedInstance(newInstance);
            setModalMode('view-qr');
            setIsModalVisible(true);
            setGeneratedQR(null); // Limpiar QR generado
            alert.showSuccess('Instancia de WhatsApp creada correctamente');
          } else {
            handleCloseModal();
            alert.showSuccess('Instancia de WhatsApp creada correctamente');
          }
        } else if (modalMode === 'edit' && selectedInstance) {
          // Actualizar instancia existente
          const updatedInstance = await CommercialService.updateWhatsAppInstance(
            company.id,
            selectedInstance.id,
            { 
              whatsapp: whatsappValue,
              isActive: formData.isActive
            }
          );
          
          setInstances(prev => prev.map(inst => 
            inst.id === updatedInstance.id ? updatedInstance : inst
          ));
          
          // Si se actualizó el WhatsApp y tiene QR, actualizar la instancia seleccionada
          if (updatedInstance.whatsappQR && selectedInstance) {
            setSelectedInstance(updatedInstance);
          }
          
          // Actualizar progreso con la lista actualizada
          const updatedInstances = instances.map(inst => 
            inst.id === updatedInstance.id ? updatedInstance : inst
          );
          const hasActiveInstances = updatedInstances.some(inst => inst.isActive);
          onProgressUpdate?.(hasActiveInstances ? 100 : 0);
          onDataChange?.(hasActiveInstances);
          
          alert.showSuccess('Instancia de WhatsApp actualizada correctamente');
          handleCloseModal();
        }
      } catch (error: any) {
        const errorMessage = error?.message || 'Error al guardar la instancia';
        alert.showError(errorMessage);
      } finally {
        setSaving(false);
      }
    };

    const handleDelete = async (instance: WhatsAppInstance) => {
      if (!company?.id) return;
      
      alert.showConfirm(
        'Eliminar instancia',
        `¿Seguro que deseas eliminar la instancia de WhatsApp ${instance.whatsapp}? Esta acción no se puede deshacer.`,
        async () => {
          try {
            await CommercialService.deleteWhatsAppInstance(company.id, instance.id);
            const remainingInstances = instances.filter(inst => inst.id !== instance.id);
            setInstances(remainingInstances);
            
            // Actualizar progreso con la lista actualizada
            const hasActiveInstances = remainingInstances.some(inst => inst.isActive);
            onProgressUpdate?.(hasActiveInstances ? 100 : 0);
            onDataChange?.(hasActiveInstances);
            
            alert.showSuccess('Instancia eliminada correctamente');
          } catch (error: any) {
            const errorMessage = error?.message || 'Error al eliminar la instancia';
            alert.showError(errorMessage);
          }
        }
      );
    };

    const handleToggleStatus = async (instance: WhatsAppInstance) => {
      if (!company?.id) return;
      
      try {
        const updatedInstance = await CommercialService.toggleWhatsAppInstanceStatus(
          company.id,
          instance.id,
          !instance.isActive
        );
        
        const updatedInstances = instances.map(inst => 
          inst.id === updatedInstance.id ? updatedInstance : inst
        );
        setInstances(updatedInstances);
        
        // Actualizar progreso con la lista actualizada
        const hasActiveInstances = updatedInstances.some(inst => inst.isActive);
        onProgressUpdate?.(hasActiveInstances ? 100 : 0);
        onDataChange?.(hasActiveInstances);
        
        alert.showSuccess(
          updatedInstance.isActive 
            ? 'Instancia activada correctamente' 
            : 'Instancia desactivada correctamente'
        );
      } catch (error: any) {
        const errorMessage = error?.message || 'Error al cambiar el estado de la instancia';
        alert.showError(errorMessage);
      }
    };

    // Columnas de la tabla
    const columns: TableColumn<WhatsAppInstance>[] = [
      {
        key: 'whatsapp',
        label: 'WhatsApp',
        width: '25%',
      },
      {
        key: 'whatsappQR',
        label: 'QR Code',
        width: '20%',
        render: (instance) => (
          instance.whatsappQR ? (
            <TouchableOpacity onPress={() => handleViewQR(instance)}>
              <View style={[styles.qrBadge, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
                <Ionicons name="qr-code" size={16} color={colors.primary} />
                <ThemedText type="caption" style={{ color: colors.primary, marginLeft: 4 }}>
                  Ver QR
                </ThemedText>
              </View>
            </TouchableOpacity>
          ) : (
            <ThemedText type="caption" style={{ color: colors.textSecondary }}>
              Sin QR
            </ThemedText>
          )
        ),
      },
      {
        key: 'isActive',
        label: 'Estado',
        width: '15%',
        align: 'center',
        render: (instance) => (
          <StatusBadge 
            status={instance.isActive ? 1 : 0}
            statusDescription={instance.isActive ? 'Activa' : 'Inactiva'}
            size="small"
          />
        ),
      },
      {
        key: 'actions',
        label: 'Acciones',
        width: '40%',
        align: 'center',
        render: (instance) => (
          <View style={styles.actionsContainer}>
            {instance.whatsappQR && (
              <Tooltip text="Ver QR" position="left">
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleViewQR(instance)}
                >
                  <Ionicons name="qr-code" size={18} color={actionIconColor} />
                </TouchableOpacity>
              </Tooltip>
            )}
            <Tooltip text={instance.isActive ? 'Desactivar' : 'Activar'} position="left">
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleToggleStatus(instance)}
              >
                <Ionicons 
                  name={instance.isActive ? 'eye-off' : 'eye'} 
                  size={18} 
                  color={actionIconColor} 
                />
              </TouchableOpacity>
            </Tooltip>
            <Tooltip text="Editar" position="left">
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEdit(instance)}
              >
                <Ionicons name="pencil" size={18} color={actionIconColor} />
              </TouchableOpacity>
            </Tooltip>
            <Tooltip text="Eliminar" position="left">
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDelete(instance)}
              >
                <Ionicons name="trash" size={18} color={actionIconColor} />
              </TouchableOpacity>
            </Tooltip>
          </View>
        ),
      },
    ];

    return (
      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        <View style={styles.formContainer}>
          {/* Tabla de instancias */}
          <View style={styles.tableContainer}>
            <DataTable
              data={instances}
              columns={columns}
              loading={loading}
              emptyMessage="No hay instancias de WhatsApp. Crea una para comenzar."
              keyExtractor={(instance) => instance.id}
              showPagination={false}
            />
          </View>

          {/* Modal de crear/editar */}
          {(modalMode === 'create' || modalMode === 'edit') && (
            <SideModal
              visible={isModalVisible}
              onClose={handleCloseModal}
              title={modalMode === 'edit' ? 'Editar Instancia' : 'Crear Instancia'}
              subtitle={modalMode === 'edit' ? 'Modifica los datos de la instancia' : 'Completa los datos para crear una nueva instancia'}
              footer={
                <>
                  <Button
                    title="Cancelar"
                    onPress={handleCloseModal}
                    variant="outline"
                    size="md"
                    disabled={saving || generatingQR}
                  />
                  <Button
                    title={saving ? 'Guardando...' : 'Guardar'}
                    onPress={handleSave}
                    variant="primary"
                    size="md"
                    disabled={saving || generatingQR}
                  >
                    {saving && (
                      <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                    )}
                  </Button>
                </>
              }
            >
              <View style={styles.modalContent}>
                <View style={styles.inputGroup}>
                  <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
                    Número de WhatsApp
                  </ThemedText>
                  <PhoneInput
                    value={formData.whatsapp}
                    onChangeText={(val) => {
                      const formatted = formatCode(val);
                      setFormData(prev => ({ ...prev, whatsapp: formatted }));
                      if (formErrors.whatsapp) {
                        setFormErrors(prev => {
                          const next = { ...prev };
                          delete next.whatsapp;
                          return next;
                        });
                      }
                    }}
                    placeholder="Ej: 593996294267 o MI_CODIGO"
                    error={!!formErrors.whatsapp}
                    errorMessage={formErrors.whatsapp}
                    maxLength={15}
                  />
                  <ThemedText type="caption" style={{ color: colors.textSecondary, marginTop: 4 }}>
                    Número de WhatsApp o identificador IA
                  </ThemedText>
                  
                  {/* Switch de estado activo/inactivo - Solo en modo edición */}
                  {modalMode === 'edit' && (
                    <View style={{ marginTop: 16 }}>
                      <CustomSwitch
                        value={formData.isActive ?? false}
                        onValueChange={(value) => {
                          setFormData(prev => ({ ...prev, isActive: value }));
                        }}
                        label="Estado de la instancia"
                      />
                      <ThemedText type="caption" style={{ color: colors.textSecondary, marginTop: 4 }}>
                        {formData.isActive ? 'La instancia está activa y disponible para uso' : 'La instancia está inactiva y no estará disponible'}
                      </ThemedText>
                    </View>
                  )}
                  
                  {/* Botón Generar QR - Solo mostrar si no hay QR generado y estamos en modo creación */}
                  {modalMode === 'create' && !generatedQR && (
                    <View style={{ marginTop: 12 }}>
                      <Button
                        title={generatingQR ? 'Generando...' : 'Generar'}
                        onPress={handleGenerateFromInput}
                        variant="outline"
                        size="md"
                        disabled={generatingQR || !formData.whatsapp.trim()}
                      >
                        {generatingQR ? (
                          <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
                        ) : (
                          <Ionicons name="qr-code-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                        )}
                      </Button>
                    </View>
                  )}
                  
                  {/* Mostrar QR generado si existe (solo en creación) */}
                  {modalMode === 'create' && generatedQR && (
                    <View style={styles.inputGroup}>
                      <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
                        Código QR Generado
                      </ThemedText>
                      <View style={[styles.qrImageContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Image
                          source={{ 
                            uri: generatedQR.startsWith('data:') 
                              ? generatedQR 
                              : `data:image/png;base64,${generatedQR}` 
                          }}
                          style={styles.qrImage}
                          resizeMode="contain"
                        />
                      </View>
                    </View>
                  )}
                </View>

                {/* En modo edición, mostrar QR existente y botón regenerar */}
                {modalMode === 'edit' && selectedInstance && (
                  <View style={styles.inputGroup}>
                    {selectedInstance.whatsappQR && (
                      <>
                        <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
                          Código QR Actual
                        </ThemedText>
                        <View style={[styles.qrImageContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                          <Image
                            source={{ 
                              uri: selectedInstance.whatsappQR.startsWith('data:') 
                                ? selectedInstance.whatsappQR 
                                : `data:image/png;base64,${selectedInstance.whatsappQR}` 
                            }}
                            style={styles.qrImage}
                            resizeMode="contain"
                          />
                        </View>
                      </>
                    )}
                    <View style={{ marginTop: 12 }}>
                      <Button
                        title={generatingQR ? 'Regenerando...' : 'Regenerar QR'}
                        onPress={handleGenerateQR}
                        variant="outline"
                        size="md"
                        disabled={generatingQR}
                      >
                        {generatingQR ? (
                          <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
                        ) : (
                          <Ionicons name="refresh-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                        )}
                      </Button>
                    </View>
                  </View>
                )}
              </View>
            </SideModal>
          )}

          {/* Modal de ver QR */}
          {modalMode === 'view-qr' && selectedInstance?.whatsappQR && (
            <SideModal
              visible={isModalVisible}
              onClose={handleCloseModal}
              title="Código QR de WhatsApp"
              subtitle="Escanea este código con WhatsApp para conectar"
              footer={
                <>
                  <Button
                    title="Cerrar"
                    onPress={handleCloseModal}
                    variant="outline"
                    size="md"
                  />
                  <Button
                    title={generatingQR ? 'Regenerando...' : 'Regenerar QR'}
                    onPress={handleGenerateQR}
                    variant="primary"
                    size="md"
                    disabled={generatingQR}
                  >
                    {generatingQR ? (
                      <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                    ) : (
                      <Ionicons name="refresh-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    )}
                  </Button>
                </>
              }
            >
              <View style={styles.modalContent}>
                <ThemedText type="body2" style={[styles.qrInstructions, { color: colors.textSecondary, marginBottom: 16 }]}>
                  1. Abre WhatsApp en tu teléfono{'\n'}
                  2. Ve a Configuración → Dispositivos vinculados{'\n'}
                  3. Toca "Vincular un dispositivo"{'\n'}
                  4. Escanea este código QR
                </ThemedText>
                
                <View style={[styles.qrImageContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Image
                    source={{ 
                      uri: selectedInstance.whatsappQR.startsWith('data:') 
                        ? selectedInstance.whatsappQR 
                        : `data:image/png;base64,${selectedInstance.whatsappQR}` 
                    }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                </View>
              </View>
            </SideModal>
          )}
        </View>
      </ScrollView>
    );
  }
);

WhatsAppConnectionLayer.displayName = 'WhatsAppConnectionLayer';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formContainer: {
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 16,
  },
  tableContainer: {
    marginTop: 0,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
  },
  qrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  modalContent: {
    padding: 20,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontWeight: '600',
    marginBottom: 4,
  },
  qrInstructions: {
    lineHeight: 20,
    textAlign: 'left',
  },
  qrImageContainer: {
    alignSelf: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  qrImage: {
    width: 250,
    height: 250,
  },
});
