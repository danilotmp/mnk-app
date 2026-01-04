/**
 * Componente para el panel de mensajes rápidos y recomendaciones
 */
import { ThemedText } from '@/components/themed-text';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { useTheme } from '@/hooks/use-theme';
import { CatalogService } from '@/src/domains/catalog/services/catalog.service';
import type { CatalogEntry } from '@/src/domains/catalog/types';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { Ionicons } from '@expo/vector-icons';
import type { Recommendation } from '@/src/domains/commercial/types';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { quickMessagesPanelStyles } from './quick-messages-panel.styles';
import type { QuickMessagesPanelProps } from './quick-messages-panel.types';

export const QuickMessagesPanel = React.memo(({
  quickMessages,
  recommendations,
  loadingRecommendations,
  onQuickMessageSelect,
  onRecommendationSelect,
  onClose,
  onRefresh,
  catalogId,
  companyId,
  companyCode,
  isMobile,
  colors,
}: QuickMessagesPanelProps) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMessage, setEditingMessage] = useState<CatalogEntry | null>(null);
  const [newMessageText, setNewMessageText] = useState('');
  const [saving, setSaving] = useState(false);
  const alert = useAlert();
  const { isDark } = useTheme();
  
  // Usar surfaceVariant o background para fondo opaco del modal
  const modalBackgroundColor = isDark 
    ? (colors.surfaceVariant || colors.background || '#1E293B')
    : (colors.surfaceVariant || colors.surface || '#FFFFFF');

  const filteredQuickMessages = quickMessages.filter(
    msg => searchFilter === '' || msg.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const filteredRecommendations = recommendations.filter(
    rec => searchFilter === '' || rec.message.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Generar código secuencial para nuevo mensaje
  const generateNextCode = (): string => {
    if (!companyCode) return `MSG_${Date.now()}`;
    
    // Contar mensajes existentes de la empresa para generar secuencial
    const companyMessages = quickMessages.filter(msg => msg.companyId === companyId);
    const nextNumber = companyMessages.length + 1;
    return `${companyCode}_MSG_${nextNumber}`;
  };

  // Crear nuevo mensaje rápido
  const handleCreateMessage = async () => {
    if (!newMessageText.trim() || !catalogId || !companyId) {
      alert.showError('Error', 'Faltan datos necesarios para crear el mensaje');
      return;
    }

    setSaving(true);
    try {
      const code = generateNextCode();
      await CatalogService.createCatalogDetail(catalogId, {
        code,
        name: newMessageText.trim(),
        description: null,
        companyId: companyId,
        parentId: null,
        externalCode: null,
        metadata: null,
      });
      
      alert.showSuccess('Mensaje creado', 'El mensaje rápido se ha creado correctamente');
      setNewMessageText('');
      setShowAddModal(false);
      onRefresh();
    } catch (error: any) {
      alert.showError('Error', error.message || 'Error al crear el mensaje');
    } finally {
      setSaving(false);
    }
  };

  // Editar mensaje rápido
  const handleEditMessage = async () => {
    if (!editingMessage || !newMessageText.trim()) {
      alert.showError('Error', 'Faltan datos necesarios para editar el mensaje');
      return;
    }

    setSaving(true);
    try {
      await CatalogService.updateCatalogDetail(editingMessage.id, {
        name: newMessageText.trim(),
      });
      
      alert.showSuccess('Mensaje actualizado', 'El mensaje rápido se ha actualizado correctamente');
      setNewMessageText('');
      setEditingMessage(null);
      setShowEditModal(false);
      onRefresh();
    } catch (error: any) {
      alert.showError('Error', error.message || 'Error al actualizar el mensaje');
    } finally {
      setSaving(false);
    }
  };

  // Eliminar mensaje rápido
  const handleDeleteMessage = async () => {
    if (!editingMessage) {
      return;
    }

    setSaving(true);
    try {
      await CatalogService.deleteCatalogDetail(editingMessage.id);
      
      alert.showSuccess('Mensaje eliminado', 'El mensaje rápido se ha eliminado correctamente');
      setNewMessageText('');
      setEditingMessage(null);
      setShowEditModal(false);
      onRefresh();
    } catch (error: any) {
      alert.showError('Error', error.message || 'Error al eliminar el mensaje');
    } finally {
      setSaving(false);
    }
  };

  // Abrir modal de edición
  const handleOpenEdit = (message: CatalogEntry) => {
    setEditingMessage(message);
    setNewMessageText(message.name);
    setShowEditModal(true);
  };

  // Combinar todos los mensajes en un solo array con tipo identificador
  type MessageItem = 
    | { type: 'quick'; entry: CatalogEntry; id: string }
    | { type: 'loading'; content: ''; id: string }
    | { type: 'recommendation'; content: string; id: string; recommendation: Recommendation }
    | { type: 'add'; id: string };

  const allMessages: MessageItem[] = [
    ...filteredQuickMessages.map(msg => ({ 
      type: 'quick' as const, 
      entry: msg, 
      id: msg.id 
    })),
    ...(loadingRecommendations 
      ? [{ type: 'loading' as const, content: '' as const, id: 'loading' }]
      : filteredRecommendations.map(rec => ({ 
          type: 'recommendation' as const, 
          content: rec.message, 
          id: rec.id, 
          recommendation: rec 
        }))
    ),
    // Botón agregar siempre al final
    { type: 'add' as const, id: 'add-button' },
  ];

  return (
    <>
      <View
        style={[
          quickMessagesPanelStyles.container,
          isMobile && quickMessagesPanelStyles.containerMobile,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        ]}
      >
        {/* Header con buscador y botón cerrar */}
        <View style={[quickMessagesPanelStyles.headerContainer, { borderBottomColor: colors.border }]}>
          <View style={quickMessagesPanelStyles.filterContainer}>
            <InputWithFocus
              containerStyle={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 6,
                backgroundColor: colors.background,
                paddingLeft: 12,
                paddingRight: 12,
                height: 36,
                flex: 1,
              }}
              primaryColor={colors.primary}
            >
              <TextInput
                placeholder="Buscar mensajes..."
                value={searchFilter}
                onChangeText={setSearchFilter}
                style={{
                  padding: 8,
                  color: colors.text,
                  fontSize: 14,
                }}
                placeholderTextColor={colors.textSecondary}
              />
            </InputWithFocus>
          </View>
          <TouchableOpacity
            style={quickMessagesPanelStyles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={[
            quickMessagesPanelStyles.scroll,
            isMobile && quickMessagesPanelStyles.scrollMobile,
          ]}
          contentContainerStyle={[
            quickMessagesPanelStyles.content,
            isMobile && quickMessagesPanelStyles.contentMobile,
          ]}
          horizontal={isMobile}
          showsVerticalScrollIndicator={!isMobile}
          showsHorizontalScrollIndicator={isMobile}
        >
          <View style={[
            quickMessagesPanelStyles.grid,
            isMobile && quickMessagesPanelStyles.gridMobile,
          ]}>
            {allMessages.length > 0 ? (
              allMessages.map((item) => {
                if (item.type === 'loading') {
                  return (
                    <View key={item.id} style={{ padding: 20, alignItems: 'center', justifyContent: 'center', minWidth: 200 }}>
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                  );
                }

                if (item.type === 'add') {
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        quickMessagesPanelStyles.card,
                        isMobile && quickMessagesPanelStyles.cardMobile,
                        { 
                          backgroundColor: colors.surfaceVariant, 
                          borderColor: colors.border,
                          borderStyle: 'dashed',
                          justifyContent: 'center',
                          alignItems: 'center',
                        },
                      ]}
                      onPress={() => {
                        setNewMessageText('');
                        setShowAddModal(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="add" size={24} color={colors.primary} />
                    </TouchableOpacity>
                  );
                }

                const isQuickMessage = item.type === 'quick';
                const iconName = isQuickMessage ? 'flash' : 'bulb';
                const iconColor = isQuickMessage ? colors.primary : '#FFA500';
                const canEdit = isQuickMessage && item.entry.companyId !== null;

                return (
                  <View
                    key={item.id}
                    style={[
                      quickMessagesPanelStyles.card,
                      isMobile && quickMessagesPanelStyles.cardMobile,
                      { 
                        backgroundColor: colors.surfaceVariant, 
                        borderColor: colors.border,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                      onPress={() => {
                        if (item.type === 'quick') {
                          onQuickMessageSelect(item.entry.name);
                        } else if (item.type === 'recommendation') {
                          onRecommendationSelect(item.recommendation);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={quickMessagesPanelStyles.iconContainer}>
                        <Ionicons name={iconName} size={18} color={iconColor} />
                      </View>
                      <ThemedText type="body2" style={{ color: colors.text, textAlign: 'center', flex: 1 }}>
                        {item.type === 'quick' ? item.entry.name : item.content}
                      </ThemedText>
                    </TouchableOpacity>
                    {canEdit && (
                      <TouchableOpacity
                        onPress={() => handleOpenEdit(item.entry)}
                        style={{ padding: 4 }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="pencil" size={16} color={colors.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            ) : (
              <ThemedText type="body2" style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>
                No hay mensajes disponibles
              </ThemedText>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Modal para agregar mensaje */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={[
          quickMessagesPanelStyles.modalOverlay,
          { backgroundColor: 'rgba(0, 0, 0, 0.5)' }
        ]}>
          <View style={[
            quickMessagesPanelStyles.modalContent,
            { backgroundColor: modalBackgroundColor, borderColor: colors.border }
          ]}>
            <View style={[
              quickMessagesPanelStyles.modalHeader,
              { borderBottomColor: colors.border }
            ]}>
              <ThemedText type="h3" style={{ color: colors.text }}>
                Agregar Mensaje Rápido
              </ThemedText>
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  setNewMessageText('');
                }}
                style={quickMessagesPanelStyles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={quickMessagesPanelStyles.modalBody}>
              <ThemedText type="body2" style={{ color: colors.textSecondary, marginBottom: 8 }}>
                Mensaje:
              </ThemedText>
              <InputWithFocus
                containerStyle={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 6,
                  backgroundColor: colors.background,
                  paddingLeft: 12,
                  paddingRight: 12,
                  minHeight: 80,
                }}
                primaryColor={colors.primary}
              >
                <TextInput
                  placeholder="Escribe el mensaje rápido..."
                  value={newMessageText}
                  onChangeText={setNewMessageText}
                  style={{
                    padding: 8,
                    color: colors.text,
                    fontSize: 14,
                    minHeight: 60,
                  }}
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  maxLength={500}
                />
              </InputWithFocus>
            </View>

            <View style={[
              quickMessagesPanelStyles.modalFooter,
              { borderTopColor: colors.border }
            ]}>
              <TouchableOpacity
                style={[
                  quickMessagesPanelStyles.modalButton,
                  { backgroundColor: colors.surfaceVariant, borderColor: colors.border }
                ]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewMessageText('');
                }}
                disabled={saving}
              >
                <ThemedText type="body2" style={{ color: colors.text }}>
                  Cancelar
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  quickMessagesPanelStyles.modalButton,
                  { backgroundColor: colors.primary }
                ]}
                onPress={handleCreateMessage}
                disabled={saving || !newMessageText.trim()}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText type="body2" style={{ color: '#FFFFFF' }}>
                    Crear
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para editar mensaje */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={[
          quickMessagesPanelStyles.modalOverlay,
          { backgroundColor: 'rgba(0, 0, 0, 0.5)' }
        ]}>
          <View style={[
            quickMessagesPanelStyles.modalContent,
            { backgroundColor: modalBackgroundColor, borderColor: colors.border }
          ]}>
            <View style={[
              quickMessagesPanelStyles.modalHeader,
              { borderBottomColor: colors.border }
            ]}>
              <ThemedText type="h3" style={{ color: colors.text }}>
                Editar Mensaje Rápido
              </ThemedText>
              <TouchableOpacity
                onPress={() => {
                  setShowEditModal(false);
                  setNewMessageText('');
                  setEditingMessage(null);
                }}
                style={quickMessagesPanelStyles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={quickMessagesPanelStyles.modalBody}>
              <ThemedText type="body2" style={{ color: colors.textSecondary, marginBottom: 8 }}>
                Mensaje:
              </ThemedText>
              <InputWithFocus
                containerStyle={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 6,
                  backgroundColor: colors.background,
                  paddingLeft: 12,
                  paddingRight: 12,
                  minHeight: 80,
                }}
                primaryColor={colors.primary}
              >
                <TextInput
                  placeholder="Escribe el mensaje rápido..."
                  value={newMessageText}
                  onChangeText={setNewMessageText}
                  style={{
                    padding: 8,
                    color: colors.text,
                    fontSize: 14,
                    minHeight: 60,
                  }}
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  maxLength={500}
                />
              </InputWithFocus>
            </View>

            <View style={[
              quickMessagesPanelStyles.modalFooter,
              { borderTopColor: colors.border }
            ]}>
              <TouchableOpacity
                style={[
                  quickMessagesPanelStyles.modalButton,
                  { backgroundColor: colors.error || '#DC143C', borderColor: colors.error || '#DC143C' }
                ]}
                onPress={handleDeleteMessage}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText type="body2" style={{ color: '#FFFFFF' }}>
                    Eliminar
                  </ThemedText>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  quickMessagesPanelStyles.modalButton,
                  { backgroundColor: colors.surfaceVariant, borderColor: colors.border }
                ]}
                onPress={() => {
                  setShowEditModal(false);
                  setNewMessageText('');
                  setEditingMessage(null);
                }}
                disabled={saving}
              >
                <ThemedText type="body2" style={{ color: colors.text }}>
                  Cancelar
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  quickMessagesPanelStyles.modalButton,
                  { backgroundColor: colors.primary }
                ]}
                onPress={handleEditMessage}
                disabled={saving || !newMessageText.trim()}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText type="body2" style={{ color: '#FFFFFF' }}>
                    Guardar
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
});

QuickMessagesPanel.displayName = 'QuickMessagesPanel';
