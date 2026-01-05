/**
 * Componente para el panel de información del contacto
 */
import { ThemedText } from '@/components/themed-text';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { Tooltip } from '@/components/ui/tooltip';
import { useCompany } from '@/src/domains/shared';
import { DatePicker, EmailInput, PhoneInput } from '@/src/domains/shared/components';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Animated, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { contactInfoPanelStyles } from './contact-info-panel.styles';
import type { ContactInfoPanelProps } from './contact-info-panel.types';

type TabType = 'cliente' | 'agendamiento' | 'ordenes' | 'pagos';

export const ContactInfoPanel = React.memo(({
  contact,
  availableTags,
  isMobile,
  panelAnim,
  onClose,
  colors,
}: ContactInfoPanelProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('cliente');
  const [isEditing, setIsEditing] = useState(false);
  const [editedValues, setEditedValues] = useState({
    name: contact.name,
    phoneNumber: contact.phoneNumber,
    email: contact.email || '',
    identification: '',
    birthDate: null as string | null,
  });
  const [saving, setSaving] = useState(false);
  const { company } = useCompany();
  const dateFormat = company?.settings?.dateFormat || 'DD/MM/YYYY';
  
  const handleStartEdit = () => {
    setIsEditing(true);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedValues({
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      email: contact.email || '',
      identification: '',
      birthDate: null,
    });
  };
  
  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Implementar guardado del contacto
      // Aquí se debe llamar al servicio para actualizar el contacto
      await new Promise((resolve) => setTimeout(resolve, 500));
      setIsEditing(false);
    } catch (error) {
      // Manejar errores
      console.error('Error al guardar contacto:', error);
    } finally {
      setSaving(false);
    }
  };
  const containerStyle = isMobile
    ? [
        contactInfoPanelStyles.modal,
        {
          backgroundColor: colors.surfaceVariant,
          opacity: panelAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0],
          }),
          transform: [
            {
              translateX: panelAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 400],
              }),
            },
          ],
        },
      ]
    : [
        contactInfoPanelStyles.panel,
        {
          backgroundColor: colors.surfaceVariant,
          borderLeftWidth: 1,
          borderLeftColor: colors.border,
          width: panelAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [350, 0],
          }),
          overflow: 'hidden',
        },
      ];

  return (
    <Animated.View style={containerStyle}>
      <ScrollView
        style={contactInfoPanelStyles.scroll}
        contentContainerStyle={isMobile ? { paddingBottom: 20, width: '100%' } : undefined}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        bounces={!isMobile}
        nestedScrollEnabled={false}
      >
        {/* Header con avatar y nombre */}
        <View style={contactInfoPanelStyles.headerSection}>
          {/* Botón para cerrar el panel en la esquina superior derecha */}
          <TouchableOpacity
            style={contactInfoPanelStyles.headerCloseButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[contactInfoPanelStyles.avatarSmall, { backgroundColor: colors.primary + '30' }]}>
            <Ionicons name="person" size={32} color={colors.primary} />
          </View>
          <ThemedText type="body2" style={{ marginTop: 12, color: colors.text, fontWeight: '600', fontSize: 16 }}>
            {contact.name}
          </ThemedText>

          {/* Información con iconos */}
          <View style={contactInfoPanelStyles.iconsRow}>
            <View style={contactInfoPanelStyles.iconItem}>
              <Ionicons name="call" size={16} color={colors.textSecondary} />
              <ThemedText type="caption" style={{ marginLeft: 6, color: colors.textSecondary }}>
                {contact.phoneNumber}
              </ThemedText>
            </View>
            <View style={contactInfoPanelStyles.iconItem}>
              <Ionicons name="calendar" size={16} color={colors.textSecondary} />
              <ThemedText type="caption" style={{ marginLeft: 6, color: colors.textSecondary }}>
                Agendamientos: 0
              </ThemedText>
            </View>
            <View style={contactInfoPanelStyles.iconItem}>
              <Ionicons name="cart-outline" size={16} color={colors.textSecondary} />
              <ThemedText type="caption" style={{ marginLeft: 6, color: colors.textSecondary }}>
                Órdenes: 0
              </ThemedText>
            </View>
            <View style={contactInfoPanelStyles.iconItem}>
              <Ionicons name="card" size={16} color={colors.textSecondary} />
              <ThemedText type="caption" style={{ marginLeft: 6, color: colors.textSecondary }}>
                Pagos: 0
              </ThemedText>
            </View>
          </View>

          {/* Barra de navegación */}
          <View style={contactInfoPanelStyles.navBar}>
            <Tooltip text="Cliente" position="top">
              <TouchableOpacity 
                style={[
                  contactInfoPanelStyles.navItem, 
                  activeTab === 'cliente' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
                ]}
                onPress={() => setActiveTab('cliente')}
              >
                <Ionicons 
                  name="person" 
                  size={20} 
                  color={activeTab === 'cliente' ? colors.primary : colors.textSecondary} 
                />
              </TouchableOpacity>
            </Tooltip>
            <Tooltip text="Agendamiento" position="top">
              <TouchableOpacity 
                style={[
                  contactInfoPanelStyles.navItem,
                  activeTab === 'agendamiento' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
                ]}
                onPress={() => setActiveTab('agendamiento')}
              >
                <Ionicons 
                  name="calendar" 
                  size={20} 
                  color={activeTab === 'agendamiento' ? colors.primary : colors.textSecondary} 
                />
              </TouchableOpacity>
            </Tooltip>
            <Tooltip text="Ordenes" position="top">
              <TouchableOpacity 
                style={[
                  contactInfoPanelStyles.navItem,
                  activeTab === 'ordenes' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
                ]}
                onPress={() => setActiveTab('ordenes')}
              >
                <Ionicons 
                  name="cart" 
                  size={20} 
                  color={activeTab === 'ordenes' ? colors.primary : colors.textSecondary} 
                />
              </TouchableOpacity>
            </Tooltip>
            <Tooltip text="Pagos" position="top">
              <TouchableOpacity 
                style={[
                  contactInfoPanelStyles.navItem,
                  activeTab === 'pagos' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
                ]}
                onPress={() => setActiveTab('pagos')}
              >
                <Ionicons 
                  name="card" 
                  size={20} 
                  color={activeTab === 'pagos' ? colors.primary : colors.textSecondary} 
                />
              </TouchableOpacity>
            </Tooltip>
          </View>
        </View>

        {/* Contenido según el tab activo */}
        {activeTab === 'cliente' && (
          <>
            {/* Detalles del cliente */}
            <View style={contactInfoPanelStyles.section}>
              <View style={[contactInfoPanelStyles.sectionHeader, { borderBottomColor: colors.border }]}>
                <ThemedText type="body2" style={{ color: colors.text, fontWeight: '600' }}>
                  Detalles del cliente
                </ThemedText>
                {!isEditing ? (
                  <TouchableOpacity onPress={handleStartEdit}>
                    <Ionicons name="pencil" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={handleCancelEdit} disabled={saving}>
                    <Ionicons name="close" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
              <View style={contactInfoPanelStyles.details}>
                <View style={contactInfoPanelStyles.detailRow}>
                  <ThemedText type="body2" style={[contactInfoPanelStyles.detailLabel, { color: colors.textSecondary }]}>
                    Nombres:
                  </ThemedText>
                  {isEditing ? (
                    <InputWithFocus
                      containerStyle={[
                        styles.editInput,
                        { borderColor: colors.border, backgroundColor: colors.surfaceVariant },
                      ]}
                      primaryColor={colors.primary}
                    >
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={editedValues.name}
                        onChangeText={(text) => setEditedValues({ ...editedValues, name: text })}
                        placeholder="Nombre"
                        placeholderTextColor={colors.textSecondary}
                        editable={!saving}
                      />
                    </InputWithFocus>
                  ) : (
                    <ThemedText type="body2" style={[contactInfoPanelStyles.detailValue, { color: colors.text }]}>
                      {contact.name}
                    </ThemedText>
                  )}
                </View>
                <View style={contactInfoPanelStyles.detailRow}>
                  <ThemedText type="body2" style={[contactInfoPanelStyles.detailLabel, { color: colors.textSecondary }]}>
                    Teléfono:
                  </ThemedText>
                  {isEditing ? (
                    <PhoneInput
                      value={editedValues.phoneNumber}
                      onChangeText={(text) => setEditedValues({ ...editedValues, phoneNumber: text })}
                      placeholder="Teléfono"
                      disabled={saving}
                      containerStyle={[
                        styles.editInput,
                        { borderColor: colors.border, backgroundColor: colors.surfaceVariant },
                      ]}
                    />
                  ) : (
                    <ThemedText type="body2" style={[contactInfoPanelStyles.detailValue, { color: colors.text }]}>
                      {contact.phoneNumber}
                    </ThemedText>
                  )}
                </View>
                <View style={contactInfoPanelStyles.detailRow}>
                  <ThemedText type="body2" style={[contactInfoPanelStyles.detailLabel, { color: colors.textSecondary }]}>
                    Email:
                  </ThemedText>
                  {isEditing ? (
                    <EmailInput
                      value={editedValues.email}
                      onChangeText={(text) => setEditedValues({ ...editedValues, email: text })}
                      placeholder="Email"
                      disabled={saving}
                      containerStyle={[
                        styles.editInput,
                        { borderColor: colors.border, backgroundColor: colors.surfaceVariant },
                      ]}
                    />
                  ) : (
                    <ThemedText type="body2" style={[contactInfoPanelStyles.detailValue, { color: colors.text }]}>
                      {contact.email || ''}
                    </ThemedText>
                  )}
                </View>
                <View style={contactInfoPanelStyles.detailRow}>
                  <ThemedText type="body2" style={[contactInfoPanelStyles.detailLabel, { color: colors.textSecondary }]}>
                    Identificación:
                  </ThemedText>
                  {isEditing ? (
                    <InputWithFocus
                      containerStyle={[
                        styles.editInput,
                        { borderColor: colors.border, backgroundColor: colors.surfaceVariant },
                      ]}
                      primaryColor={colors.primary}
                    >
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={editedValues.identification}
                        onChangeText={(text) => setEditedValues({ ...editedValues, identification: text })}
                        placeholder="Identificación"
                        placeholderTextColor={colors.textSecondary}
                        editable={!saving}
                      />
                    </InputWithFocus>
                  ) : (
                    <ThemedText type="body2" style={[contactInfoPanelStyles.detailValue, { color: colors.text }]}>
                      {editedValues.identification || ''}
                    </ThemedText>
                  )}
                </View>
                <View style={contactInfoPanelStyles.detailRow}>
                  <ThemedText type="body2" style={[contactInfoPanelStyles.detailLabel, { color: colors.textSecondary }]}>
                    F Nacimiento:
                  </ThemedText>
                  {isEditing ? (
                    <View style={contactInfoPanelStyles.datePickerContainer}>
                      <DatePicker
                        value={editedValues.birthDate}
                        onChange={(date) => setEditedValues({ ...editedValues, birthDate: date })}
                        displayFormat={dateFormat}
                        placeholder={dateFormat}
                        disabled={saving}
                      />
                    </View>
                  ) : (
                    <ThemedText type="body2" style={[contactInfoPanelStyles.detailValue, { color: colors.text }]}>
                      {editedValues.birthDate || ''}
                    </ThemedText>
                  )}
                </View>
              </View>
              {isEditing && (
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={[styles.editButton, { borderColor: colors.primary, backgroundColor: 'transparent' }]}
                    onPress={handleCancelEdit}
                    disabled={saving}
                  >
                    <ThemedText type="body2" style={{ color: colors.primary }}>
                      Cancelar
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editButton, { backgroundColor: colors.primary }]}
                    onPress={handleSave}
                    disabled={saving}
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
              )}
              {!isEditing && (
                <TouchableOpacity style={contactInfoPanelStyles.seeMore}>
                  <ThemedText type="caption" style={{ color: colors.primary }}>
                    Ver más
                  </ThemedText>
                  <Ionicons name="chevron-down" size={16} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Etiquetas */}
            <View style={contactInfoPanelStyles.section}>
              <View style={[contactInfoPanelStyles.sectionHeader, { borderBottomColor: colors.border }]}>
                <ThemedText type="body2" style={{ color: colors.text, fontWeight: '600' }}>
                  Etiquetas
                </ThemedText>
                <TouchableOpacity>
                  <Ionicons name="pencil" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={contactInfoPanelStyles.tagsContainer}>
                {contact.tags && contact.tags.length > 0 ? (
                  contact.tags.map((tagId) => {
                    const tag = availableTags.find(t => t.id === tagId);
                    if (!tag) return null;
                    return (
                      <View
                        key={tagId}
                        style={[contactInfoPanelStyles.infoTag, { backgroundColor: tag.color }]}
                      >
                        <ThemedText type="caption" style={{ color: '#FFFFFF' }}>
                          {tag.label}
                        </ThemedText>
                      </View>
                    );
                  })
                ) : (
                  <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                    Sin etiquetas
                  </ThemedText>
                )}
              </View>
            </View>
          </>
        )}

        {/* Panel de Agendamiento */}
        {activeTab === 'agendamiento' && (
          <View style={contactInfoPanelStyles.section}>
            <View style={[contactInfoPanelStyles.sectionHeader, { borderBottomColor: colors.border }]}>
              <ThemedText type="body2" style={{ color: colors.text, fontWeight: '600' }}>
                Agendamiento
              </ThemedText>
            </View>
            <View style={[contactInfoPanelStyles.emptyState, { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }]}>
              <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
              <ThemedText type="body2" style={{ color: colors.textSecondary, marginTop: 16, textAlign: 'center' }}>
                No hay citas agendadas
              </ThemedText>
            </View>
          </View>
        )}

        {/* Panel de Ordenes */}
        {activeTab === 'ordenes' && (
          <View style={contactInfoPanelStyles.section}>
            <View style={[contactInfoPanelStyles.sectionHeader, { borderBottomColor: colors.border }]}>
              <ThemedText type="body2" style={{ color: colors.text, fontWeight: '600' }}>
                Órdenes
              </ThemedText>
            </View>
            <View style={[contactInfoPanelStyles.emptyState, { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }]}>
              <Ionicons name="cart-outline" size={48} color={colors.textSecondary} />
              <ThemedText type="body2" style={{ color: colors.textSecondary, marginTop: 16, textAlign: 'center' }}>
                No hay órdenes registradas
              </ThemedText>
            </View>
          </View>
        )}

        {/* Panel de Pagos */}
        {activeTab === 'pagos' && (
          <View style={contactInfoPanelStyles.section}>
            <View style={[contactInfoPanelStyles.sectionHeader, { borderBottomColor: colors.border }]}>
              <ThemedText type="body2" style={{ color: colors.text, fontWeight: '600' }}>
                Pagos
              </ThemedText>
            </View>
            <View style={[contactInfoPanelStyles.emptyState, { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }]}>
              <Ionicons name="card-outline" size={48} color={colors.textSecondary} />
              <ThemedText type="body2" style={{ color: colors.textSecondary, marginTop: 16, textAlign: 'center' }}>
                No hay pagos registrados
              </ThemedText>
            </View>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
});

ContactInfoPanel.displayName = 'ContactInfoPanel';

const styles = StyleSheet.create({
  editInput: {
    flex: 1,
    minHeight: 36,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  input: {
    fontSize: 14,
    minHeight: 20,
    padding: 0,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
});
